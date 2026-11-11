"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronRight, Info } from "lucide-react";
import { NoteViewDialog } from "@/components/admin/NoteViewDialog";
import { UserSearch } from "@/components/admin/UserSearch";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { InfiniteScrollTrigger } from "@/components/notes/InfiniteScrollTrigger";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteGrid } from "@/components/notes/NoteGrid";
import { Pager } from "@/components/Pager";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useApiQuery } from "@/hooks/useApiQuery";
import { usePagedList } from "@/hooks/usePagedList";
import { adminApi } from "@/lib/api";
import { roleLabel } from "@/lib/roles";
import { getSettings } from "@/lib/settings";

/** Pinned notes are loaded together, up to the API maximum. */
const BULK_LIMIT = 50;
const MUTED_BOX = "rounded-2xl border border-dashed border-border p-10 text-center text-[15px] text-muted-foreground";

/**
 * /admin/user-notes: everyone as cards with a search; choosing a person (`?user=`) shows their
 * notes the way they see them, read-only. Both lists follow the admin's pagination settings.
 *
 * @returns {JSX.Element}
 */
export function UserNotesView() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("user");
  return userId ? <PersonNotes key={userId} userId={userId} /> : <PeopleCards />;
}

/** Common URL helpers for this page. */
function useListUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  /** This page's URL with the given parameters (empty values dropped). */
  const hrefWith = useCallback(
    (params) => {
      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) if (value) search.set(key, String(value));
      const query = search.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname],
  );
  return { router, page, searchParams, hrefWith };
}

/** Everyone as cards, searchable by name or email. */
function PeopleCards() {
  const { user } = useAuth();
  const { notesPagination, notesPerPage } = getSettings(user);
  const infinite = notesPagination === "infinite";
  const { router, page, searchParams, hrefWith } = useListUrl();
  const q = searchParams.get("q") ?? "";

  const people = usePagedList({
    key: `people?q=${q}&limit=${notesPerPage}`,
    infinite,
    page,
    // The signed-in admin is left out: their own notes are under "My Notes".
    fetchPage: (next, signal) =>
      adminApi.listUsers({ q: q || undefined, excludeSelf: true, page: next, limit: notesPerPage }, signal),
  });
  const handleSearch = useCallback((term) => router.replace(hrefWith({ q: term })), [router, hrefWith]);
  const rows = people.data?.data ?? [];
  const meta = people.data?.meta;
  const stale = people.dataKey !== null && !people.dataKey.startsWith(`people?q=${q}&`);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] leading-10 font-extrabold">User&apos;s Notes</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">Choose a person to see their notes. You can read them but not change them.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <UserSearch value={q} onSearch={handleSearch} className="w-full max-w-md" />
        {meta && !stale && (
          <p className="text-[14px] text-muted-foreground" role="status">
            {q ? `${meta.total} found` : meta.total === 1 ? "1 person" : `${meta.total} people`}
          </p>
        )}
      </div>

      {people.error ? (
        <ErrorBox message={`Couldn't load people. ${people.error.message}`} onRetry={people.reload} />
      ) : stale || (people.loading && !people.data) ? (
        <p className="text-[15px] text-muted-foreground" role="status">
          {stale ? "Searching…" : "Loading people…"}
        </p>
      ) : rows.length === 0 ? (
        <p className={MUTED_BOX}>{q ? `Nobody matches "${q}".` : "No users yet."}</p>
      ) : (
        <ul className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 transition-opacity duration-200 ${people.loading ? "opacity-60" : ""}`}>
          {rows.map((person) => (
            <li key={person._id} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <Link
                href={hrefWith({ user: person._id })}
                className="group flex h-full items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_8px_24px_-12px] shadow-foreground/15 transition-shadow hover:shadow-foreground/25 focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none"
              >
                <UserAvatar name={person.name} avatar={person.avatar} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[16px] font-bold">{person.name}</span>
                    {person.role === "admin" && (
                      <span className="rounded-full bg-primary/75 px-2 py-px text-[11px] font-bold">{roleLabel(person.role)}</span>
                    )}
                  </span>
                  <span className="block truncate text-[13px] text-muted-foreground">{person.email}</span>
                  <span className="mt-1 block text-[13px] font-bold text-brand-strong">View notes</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!stale && !people.error && meta && meta.total > 0 && (
        <ListFooter
          infinite={infinite}
          list={people}
          page={page}
          totalPages={meta.totalPages}
          hrefFor={(target) => hrefWith({ q, page: target > 1 ? target : null })}
          endMessage={meta.total > notesPerPage ? "That's everyone." : ""}
        />
      )}
    </div>
  );
}

/**
 * One person's notes as they see them (pinned first, then the rest), read-only.
 *
 * @param {{ userId: string }} props
 * @returns {JSX.Element}
 */
function PersonNotes({ userId }) {
  const { user: me } = useAuth();
  const { notesPagination, notesPerPage } = getSettings(me);
  const infinite = notesPagination === "infinite";
  const { page, hrefWith } = useListUrl();
  const [viewing, setViewing] = useState(null);

  const person = useApiQuery(`person-${userId}`, (signal) => adminApi.getUser(userId, signal));
  const pinned = useApiQuery(`pinned-${userId}`, (signal) => adminApi.listUserNotes(userId, { pinned: true, limit: BULK_LIMIT }, signal));
  const others = usePagedList({
    key: `others-${userId}?limit=${notesPerPage}`,
    infinite,
    page,
    fetchPage: (next, signal) => adminApi.listUserNotes(userId, { pinned: false, page: next, limit: notesPerPage }, signal),
  });

  const effectivePage = infinite ? 1 : page;
  const showPinned = effectivePage === 1 && (pinned.data?.data.length ?? 0) > 0;
  const loading = (pinned.loading && !pinned.data) || (others.loading && !others.data);
  const error = person.error || pinned.error || others.error;
  const isEmpty = !loading && !error && !showPinned && (others.data?.data.length ?? 0) === 0;
  const name = person.data?.user.name;
  const renderNote = (note) => <NoteCard note={note} onOpen={setViewing} currentUserId={userId} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={hrefWith({})}
          className="inline-flex items-center gap-1.5 rounded-lg text-[15px] font-bold text-brand-strong hover:underline focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All people
        </Link>
        {person.data && (
          <div className="mt-4 flex min-w-0 items-center gap-4 animate-in fade-in-0 duration-200">
            <UserAvatar name={person.data.user.name} avatar={person.data.user.avatar} size="lg" />
            <div className="min-w-0">
              <h1 className="truncate text-[26px] leading-8 font-extrabold">{name}&apos;s notes</h1>
              <p className="truncate text-[14px] text-muted-foreground">
                {person.data.user.email} · {roleLabel(person.data.user.role)}
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="flex items-start gap-2 rounded-xl bg-info-soft px-4 py-3 text-[14px] font-medium text-info" role="note">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Read only. You see these notes exactly as {name ?? "this person"} does, but only they can change them.
      </p>

      {error && <ErrorBox message={error.status === 404 ? "This person no longer exists." : `Couldn't load their notes. ${error.message}`} />}
      {loading && !error && (
        <p className="text-[15px] text-muted-foreground" role="status">
          Loading notes…
        </p>
      )}
      {isEmpty && <p className={MUTED_BOX}>{name ?? "This person"} has no notes yet.</p>}

      {!loading && !error && showPinned && (
        <section aria-labelledby="pinned-heading">
          <h2 id="pinned-heading" className="mb-2 text-[13px] leading-[18px] font-semibold text-muted-foreground">
            Pinned
          </h2>
          <NoteGrid key={pinned.dataKey} notes={pinned.data.data} renderNote={renderNote} />
        </section>
      )}

      {!loading && !error && (others.data?.data.length ?? 0) > 0 && (
        <section aria-labelledby="others-heading">
          {showPinned && (
            <h2 id="others-heading" className="mb-2 text-[13px] leading-[18px] font-semibold text-muted-foreground">
              Others
            </h2>
          )}
          <NoteGrid key={others.dataKey} notes={others.data.data} renderNote={renderNote} />
        </section>
      )}

      {!loading && !error && !isEmpty && others.data && (
        <ListFooter
          infinite={infinite}
          list={others}
          page={page}
          totalPages={others.data.meta.totalPages}
          hrefFor={(target) => hrefWith({ user: userId, page: target > 1 ? target : null })}
          endMessage={others.data.meta.total > notesPerPage ? "You've reached the end." : ""}
        />
      )}

      <NoteViewDialog note={viewing} onOpenChange={(open) => !open && setViewing(null)} />
    </div>
  );
}

/**
 * Page numbers or the infinite-scroll trigger, per the admin's settings.
 *
 * @param {object} props
 * @param {boolean} props.infinite - Infinite scroll mode.
 * @param {ReturnType<typeof usePagedList>} props.list - The list being paged.
 * @param {number} props.page - Current page (page-number mode).
 * @param {number} props.totalPages - Total pages.
 * @param {(page: number) => string} props.hrefFor - URL of a page.
 * @param {string} props.endMessage - Shown when infinite scroll reaches the end.
 * @returns {JSX.Element}
 */
function ListFooter({ infinite, list, page, totalPages, hrefFor, endMessage }) {
  return infinite ? (
    <InfiniteScrollTrigger
      hasMore={list.hasMore}
      loading={list.loadingMore}
      error={list.loadMoreError}
      onLoadMore={list.loadMore}
      endMessage={endMessage}
    />
  ) : (
    <Pager page={page} totalPages={totalPages} hrefFor={hrefFor} />
  );
}

/**
 * An error message with an optional retry button.
 *
 * @param {{ message: string, onRetry?: () => void }} props
 * @returns {JSX.Element}
 */
function ErrorBox({ message, onRetry }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6" role="alert">
      <p className="text-[15px]">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="h-10 rounded-[10px] px-4 text-[15px]">
          Try again
        </Button>
      )}
    </div>
  );
}
