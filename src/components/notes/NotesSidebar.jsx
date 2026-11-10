import { File, Pencil, Tag } from "lucide-react";

const ROW = "flex w-full items-center gap-4 rounded-full px-4 text-left text-[15px] transition-colors";

/**
 * Sidebar navigation: "All notes" with the total, each label with its count, and "Edit labels".
 * The active entry is highlighted with the amber pill.
 *
 * @param {object} props
 * @param {{ totalNotes: number, labels: { name: string, count: number }[] } | undefined} props.summary - Counts from the API (undefined while loading).
 * @param {string} props.activeLabel - Selected label, or "" for all notes.
 * @param {(label: string) => void} props.onSelectLabel - Called with a label name, or "" for all notes.
 * @param {() => void} props.onEditLabels - Opens the label editor.
 * @returns {JSX.Element}
 */
export function NotesSidebar({ summary, activeLabel, onSelectLabel, onEditLabels }) {
  const labels = summary?.labels ?? [];

  return (
    <nav className="flex flex-col">
      <SidebarItem
        icon={File}
        label="All notes"
        count={summary?.totalNotes}
        active={!activeLabel}
        onClick={() => onSelectLabel("")}
        className="h-11"
      />

      <p className="mt-7 px-4 text-[13px] leading-[18px] font-semibold text-muted-foreground">Labels</p>
      <ul className="mt-2.5 flex flex-col">
        {labels.map((label) => (
          <li key={label.name}>
            <SidebarItem
              icon={Tag}
              label={label.name}
              count={label.count}
              active={label.name === activeLabel}
              onClick={() => onSelectLabel(label.name)}
              className="h-12"
            />
          </li>
        ))}
        {summary && labels.length === 0 && (
          <li className="px-4 py-2 text-[13px] text-muted-foreground">No labels yet. Add one when editing a note.</li>
        )}
      </ul>

      <button
        type="button"
        onClick={onEditLabels}
        disabled={labels.length === 0}
        className={`${ROW} mt-1 h-12 font-bold text-brand-strong hover:bg-brand-soft disabled:opacity-50`}
      >
        <Pencil className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
        Edit labels
      </button>
    </nav>
  );
}

/**
 * One sidebar row: icon, name and count; amber pill when active.
 *
 * @param {object} props
 * @param {import("lucide-react").LucideIcon} props.icon - Row icon.
 * @param {string} props.label - Visible name.
 * @param {number | undefined} props.count - Number shown on the right (hidden while loading).
 * @param {boolean} props.active - Highlights the row and marks it as the current page.
 * @param {() => void} props.onClick - Selects the row.
 * @param {string} props.className - Height class.
 * @returns {JSX.Element}
 */
function SidebarItem({ icon: Icon, label, count, active, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`${ROW} ${className} ${active ? "bg-primary font-bold" : "font-medium hover:bg-brand-soft"}`}
    >
      <Icon className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && <span className={active ? "" : "text-muted-foreground"}>{count}</span>}
    </button>
  );
}
