"use client";

import { useCallback, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CollaboratorsDialog } from "@/components/notes/editor/CollaboratorsDialog";
import { NoteEditor } from "@/components/notes/editor/NoteEditor";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/format";
import { changedFields, draftFromNote, normalizeTitleAndContent } from "@/lib/noteDraft";

/**
 * Opens an existing note in the full editor. Images and sharing changes are saved immediately;
 * text, labels, colour, pin and reminder are saved when the dialog closes (Close, Escape or
 * clicking outside), sending only the fields that changed.
 * Remount it (change its `key`) for each note.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the dialog is shown.
 * @param {(open: boolean) => void} props.onOpenChange - Opens or closes it.
 * @param {object | null} props.note - The note being edited (with owner, collaborators, images, isOwner).
 * @param {string[]} props.labelSuggestions - Labels the user already uses.
 * @param {object} props.actions - API actions provided by the page:
 *   save(note, changes), remove(note), copy(note), leave(note), addImages(note, files) → note,
 *   removeImage(note, imageId) → note, addCollaborator(note, email) → note, removeCollaborator(note, person).
 * @returns {JSX.Element}
 */
export function NoteEditorDialog({ open, onOpenChange, note: initialNote, labelSuggestions, actions }) {
  const { user } = useAuth();
  const [note, setNote] = useState(initialNote);
  const [uploads, setUploads] = useState([]);
  const [closing, setClosing] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  // Starting values never change for this dialog instance (it is remounted per note).
  const [initialDraft] = useState(() => (initialNote ? draftFromNote(initialNote) : null));
  const valuesRef = useRef(null);

  const handleChange = useCallback((values) => {
    valuesRef.current = values;
  }, []);

  /** Saves changed fields, then closes. Stays open if saving fails. */
  async function saveAndClose() {
    if (closing || !note) return;
    const values = valuesRef.current ?? initialDraft;
    const text = normalizeTitleAndContent(values, initialDraft.title);
    const changes = changedFields(initialDraft, { ...values, ...text });
    if (Object.keys(changes).length) {
      setClosing(true);
      try {
        await actions.save(note, changes);
      } catch {
        setClosing(false);
        return;
      }
      setClosing(false);
    }
    onOpenChange(false);
  }

  /** Uploads images one by one, showing local previews until each finishes. */
  async function addImages(files) {
    const pending = files.map((file) => ({
      key: `pending-${file.name}-${Math.random()}`,
      url: URL.createObjectURL(file),
      pending: true,
    }));
    setUploads((current) => [...current, ...pending]);
    for (const [index, file] of files.entries()) {
      const updated = await actions.addImages(note, [file]);
      URL.revokeObjectURL(pending[index].url);
      setUploads((current) => current.filter((item) => item.key !== pending[index].key));
      if (updated) setNote(updated);
    }
  }

  if (!note) return <Dialog open={false} />;

  const images = [...note.images.map((image) => ({ key: image._id, url: image.url })), ...uploads];
  const sharedWith = note.isOwner
    ? note.collaborators
    : [note.owner, ...note.collaborators.filter((person) => person._id !== user?._id)];

  const moreActions = [
    { label: "Make a copy", onSelect: () => actions.copy(note).then(() => onOpenChange(false)) },
    note.isOwner
      ? { label: "Delete note", destructive: true, onSelect: () => setConfirm("delete") }
      : { label: "Leave note", destructive: true, onSelect: () => setConfirm("leave") },
  ];

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : saveAndClose())}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-border p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogTitle className="sr-only">Edit note</DialogTitle>
        <NoteEditor
          initialValues={initialDraft}
          onChange={handleChange}
          onClose={saveAndClose}
          closing={closing}
          images={images}
          onAddImages={addImages}
          onRemoveImage={async (key) => {
            const updated = await actions.removeImage(note, key);
            if (updated) setNote(updated);
          }}
          sharedWith={sharedWith}
          onOpenCollaborators={() => setPeopleOpen(true)}
          moreActions={moreActions}
          labelSuggestions={labelSuggestions}
          footer={`Edited ${formatDate(note.updatedAt)}`}
        />
      </DialogContent>

      <CollaboratorsDialog
        open={peopleOpen}
        onOpenChange={setPeopleOpen}
        owner={note.owner}
        collaborators={note.collaborators}
        canManage={note.isOwner}
        currentUserId={user?._id}
        onAdd={async (email) => {
          const updated = await actions.addCollaborator(note, email);
          setNote(updated);
        }}
        onRemove={async (person) => {
          if (person._id === user?._id && !note.isOwner) {
            setPeopleOpen(false);
            setConfirm("leave");
            return;
          }
          await actions.removeCollaborator(note, person);
          setNote((current) => ({
            ...current,
            collaborators: current.collaborators.filter((p) => p._id !== person._id),
          }));
        }}
      />

      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(next) => !next && setConfirm(null)}
        title="Delete this note?"
        description={`"${note.title}" and its images will be deleted permanently${
          note.collaborators.length ? ", also for the people it's shared with" : ""
        }. This can't be undone.`}
        onConfirm={async () => {
          await actions.remove(note);
          onOpenChange(false);
        }}
      />
      <ConfirmDialog
        open={confirm === "leave"}
        onOpenChange={(next) => !next && setConfirm(null)}
        title="Leave this note?"
        description={`You'll lose access to "${note.title}". The owner can share it with you again.`}
        confirmLabel="Leave"
        onConfirm={async () => {
          await actions.leave(note);
          onOpenChange(false);
        }}
      />
    </Dialog>
  );
}
