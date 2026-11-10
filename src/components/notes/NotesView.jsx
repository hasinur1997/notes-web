"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { EditLabelsDialog } from "@/components/notes/EditLabelsDialog";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteComposer } from "@/components/notes/NoteComposer";
import { NoteEditorDialog } from "@/components/notes/NoteEditorDialog";
import { NoteGrid } from "@/components/notes/NoteGrid";
import { NotesSidebar } from "@/components/notes/NotesSidebar";
import { Pager } from "@/components/Pager";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useNotesFilters } from "@/hooks/useNotesFilters";
import { notesApi } from "@/lib/api";

/** Notes per page in the "Others" section (fills 3 rows of 4 columns). */
const PAGE_SIZE = 12;
/** Pinned notes are shown together on the first page, up to the API maximum. */
const PINNED_LIMIT = 50;

/**
 * /notes page: signed-in only.
 *
 * @returns {JSX.Element}
 */
export function NotesView() {
  return (
    <AuthGuard>
      <NotesScreen />
    </AuthGuard>
  );
}

/**
 * Notes screen: sidebar with labels, composer, pinned and other notes, pagination,
 * and the dialogs for editing notes and labels. Filters (label, search, page) live in the URL.
 *
 * @returns {JSX.Element}
 */
function NotesScreen() {
  const { label, q, page, setFilters } = useNotesFilters();
  const [editor, setEditor] = useState({ open: false, note: null, initialTitle: "", key: 0 });
  const [labelsOpen, setLabelsOpen] = useState(false);

  const filterKey = new URLSearchParams({ label, q }).toString();
  const summary = useApiQuery("summary", (signal) => notesApi.summary(signal));
  const pinned = useApiQuery(`pinned?${filterKey}`, (signal) =>
    notesApi.list({ pinned: true, label, q, limit: PINNED_LIMIT }, signal),
  );
  const others = useApiQuery(`others?${filterKey}&page=${page}`, (signal) =>
    notesApi.list({ pinned: false, label, q, page, limit: PAGE_SIZE }, signal),
  );

  /** Reloads every query after a change. */
  const refreshAll = useCallback(() => {
    summary.reload();
    pinned.reload();
    others.reload();
  }, [summary, pinned, others]);

  /** Opens the editor for a new note (from the composer) or an existing one. */
  const openEditor = useCallback((note, initialTitle = "") => {
    setEditor((current) => ({ open: true, note, initialTitle, key: current.key + 1 }));
  }, []);

  /** Creates or updates the note in the editor. Rethrows so the dialog stays open on failure. */
  async function handleSave(values) {
    try {
      if (editor.note) await notesApi.update(editor.note._id, values);
      else await notesApi.create(values);
      toast.success(editor.note ? "Note saved." : "Note added.");
      refreshAll();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }

  /** Deletes a note, stepping back a page if it was the last one on this page. */
  async function handleDelete(note) {
    try {
      await notesApi.remove(note._id);
      toast.success("Note deleted.");
      if (page > 1 && others.data?.data.length === 1 && !note.pinned) setFilters({ page: page - 1 });
      refreshAll();
    } catch (err) {
      toast.error(err.message);
    }
  }

  /** Pins or unpins a note from its card. */
  async function handleTogglePin(note) {
    try {
      await notesApi.update(note._id, { pinned: !note.pinned });
      toast.success(note.pinned ? "Note unpinned." : "Note pinned.");
      refreshAll();
    } catch (err) {
      toast.error(err.message);
    }
  }

  /** Renames a label everywhere and keeps the filter on it if it was selected. */
  async function handleRenameLabel(from, to) {
    try {
      await notesApi.renameLabel(from, to);
      toast.success(`Label renamed to "${to}".`);
      if (label === from) setFilters({ label: to });
      refreshAll();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }

  /** Deletes a label everywhere and clears the filter if it was selected. */
  async function handleDeleteLabel(name) {
    try {
      await notesApi.deleteLabel(name);
      toast.success(`Label "${name}" deleted.`);
      if (label === name) setFilters({ label: null });
      refreshAll();
    } catch (err) {
      toast.error(err.message);
    }
  }

  /** Builds a link to another page of results, keeping label and search. */
  const hrefFor = (target) => {
    const params = new URLSearchParams();
    if (label) params.set("label", label);
    if (q) params.set("q", q);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `/notes?${query}` : "/notes";
  };

  const heading = label || (q ? `Results for "${q}"` : "All notes");
  const showPinned = page === 1 && (pinned.data?.data.length ?? 0) > 0;
  const loading = pinned.loading || others.loading;
  const error = pinned.error || others.error;
  const isEmpty = !loading && !error && !showPinned && (others.data?.data.length ?? 0) === 0;

  const renderNote = (note) => <NoteCard note={note} onOpen={openEditor} onTogglePin={handleTogglePin} />;

  return (
    <AppShell
      searchValue={q}
      onSearch={(term) => setFilters({ q: term || null })}
      renderSidebar={(close) => (
        <NotesSidebar
          summary={summary.data}
          activeLabel={label}
          onSelectLabel={(name) => {
            setFilters({ label: name || null });
            close();
          }}
          onEditLabels={() => {
            setLabelsOpen(true);
            close();
          }}
        />
      )}
    >
      <NoteComposer onCompose={(title) => openEditor(null, title)} />

      <h1 className="mt-[26px] text-[22px] leading-7 font-extrabold break-words">{heading}</h1>

      {error && (
        <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6" role="alert">
          <p className="text-[15px]">Couldn&apos;t load your notes. {error.message}</p>
          <Button variant="outline" onClick={refreshAll} className="h-10 rounded-[10px] px-4 text-[15px]">
            Try again
          </Button>
        </div>
      )}

      {loading && !error && (
        <p className="mt-6 text-[15px] text-muted-foreground" role="status">
          Loading notes…
        </p>
      )}

      {isEmpty && (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-[15px] text-muted-foreground">
          {q || label
            ? "No notes match. Try another search or label."
            : "No notes yet. Use “Take a note…” above to write your first one."}
        </div>
      )}

      {!loading && !error && showPinned && (
        <section className="mt-6" aria-labelledby="pinned-heading">
          <h2 id="pinned-heading" className="mb-2 text-[13px] leading-[18px] font-semibold text-muted-foreground">
            Pinned
          </h2>
          <NoteGrid notes={pinned.data.data} renderNote={renderNote} />
        </section>
      )}

      {!loading && !error && (others.data?.data.length ?? 0) > 0 && (
        <section className="mt-6" aria-labelledby="others-heading">
          {showPinned && (
            <h2 id="others-heading" className="mb-2 text-[13px] leading-[18px] font-semibold text-muted-foreground">
              Others
            </h2>
          )}
          <NoteGrid notes={others.data.data} renderNote={renderNote} />
        </section>
      )}

      {!loading && !error && (
        <div className="mt-6">
          <Pager page={page} totalPages={others.data?.meta.totalPages ?? 0} hrefFor={hrefFor} />
        </div>
      )}

      <NoteEditorDialog
        key={editor.key}
        open={editor.open}
        onOpenChange={(open) => setEditor((current) => ({ ...current, open }))}
        note={editor.note}
        initialTitle={editor.initialTitle}
        labelSuggestions={summary.data?.labels.map((item) => item.name) ?? []}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <EditLabelsDialog
        open={labelsOpen}
        onOpenChange={setLabelsOpen}
        labels={summary.data?.labels ?? []}
        onRename={handleRenameLabel}
        onDelete={handleDeleteLabel}
      />
    </AppShell>
  );
}
