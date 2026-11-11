"use client";

import { useCallback, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { NoteEditor } from "@/components/notes/editor/NoteEditor";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import { normalizeTitleAndContent } from "@/lib/noteDraft";
import { changedPostFields, draftFromPost } from "@/lib/postDraft";

const NO_PEOPLE = [];
const NO_LABELS = [];

/**
 * Opens one of the user's own posts in the shared editor (post mode). Image changes are saved
 * immediately; title, text and colour are saved when the dialog closes (Close, Escape or clicking
 * outside), sending only the fields that changed. Remount it (change its `key`) for each post.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the dialog is shown.
 * @param {(open: boolean) => void} props.onOpenChange - Opens or closes it.
 * @param {object | null} props.post - The post being edited.
 * @param {object} props.actions - API actions provided by the page: save(post, changes), remove(post),
 *   addImage(post, file) → post, replaceImage(post, imageId, file) → post, removeImage(post, imageId) → post.
 *   The image actions resolve to null when they fail (the page shows the error).
 * @returns {JSX.Element}
 */
export function PostEditorDialog({ open, onOpenChange, post: initialPost, actions }) {
  const [post, setPost] = useState(initialPost);
  const [uploads, setUploads] = useState([]);
  // Ids of images being replaced by their cropped version (shown dimmed with a spinner).
  const [replacing, setReplacing] = useState([]);
  const [closing, setClosing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Starting values never change for this dialog instance (it is remounted per post).
  const [initialDraft] = useState(() => (initialPost ? draftFromPost(initialPost) : null));
  const valuesRef = useRef(null);

  const handleChange = useCallback((values) => {
    valuesRef.current = values;
  }, []);

  if (!post) return <Dialog open={false} />;

  /** Saves changed fields, then closes. Stays open if saving fails. */
  async function saveAndClose() {
    if (closing) return;
    const values = valuesRef.current ?? initialDraft;
    const text = normalizeTitleAndContent(values, initialDraft.title);
    const changes = changedPostFields(initialDraft, { ...values, ...text });
    if (Object.keys(changes).length) {
      setClosing(true);
      try {
        await actions.save(post, changes);
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
    const pending = files.map((file) => ({ key: `pending-${file.name}-${Math.random()}`, url: URL.createObjectURL(file), pending: true }));
    setUploads((current) => [...current, ...pending]);
    for (const [index, file] of files.entries()) {
      const updated = await actions.addImage(post, file);
      URL.revokeObjectURL(pending[index].url);
      setUploads((current) => current.filter((item) => item.key !== pending[index].key));
      if (updated) setPost(updated);
    }
  }

  /** Uploads a cropped image in place of the original. */
  async function replaceImage(imageId, file) {
    setReplacing((current) => [...current, imageId]);
    const updated = await actions.replaceImage(post, imageId, file);
    setReplacing((current) => current.filter((id) => id !== imageId));
    if (updated) setPost(updated);
  }

  const images = [
    ...post.images.map((image) => ({ key: image._id, url: image.url, pending: replacing.includes(image._id) })),
    ...uploads,
  ];

  const moreActions = [
    { label: "Delete post", destructive: true, onSelect: () => setConfirmDelete(true) },
  ];

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : saveAndClose())}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-border p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogTitle className="sr-only">Edit post</DialogTitle>
        <NoteEditor
          variant="post"
          initialValues={initialDraft}
          onChange={handleChange}
          onClose={saveAndClose}
          closing={closing}
          images={images}
          onAddImages={addImages}
          onReplaceImage={replaceImage}
          onRemoveImage={async (key) => {
            const updated = await actions.removeImage(post, key);
            if (updated) setPost(updated);
          }}
          sharedWith={NO_PEOPLE}
          onOpenCollaborators={() => {}}
          moreActions={moreActions}
          labelSuggestions={NO_LABELS}
          footer={`Published ${formatDate(post.createdAt)}`}
        />
      </DialogContent>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this post?"
        description={`"${post.title}" and its images will be deleted for everyone. This can't be undone.`}
        onConfirm={async () => {
          await actions.remove(post);
          onOpenChange(false);
        }}
      />
    </Dialog>
  );
}
