import Image from "next/image";
import { Pin } from "lucide-react";
import { LabelChip } from "@/components/notes/LabelChip";
import { PeopleAvatars } from "@/components/notes/PeopleAvatars";
import { ReminderChip } from "@/components/notes/ReminderChip";
import { formatDate } from "@/lib/format";
import { canOptimizeImage, resolveImageUrl } from "@/lib/imageUrl";
import { Markdown } from "@/lib/markdown";
import { noteColorClass } from "@/lib/noteColors";

/**
 * One note in the grid: images, title, formatted text, labels, reminder, people it is shared
 * with, and last-edited date, with a pin toggle. The title is a button stretched over the whole
 * card, so the card opens the editor while the pin stays a separate, keyboard-reachable control.
 *
 * @param {object} props
 * @param {object} props.note - The note (with images, owner, collaborators and isOwner).
 * @param {(note: object) => void} props.onOpen - Opens the note in the editor.
 * @param {(note: object) => void} props.onTogglePin - Pins or unpins the note.
 * @param {string} [props.currentUserId] - The signed-in user, left out of the "shared with" avatars.
 * @returns {JSX.Element}
 */
export function NoteCard({ note, onOpen, onTogglePin, currentUserId }) {
  const [cover, ...moreImages] = note.images ?? [];
  const coverUrl = cover ? resolveImageUrl(cover.url) : "";
  // Who else is on the note: for the owner, the collaborators; for a collaborator, the owner and the others.
  const everyone = note.isOwner === false ? [note.owner, ...note.collaborators] : (note.collaborators ?? []);
  const people = everyone.filter((person) => person._id !== currentUserId);

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-border shadow-[0_8px_24px_-12px] shadow-foreground/15 transition-shadow hover:shadow-foreground/25 ${noteColorClass(note.color)}`}
    >
      {cover && (
        <div className="relative">
          <Image
            src={coverUrl}
            alt=""
            width={cover.width}
            height={cover.height}
            sizes="(max-width: 640px) 100vw, 280px"
            unoptimized={!canOptimizeImage(coverUrl)}
            className="max-h-64 w-full object-cover"
          />
          {moreImages.length > 0 && (
            <span className="absolute right-2 bottom-2 rounded-full bg-foreground/70 px-2 py-0.5 text-xs font-bold text-white">
              +{moreImages.length}
            </span>
          )}
        </div>
      )}

      <div className="px-4 pt-4 pb-[13px]">
        {/* Space for the pin icon is reserved only when it is always visible (pinned notes without a cover image). */}
        <h3 className={`text-[19px] leading-6 font-bold break-words ${note.pinned && !cover ? "pr-7" : ""}`}>
          <button
            type="button"
            onClick={() => onOpen(note)}
            className="text-left outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-focus"
          >
            {note.title}
          </button>
        </h3>

        {note.content && (
          <Markdown text={note.content} className="mt-[7px] line-clamp-[12] text-[15px] leading-[22px] break-words" />
        )}

        {note.labels.length > 0 && (
          <ul className="mt-[7px] flex flex-wrap gap-1" aria-label="Labels">
            {note.labels.map((label) => (
              <li key={label} className="max-w-full">
                <LabelChip>
                  <span className="truncate">{label}</span>
                </LabelChip>
              </li>
            ))}
          </ul>
        )}

        {(note.reminderAt || people.length > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {note.reminderAt && <ReminderChip value={note.reminderAt} />}
            <PeopleAvatars people={people} />
          </div>
        )}

        <p className="mt-[7px] text-xs leading-[18px] text-muted-foreground">Edited {formatDate(note.updatedAt)}</p>
      </div>

      <button
        type="button"
        onClick={() => onTogglePin(note)}
        aria-label={note.pinned ? "Unpin note" : "Pin note"}
        aria-pressed={note.pinned}
        className={`absolute right-3.5 z-10 flex size-7 items-center justify-center rounded-full hover:bg-brand-soft focus-visible:opacity-100 ${
          cover ? "top-2 bg-card/85" : "top-4"
        } ${note.pinned ? "" : "opacity-0 group-hover:opacity-100"}`}
      >
        <Pin
          className={`size-[18px] rotate-45 text-brand-strong ${note.pinned ? "fill-primary" : ""}`}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>
    </article>
  );
}
