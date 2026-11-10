import Image from "next/image";
import { LoaderCircle, X } from "lucide-react";
import { canOptimizeImage, resolveImageUrl } from "@/lib/imageUrl";

/**
 * Image grid inside the editor: one image fills the width, more are shown in two columns.
 * Pending uploads (local previews) are dimmed with a spinner.
 *
 * @param {object} props
 * @param {{ key: string, url: string, pending?: boolean }[]} props.images - Images to show.
 * @param {(key: string) => void} props.onRemove - Removes an image.
 * @returns {JSX.Element | null}
 */
export function NoteImages({ images, onRemove }) {
  if (!images.length) return null;
  return (
    <div className={`grid gap-1 overflow-hidden rounded-t-2xl ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
      {images.map((image) => (
        <div key={image.key} className="group/image relative h-40 bg-muted">
          <Image
            src={resolveImageUrl(image.url)}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 300px"
            unoptimized={!canOptimizeImage(resolveImageUrl(image.url))}
            className={`object-cover ${image.pending ? "opacity-50" : ""}`}
          />
          {image.pending && (
            <LoaderCircle className="absolute inset-0 m-auto size-6 animate-spin text-brand-strong" aria-label="Uploading" />
          )}
          <button
            type="button"
            onClick={() => onRemove(image.key)}
            aria-label="Remove image"
            className="absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-foreground/70 text-white opacity-0 transition-opacity group-hover/image:opacity-100 focus-visible:opacity-100"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
