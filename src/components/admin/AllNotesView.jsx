"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Eye, Info } from "lucide-react";
import { AdminPager } from "@/components/admin/AdminPager";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/useApiQuery";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Markdown, markdownToPlainText } from "@/lib/markdown";

/** Notes per page. */
const PAGE_SIZE = 8;
/** People offered in the owner filter (the API maximum per request). */
const OWNER_OPTIONS_LIMIT = 50;
/** Where the details panel sits beside the table instead of below it (Tailwind `xl`). */
const SIDE_BY_SIDE_QUERY = "(min-width: 1280px)";
const CARD = "overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_24px_-12px] shadow-foreground/15";
const TH = "px-4 py-3 text-left text-[13px] font-semibold text-muted-foreground";

/**
 * /admin/notes: every note, newest first, read-only, optionally one owner's (`?owner=`).
 * Choosing a row shows the whole note beside (or below) the table.
 *
 * @returns {JSX.Element}
 */
export function AllNotesView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const owner = searchParams.get("owner") ?? "";
  const [selectedId, setSelectedId] = useState(null);
  const panelRef = useRef(null);

  const notes = useApiQuery(`notes?owner=${owner}&page=${page}`, (signal) =>
    adminApi.listNotes({ owner: owner || undefined, page, limit: PAGE_SIZE }, signal),
  );
  const people = useApiQuery("owners", (signal) => adminApi.listUsers({ limit: OWNER_OPTIONS_LIMIT }, signal));
  const rows = notes.data?.data ?? [];
  const meta = notes.data?.meta;
  const selected = rows.find((note) => note._id === selectedId) ?? rows[0] ?? null;

  // The owner filter lists recent people; the chosen owner is added if they are not among them.
  const options = people.data?.data ?? [];
  const ownerPerson = options.find((person) => person._id === owner) ?? rows.find((note) => note.owner._id === owner)?.owner;
  const ownerOptions = ownerPerson && !options.some((person) => person._id === owner) ? [ownerPerson, ...options] : options;

  /** Builds this page's URL with a new owner and/or page. */
  function hrefWith({ owner: nextOwner = owner, page: nextPage = 1 }) {
    const params = new URLSearchParams();
    if (nextOwner) params.set("owner", nextOwner);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  /** Shows a note's details; on narrow screens the panel is below, so scroll to it. */
  function select(note) {
    setSelectedId(note._id);
    if (!window.matchMedia(SIDE_BY_SIDE_QUERY).matches) panelRef.current?.scrollIntoView({ block: "start" });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] leading-10 font-extrabold">All notes</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">Every note from every person, newest first.</p>
      </div>

      <p className="flex items-start gap-2 rounded-xl bg-info-soft px-4 py-3.5 text-[15px] font-medium text-info" role="note">
        <Info className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
        Read only. You can see every note, but only its owner can edit or delete it.
      </p>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className={CARD} aria-label="Notes">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="owner-filter" className="text-[13px] font-semibold">
                Owner
              </label>
              <select
                id="owner-filter"
                value={owner}
                onChange={(event) => router.push(hrefWith({ owner: event.target.value }))}
                className="h-11 w-60 max-w-full rounded-[10px] border border-border bg-card px-3 text-[15px] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none"
              >
                <option value="">Everyone</option>
                {ownerOptions.map((person) => (
                  <option key={person._id} value={person._id}>
                    {person.name} ({person.email})
                  </option>
                ))}
              </select>
            </div>
            {meta && <p className="text-[14px] text-muted-foreground">{meta.total === 1 ? "1 note" : `${meta.total} notes`}</p>}
          </div>

          {notes.error ? (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center" role="alert">
              <p className="text-[15px]">Couldn&apos;t load notes. {notes.error.message}</p>
              <Button variant="outline" onClick={notes.reload} className="h-10 rounded-[10px] px-4 text-[15px]">
                Try again
              </Button>
            </div>
          ) : notes.loading && !notes.data ? (
            <p className="px-4 py-10 text-center text-[15px] text-muted-foreground" role="status">
              Loading notes…
            </p>
          ) : rows.length === 0 ? (
            <p className="px-4 py-10 text-center text-[15px] text-muted-foreground">
              {owner ? "This person has no notes yet." : "Nobody has written a note yet."}
            </p>
          ) : (
            <div className={`overflow-x-auto transition-opacity duration-200 ${notes.loading ? "opacity-60" : ""}`} aria-busy={notes.loading}>
              <table className="w-full min-w-[560px] table-fixed border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>Note</th>
                    <th scope="col" className={`${TH} w-[34%]`}>Owner</th>
                    <th scope="col" className={`${TH} w-[120px]`}>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((note) => (
                    <NoteRow key={note._id} note={note} active={note._id === selected?._id} onSelect={() => select(note)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {meta && meta.total > 0 && (
            <AdminPager
              summary={`Page ${meta.page} of ${Math.max(1, meta.totalPages)}`}
              page={meta.page}
              totalPages={meta.totalPages}
              hrefFor={(target) => hrefWith({ page: target })}
            />
          )}
        </section>

        <div ref={panelRef} className="scroll-mt-20 xl:sticky xl:top-22">
          {selected && <NoteDetails key={selected._id} note={selected} filteredByOwner={Boolean(owner)} hrefWith={hrefWith} />}
        </div>
      </div>
    </div>
  );
}

/**
 * One row of the notes table; the title button selects it (keyboard reachable).
 *
 * @param {{ note: object, active: boolean, onSelect: () => void }} props
 * @returns {JSX.Element}
 */
function NoteRow({ note, active, onSelect }) {
  const preview = markdownToPlainText(note.content);
  return (
    <tr onClick={onSelect} className={`cursor-pointer border-b border-border last:border-b-0 ${active ? "bg-brand-soft" : "hover:bg-muted/60"}`}>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          aria-pressed={active}
          className="block w-full min-w-0 rounded-md text-left focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none"
        >
          <span className="block truncate text-[15px] font-bold">{note.title}</span>
          {preview && <span className="block truncate text-[13px] text-muted-foreground">{preview}</span>}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <UserAvatar name={note.owner.name} avatar={note.owner.avatar} size="sm" />
          <span className="truncate text-[15px] font-medium">{note.owner.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-[14px] whitespace-nowrap text-muted-foreground">{formatDate(note.updatedAt)}</td>
    </tr>
  );
}

/**
 * The selected note in full (read-only), with its owner and dates.
 *
 * @param {object} props
 * @param {object} props.note - The note.
 * @param {boolean} props.filteredByOwner - Whether the list already shows only this owner.
 * @param {(changes: { owner?: string, page?: number }) => string} props.hrefWith - Builds list URLs.
 * @returns {JSX.Element}
 */
function NoteDetails({ note, filteredByOwner, hrefWith }) {
  const firstName = note.owner.name.split(" ")[0];
  return (
    <aside className={`${CARD} p-6 animate-in fade-in-0 duration-200`} aria-label="Selected note">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-info-soft px-2 py-0.5 text-xs font-bold text-info">
        <Eye className="size-3.5" aria-hidden="true" />
        Viewing as admin
      </span>
      <h2 className="mt-3 text-[22px] leading-7 font-extrabold break-words">{note.title}</h2>
      {note.content ? (
        <Markdown text={note.content} className="mt-3 max-h-[40svh] overflow-y-auto text-[15px] leading-[22px] break-words" />
      ) : (
        <p className="mt-3 text-[15px] text-muted-foreground">No text.</p>
      )}
      {note.labels?.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1" aria-label="Labels">
          {note.labels.map((label) => (
            <li key={label} className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-strong">
              {label}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 border-t border-border pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar name={note.owner.name} avatar={note.owner.avatar} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold">{note.owner.name}</p>
            <p className="truncate text-[13px] text-muted-foreground">{note.owner.email}</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-[14px]">
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd>{formatDate(note.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Updated</dt>
            <dd>{formatDate(note.updatedAt)}</dd>
          </div>
        </dl>
        {note.collaborators?.length > 0 && (
          <p className="mt-3 text-[13px] text-muted-foreground">
            Shared with {note.collaborators.map((person) => person.name).join(", ")}
          </p>
        )}
        <Link
          href={filteredByOwner ? hrefWith({ owner: "" }) : hrefWith({ owner: note.owner._id })}
          className="mt-5 flex h-11 items-center justify-center rounded-xl border border-border px-4 text-[15px] font-bold text-brand-strong hover:bg-muted focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none"
        >
          {filteredByOwner ? "Show everyone's notes" : `Show all notes by ${firstName}`}
        </Link>
      </div>
    </aside>
  );
}
