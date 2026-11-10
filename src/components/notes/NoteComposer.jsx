"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Pin, Tag } from "lucide-react";
import { toast } from "sonner";
import { CollaboratorsDialog } from "@/components/notes/editor/CollaboratorsDialog";
import { NoteEditor } from "@/components/notes/editor/NoteEditor";
import { ToolbarButton } from "@/components/notes/editor/ToolbarButton";
import { useAuth } from "@/context/AuthContext";
import { EMPTY_DRAFT, normalizeTitleAndContent } from "@/lib/noteDraft";

/** Popups rendered in portals (menus, dialogs, toasts) count as "inside" the composer. */
const PORTAL_SELECTOR = '[role="menu"], [role="dialog"], [role="alertdialog"], [data-sonner-toast]';
const IMAGE_ONLY_TITLE = "Untitled";

/**
 * Inline note composer. Collapsed, it is a "Take a note…" bar with shortcuts for a pinned note,
 * a labelled note or a note with an image. Expanded, it is the full NoteEditor.
 * Closing (Close, Escape, or clicking outside) saves the note if it has any content.
 * Images and people added before saving are queued and attached right after the note is created.
 *
 * @param {object} props
 * @param {(values: object, attachments: { images: File[], emails: string[] }) => Promise<void>} props.onCreate - Saves; rejects to keep the composer open.
 * @param {string[]} props.labelSuggestions - Labels the user already uses.
 * @returns {JSX.Element}
 */
export function NoteComposer({ onCreate, labelSuggestions }) {
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [images, setImages] = useState([]);
  const [people, setPeople] = useState([]);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const valuesRef = useRef(EMPTY_DRAFT);
  const rootRef = useRef(null);
  const closeRef = useRef(null);

  /** Opens the editor with optional starting state. */
  function open({ pinned = false, labels = false, pickImage = false } = {}) {
    valuesRef.current = { ...EMPTY_DRAFT, pinned };
    setSession({ key: Date.now(), initialValues: valuesRef.current, startWithLabels: labels, pickImage });
  }

  /** Releases image previews and resets everything. */
  function reset() {
    images.forEach((image) => URL.revokeObjectURL(image.url));
    setImages([]);
    setPeople([]);
    setSession(null);
  }

  /** Saves (if there is content) and collapses; stays open if saving fails. */
  async function close() {
    if (closing) return;
    const values = valuesRef.current;
    const text = normalizeTitleAndContent(values, images.length ? IMAGE_ONLY_TITLE : "");
    if (text) {
      setClosing(true);
      try {
        await onCreate({ ...values, ...text }, { images: images.map((image) => image.file), emails: people.map((p) => p.email) });
      } catch {
        setClosing(false);
        return;
      }
      setClosing(false);
    }
    reset();
  }

  useEffect(() => {
    closeRef.current = close;
  });

  // Clicking outside the expanded composer (but not inside its menus or dialogs) saves and closes it.
  useEffect(() => {
    if (!session) return undefined;
    function handlePointerDown(event) {
      const target = event.target;
      if (rootRef.current?.contains(target) || target.closest?.(PORTAL_SELECTOR)) return;
      closeRef.current();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [session]);

  // Focus the text when the composer opens, or open the file picker for the image shortcut.
  useEffect(() => {
    if (!session) return;
    const root = rootRef.current;
    if (session.pickImage) root?.querySelector('input[type="file"]')?.click();
    else root?.querySelector('textarea[aria-label="Note text"]')?.focus();
  }, [session]);

  const handleChange = useCallback((values) => {
    valuesRef.current = values;
  }, []);

  const cardClass =
    "mx-auto w-full max-w-[600px] rounded-2xl border border-border shadow-[0_8px_24px_-10px] shadow-foreground/15";

  if (!session) {
    return (
      <div className={`${cardClass} flex h-16 items-center gap-1 bg-card pr-3 pl-4.5`}>
        <button
          type="button"
          onClick={() => open()}
          className="h-full min-w-0 flex-1 text-left text-base text-placeholder outline-none focus-visible:text-foreground"
        >
          Take a note…
        </button>
        <ToolbarButton label="New pinned note" onClick={() => open({ pinned: true })} className="size-10">
          <Pin className="size-5 rotate-45" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="New note with labels" onClick={() => open({ labels: true })} className="size-10">
          <Tag className="size-5" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="New note with image" onClick={() => open({ pickImage: true })} className="size-10">
          <ImagePlus className="size-5" aria-hidden="true" />
        </ToolbarButton>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cardClass}>
      <NoteEditor
        key={session.key}
        initialValues={session.initialValues}
        startWithLabels={session.startWithLabels}
        onChange={handleChange}
        onClose={close}
        closing={closing}
        images={images}
        onAddImages={(files) =>
          setImages((current) => [
            ...current,
            ...files.map((file) => ({ key: `${file.name}-${file.lastModified}-${Math.random()}`, url: URL.createObjectURL(file), file })),
          ])
        }
        onRemoveImage={(key) =>
          setImages((current) => {
            const removed = current.find((image) => image.key === key);
            if (removed) URL.revokeObjectURL(removed.url);
            return current.filter((image) => image.key !== key);
          })
        }
        sharedWith={people}
        onOpenCollaborators={() => setPeopleOpen(true)}
        moreActions={[{ label: "Discard note", onSelect: reset, destructive: true }]}
        labelSuggestions={labelSuggestions}
      />
      <CollaboratorsDialog
        open={peopleOpen}
        onOpenChange={setPeopleOpen}
        owner={{ _id: user?._id, name: user?.name ?? "You", email: user?.email ?? "" }}
        collaborators={people}
        canManage
        currentUserId={user?._id}
        onAdd={async (email) => {
          if (email === user?.email) {
            toast.error("You already own this note.");
            throw new Error("Cannot share with yourself");
          }
          setPeople((current) =>
            current.some((p) => p.email === email) ? current : [...current, { _id: email, name: email, email, pending: true }],
          );
        }}
        onRemove={async (person) => setPeople((current) => current.filter((p) => p._id !== person._id))}
      />
    </div>
  );
}
