import { Pin } from "lucide-react";
import { LabelChip } from "@/components/notes/LabelChip";
import { formatDate } from "@/lib/format";

/**
 * One note in the grid: title, content, labels and last-edited date, with a pin toggle.
 * The title is a button stretched over the whole card, so the card opens the editor
 * while the pin stays a separate, keyboard-reachable control.
 *
 * @param {object} props
 * @param {{ _id: string, title: string, content: string, labels: string[], pinned: boolean, updatedAt: string }} props.note - The note.
 * @param {(note: object) => void} props.onOpen - Opens the note in the editor.
 * @param {(note: object) => void} props.onTogglePin - Pins or unpins the note.
 * @returns {JSX.Element}
 */
export function NoteCard({ note, onOpen, onTogglePin }) {
  return (
    <article className="group relative rounded-2xl border border-border bg-card px-4 pt-4 pb-[13px] shadow-[0_8px_24px_-12px] shadow-foreground/15 transition-shadow hover:shadow-foreground/25">
      {/* Space for the pin icon is reserved only when it is always visible (pinned notes). */}
      <h3 className={`text-[19px] leading-6 font-bold break-words ${note.pinned ? "pr-7" : ""}`}>
        <button
          type="button"
          onClick={() => onOpen(note)}
          className="text-left outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
        >
          {note.title}
        </button>
      </h3>

      <button
        type="button"
        onClick={() => onTogglePin(note)}
        aria-label={note.pinned ? "Unpin note" : "Pin note"}
        aria-pressed={note.pinned}
        className={`absolute top-4 right-3.5 z-10 flex size-7 items-center justify-center rounded-full hover:bg-brand-soft focus-visible:opacity-100 ${
          note.pinned ? "" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <Pin
          className={`size-[18px] rotate-45 text-brand-strong ${note.pinned ? "fill-primary" : ""}`}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {note.content && (
        <p className="mt-[7px] line-clamp-[12] text-[15px] leading-[22px] break-words whitespace-pre-line">
          {note.content}
        </p>
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

      <p className="mt-[7px] text-xs leading-[18px] text-muted-foreground">Edited {formatDate(note.updatedAt)}</p>
    </article>
  );
}
