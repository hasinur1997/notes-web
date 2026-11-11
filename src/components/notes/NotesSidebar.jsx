import Link from "next/link";
import { Bell, File, Hash, NotebookText, Pencil, Tag, UsersRound } from "lucide-react";

const ROW = "flex w-full items-center gap-4 rounded-full px-4 text-left text-[15px] transition-colors";

/**
 * Sidebar navigation: "All notes" ("My Notes" for admins) and "Reminders" with counts, each label with its count, and "Edit labels".
 * The active entry is highlighted with the amber pill.
 *
 * @param {object} props
 * @param {{ totalNotes: number, reminders: number, labels: { name: string, count: number }[] } | undefined} props.summary - Counts from the API (undefined while loading).
 * @param {"" | "reminders"} props.activeView - Selected view.
 * @param {string} props.activeLabel - Selected label, or "" for none.
 * @param {(view: "" | "reminders") => void} props.onSelectView - Shows all notes ("") or notes with reminders.
 * @param {(label: string) => void} props.onSelectLabel - Called with a label name.
 * @param {() => void} [props.onEditLabels] - Opens the label editor (the button is hidden without it).
 * @param {boolean} [props.showAdmin=false] - Adds the admin menus (Users, User's Notes, Interests) after Reminders.
 * @param {"users" | "user-notes" | null} [props.activeAdmin=null] - Highlights an admin menu (on admin pages).
 * @param {() => void} [props.onNavigate] - Called after an admin menu is chosen (closes the mobile sheet).
 * @returns {JSX.Element}
 */
export function NotesSidebar({
  summary,
  activeView,
  activeLabel,
  onSelectView,
  onSelectLabel,
  onEditLabels,
  showAdmin = false,
  activeAdmin = null,
  onNavigate,
}) {
  const labels = summary?.labels ?? [];

  return (
    // Fills the sidebar's height; only the label list scrolls when it does not fit.
    <nav className="flex min-h-0 flex-1 flex-col">
      <SidebarItem
        icon={File}
        label={showAdmin ? "My Notes" : "All notes"}
        count={summary?.totalNotes}
        active={!activeAdmin && !activeLabel && !activeView}
        onClick={() => onSelectView("")}
        className="h-11 shrink-0"
      />
      <SidebarItem
        icon={Bell}
        label="Reminders"
        count={summary?.reminders}
        active={!activeAdmin && activeView === "reminders"}
        onClick={() => onSelectView("reminders")}
        className="mt-1 h-11 shrink-0"
      />

      {showAdmin && (
        <>
          <AdminLink href="/admin/users" icon={UsersRound} label="Users" active={activeAdmin === "users"} onNavigate={onNavigate} />
          <AdminLink href="/admin/user-notes" icon={NotebookText} label="User's Notes" active={activeAdmin === "user-notes"} onNavigate={onNavigate} />
          <AdminLink href="/admin/interests" icon={Hash} label="Interests" active={activeAdmin === "interests"} onNavigate={onNavigate} />
        </>
      )}
      <p className="mt-7 shrink-0 px-4 text-[13px] leading-[18px] font-semibold text-muted-foreground">Labels</p>
      <ul
        className="mt-2.5 flex min-h-0 shrink flex-col overflow-y-auto overscroll-contain [scrollbar-width:thin]"
        aria-label="Labels"
      >
        {labels.map((label) => (
          <li key={label.name}>
            <SidebarItem
              icon={Tag}
              label={label.name}
              count={label.count}
              active={!activeAdmin && label.name === activeLabel}
              onClick={() => onSelectLabel(label.name)}
              className="h-12"
            />
          </li>
        ))}
        {summary && labels.length === 0 && (
          <li className="px-4 py-2 text-[13px] text-muted-foreground">No labels yet. Create one with Edit labels.</li>
        )}
      </ul>

      {onEditLabels && (
        <button
          type="button"
          onClick={onEditLabels}
          className={`${ROW} mt-1 h-12 shrink-0 font-bold text-brand-strong hover:bg-brand-soft`}
        >
          <Pencil className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
          Edit labels
        </button>
      )}
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
      className={`${ROW} ${className} ${active ? "bg-primary/75 font-bold" : "font-medium hover:bg-brand-soft"}`}
    >
      <Icon className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && <span className={active ? "" : "text-muted-foreground"}>{count}</span>}
    </button>
  );
}

/**
 * Admin menu row: a link styled like the other rows (admins only).
 *
 * @param {object} props
 * @param {string} props.href - Admin page.
 * @param {import("lucide-react").LucideIcon} props.icon - Row icon.
 * @param {string} props.label - Visible name.
 * @param {boolean} props.active - Highlights the row.
 * @param {() => void} [props.onNavigate] - Called when chosen.
 * @returns {JSX.Element}
 */
function AdminLink({ href, icon: Icon, label, active, onNavigate }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`${ROW} mt-1 h-11 shrink-0 focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none ${
        active ? "bg-primary/75 font-bold" : "font-medium hover:bg-brand-soft"
      }`}
    >
      <Icon className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Link>
  );
}
