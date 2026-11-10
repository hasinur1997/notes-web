"use client";

import Image from "next/image";
import { Eye } from "lucide-react";
import { LabelChip } from "@/components/notes/LabelChip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import { canOptimizeImage, resolveImageUrl } from "@/lib/imageUrl";
import { Markdown } from "@/lib/markdown";
import { noteColorClass } from "@/lib/noteColors";

/**
 * Shows one note to an admin, read-only: images, title, text, labels, owner and dates.
 *
 * @param {object} props
 * @param {object | null} props.note - The note to show (null when closed).
 * @param {(open: boolean) => void} props.onOpenChange - Closes the dialog.
 * @returns {JSX.Element}
 */
export function NoteViewDialog({ note, onOpenChange }) {
  return (
    <Dialog open={Boolean(note)} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-h-[calc(100svh-2rem)] gap-4 overflow-y-auto rounded-2xl p-6 sm:max-w-[600px] ${note ? noteColorClass(note.color) : ""}`}
      >
        {note && (
          <>
            <DialogHeader>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-info-soft px-2 py-0.5 text-xs font-bold text-info">
                <Eye className="size-3.5" aria-hidden="true" />
                Read only
              </span>
              <DialogTitle className="text-[22px] leading-7 font-extrabold break-words">{note.title}</DialogTitle>
              <DialogDescription className="text-[13px]">
                By {note.owner.name} · Edited {formatDate(note.updatedAt)}
              </DialogDescription>
            </DialogHeader>

            {note.images?.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {note.images.map((image) => {
                  const url = resolveImageUrl(image.url);
                  return (
                    <Image
                      key={image._id ?? image.url}
                      src={url}
                      alt=""
                      width={image.width}
                      height={image.height}
                      sizes="300px"
                      unoptimized={!canOptimizeImage(url)}
                      className={`w-full rounded-xl object-cover ${note.images.length === 1 ? "col-span-2 max-h-80" : "h-40"}`}
                    />
                  );
                })}
              </div>
            )}

            {note.content ? (
              <Markdown text={note.content} className="text-[15px] leading-[22px] break-words" />
            ) : (
              <p className="text-[15px] text-muted-foreground">No text.</p>
            )}

            {note.labels?.length > 0 && (
              <ul className="flex flex-wrap gap-1" aria-label="Labels">
                {note.labels.map((label) => (
                  <li key={label}>
                    <LabelChip>{label}</LabelChip>
                  </li>
                ))}
              </ul>
            )}

            {note.collaborators?.length > 0 && (
              <p className="text-[13px] text-muted-foreground">Shared with {note.collaborators.map((person) => person.name).join(", ")}</p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
