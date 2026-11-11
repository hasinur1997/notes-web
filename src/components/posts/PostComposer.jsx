"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageDown, ImagePlus } from "lucide-react";
import { acceptImages, MAX_IMAGES, NoteEditor } from "@/components/notes/editor/NoteEditor";
import { ToolbarButton } from "@/components/notes/editor/ToolbarButton";
import { useFileDrop } from "@/hooks/useFileDrop";
import { normalizeTitleAndContent } from "@/lib/noteDraft";
import { EMPTY_POST_DRAFT, pickPostFields } from "@/lib/postDraft";

/** Popups rendered in portals (menus, dialogs, toasts) count as "inside" the composer. */
const PORTAL_SELECTOR = '[role="menu"], [role="dialog"], [role="alertdialog"], [data-sonner-toast]';
const IMAGE_ONLY_TITLE = "Untitled";
const NO_PEOPLE = [];
const NO_LABELS = [];

/** Gives a queued file a unique key and a local preview URL. */
function toQueued(file) {
  return { key: `${file.name}-${file.lastModified}-${Math.random()}`, url: URL.createObjectURL(file), file };
}

/**
 * Inline post composer, like the note composer: collapsed it is a "Write a post…" bar (with an
 * image shortcut, and images can be dropped on it); expanded it is the shared editor in post mode
 * (text, formatting, colour, images). Closing (Close, Escape or clicking outside) publishes the
 * post if it has any content. Images added before publishing are queued and uploaded right after.
 *
 * @param {object} props
 * @param {(values: { title: string, content: string, color: string }, images: File[]) => Promise<void>} props.onCreate - Publishes; rejects to keep the composer open.
 * @returns {JSX.Element}
 */
export function PostComposer({ onCreate }) {
  const [session, setSession] = useState(null);
  const [images, setImages] = useState([]);
  const [closing, setClosing] = useState(false);
  const valuesRef = useRef(EMPTY_POST_DRAFT);
  const rootRef = useRef(null);
  const closeRef = useRef(null);

  /** Opens the editor, optionally straight into the file picker. */
  function open({ pickImage = false } = {}) {
    valuesRef.current = EMPTY_POST_DRAFT;
    setSession({ key: Date.now(), pickImage });
  }

  /** Releases image previews and resets everything. */
  function reset() {
    images.forEach((image) => URL.revokeObjectURL(image.url));
    setImages([]);
    setSession(null);
  }

  /** Publishes (if there is content) and collapses; stays open if publishing fails. */
  async function close() {
    if (closing) return;
    const values = valuesRef.current;
    const text = normalizeTitleAndContent(values, images.length ? IMAGE_ONLY_TITLE : "");
    if (text) {
      setClosing(true);
      try {
        await onCreate(pickPostFields({ ...values, ...text }), images.map((image) => image.file));
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

  // Clicking outside the expanded composer (but not inside its menus or dialogs) publishes and closes it.
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
    else root?.querySelector('textarea[aria-label="Post text"]')?.focus();
  }, [session]);

  const handleChange = useCallback((values) => {
    valuesRef.current = values;
  }, []);

  /** Queues image files with local previews; they are uploaded after the post is created. */
  function queueImages(files) {
    setImages((current) => [...current, ...files.map(toQueued)]);
  }

  // Dropping images on the collapsed bar opens a new post with them attached.
  const { isDragging: barDragging, dropProps: barDropProps } = useFileDrop(
    (files) => {
      const accepted = acceptImages(files, MAX_IMAGES);
      if (!accepted.length) return;
      open();
      queueImages(accepted);
    },
    { disabled: Boolean(session) },
  );

  const cardClass =
    "mx-auto w-full max-w-[600px] rounded-2xl border border-border shadow-[0_8px_24px_-10px] shadow-foreground/15";

  if (!session) {
    return (
      <div className={`${cardClass} relative flex h-16 items-center gap-1 bg-card pr-3 pl-4.5`} {...barDropProps}>
        {barDragging && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-strong bg-brand-soft text-[15px] font-bold text-brand-strong"
            aria-hidden="true"
          >
            <ImageDown className="size-5" />
            Drop images to start a new post
          </div>
        )}
        <button
          type="button"
          onClick={() => open()}
          className="h-full min-w-0 flex-1 text-left text-base text-placeholder outline-none focus-visible:text-foreground"
        >
          Write a post…
        </button>
        <ToolbarButton label="New post with image" onClick={() => open({ pickImage: true })} className="size-10">
          <ImagePlus className="size-5" aria-hidden="true" />
        </ToolbarButton>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cardClass}>
      <NoteEditor
        key={session.key}
        variant="post"
        initialValues={EMPTY_POST_DRAFT}
        onChange={handleChange}
        onClose={close}
        closing={closing}
        images={images}
        onAddImages={queueImages}
        onReplaceImage={(key, file) =>
          setImages((current) =>
            current.map((image) => {
              if (image.key !== key) return image;
              URL.revokeObjectURL(image.url);
              return toQueued(file);
            }),
          )
        }
        onRemoveImage={(key) =>
          setImages((current) => {
            const removed = current.find((image) => image.key === key);
            if (removed) URL.revokeObjectURL(removed.url);
            return current.filter((image) => image.key !== key);
          })
        }
        sharedWith={NO_PEOPLE}
        onOpenCollaborators={() => {}}
        moreActions={[{ label: "Discard post", onSelect: reset, destructive: true }]}
        labelSuggestions={NO_LABELS}
      />
    </div>
  );
}
