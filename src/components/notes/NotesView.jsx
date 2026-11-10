"use client";

import { useCallback, useMemo, useState } from "react";
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
import { useAuth } from "@/context/AuthContext";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useNotesFilters } from "@/hooks/useNotesFilters";
import { useReminderAlerts } from "@/hooks/useReminderAlerts";
import { notesApi } from "@/lib/api";

/** Notes per page in the "Others" section (fills 3 rows of 4 columns). */
const PAGE_SIZE = 12;
/** Pinned notes, and notes with reminders for alerts, are loaded together up to the API maximum. */
const BULK_LIMIT = 50;

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
 * Runs an API call and shows its error as a toast. Rethrows so callers can keep their UI open.
 *
 * @template T
 * @param {() => Promise<T>} call - The API call.
 * @param {string} [success] - Success toast text.
 * @returns {Promise<T>}
 */
async function withToast(call, success) {
  try {
    const result = await call();
    if (success) toast.success(success);
    return result;
  } catch (err) {
    toast.error(err.message);
    throw err;
  }
}

/**
 * Notes screen: sidebar (all notes, reminders, labels), composer, pinned and other notes,
 * pagination, and the dialogs for editing notes and labels. Filters live in the URL.
 *
 * @returns {JSX.Element}
 */
function NotesScreen() {
  const { user } = useAuth();
  const { view, label, q, page, setFilters } = useNotesFilters();
  const [editor, setEditor] = useState({ open: false, note: null, key: 0 });
  const [labelsOpen, setLabelsOpen] = useState(false);
  const reminderView = view === "reminders";

  const filterKey = new URLSearchParams({ view, label, q }).toString();
  const listFilters = { label, q, reminder: reminderView || undefined };
  const summary = useApiQuery("summary", (signal) => notesApi.summary(signal));
  const pinned = useApiQuery(`pinned?${filterKey}`, (signal) =>
    notesApi.list({ ...listFilters, pinned: true, limit: BULK_LIMIT }, signal),
  );
  const others = useApiQuery(`others?${filterKey}&page=${page}`, (signal) =>
    notesApi.list({ ...listFilters, pinned: false, page, limit: PAGE_SIZE }, signal),
  );
  const reminders = useApiQuery("reminders", (signal) => notesApi.list({ reminder: true, limit: BULK_LIMIT }, signal));
  const reminderNotes = useMemo(() => reminders.data?.data ?? [], [reminders.data]);
  useReminderAlerts(reminderNotes);

  /** Reloads every query after a change. */
  const refreshAll = useCallback(() => {
    summary.reload();
    pinned.reload();
    others.reload();
    reminders.reload();
  }, [summary, pinned, others, reminders]);

  /** Opens an existing note in the editor dialog. */
  const openEditor = useCallback((note) => {
    setEditor((current) => ({ open: true, note, key: current.key + 1 }));
  }, []);

  /** Creates a note from the composer, then attaches queued people and images. */
  async function handleCreate(values, { images, emails }) {
    const { note } = await withToast(() => notesApi.create(values));
    const failures = [];
    for (const email of emails) {
      await notesApi.addCollaborator(note._id, email).catch((err) => failures.push(`${email}: ${err.message}`));
    }
    for (const file of images) {
      await notesApi.uploadImage(note._id, file).catch((err) => failures.push(`${file.name}: ${err.message}`));
    }
    if (failures.length) toast.error(`Note added, but some items failed. ${failures.join(" · ")}`);
    else toast.success("Note added.");
    refreshAll();
  }

  /** Actions for the editor dialog. Each shows a toast on failure and rethrows. */
  const editorActions = {
    save: async (note, changes) => {
      await withToast(() => notesApi.update(note._id, changes), "Note saved.");
      refreshAll();
    },
    remove: async (note) => {
      await withToast(() => notesApi.remove(note._id), "Note deleted.");
      if (page > 1 && others.data?.data.length === 1 && !note.pinned) setFilters({ page: page - 1 });
      refreshAll();
    },
    copy: async (note) => {
      await withToast(() => notesApi.copy(note._id), "Copy created.");
      refreshAll();
    },
    leave: async (note) => {
      await withToast(() => notesApi.removeCollaborator(note._id, user._id), "You left the note.");
      refreshAll();
    },
    addImages: async (note, [file]) => {
      try {
        const { note: updated } = await withToast(() => notesApi.uploadImage(note._id, file));
        refreshAll();
        return updated;
      } catch {
        return null;
      }
    },
    removeImage: async (note, imageId) => {
      try {
        const { note: updated } = await withToast(() => notesApi.removeImage(note._id, imageId), "Image removed.");
        refreshAll();
        return updated;
      } catch {
        return null;
      }
    },
    addCollaborator: async (note, email) => {
      const { note: updated } = await withToast(() => notesApi.addCollaborator(note._id, email), `Shared with ${email}.`);
      refreshAll();
      return updated;
    },
    removeCollaborator: async (note, person) => {
      await withToast(() => notesApi.removeCollaborator(note._id, person._id), `Removed ${person.name}.`);
      refreshAll();
    },
  };

  /** Pins or unpins a note from its card. */
  async function handleTogglePin(note) {
    await withToast(() => notesApi.update(note._id, { pinned: !note.pinned }), note.pinned ? "Note unpinned." : "Note pinned.").catch(
      () => {},
    );
    refreshAll();
  }

  /** Renames a label everywhere and keeps the filter on it if it was selected. */
  async function handleRenameLabel(from, to) {
    await withToast(() => notesApi.renameLabel(from, to), `Label renamed to "${to}".`);
    if (label === from) setFilters({ label: to });
    refreshAll();
  }

  /** Creates a label that no note uses yet. Rethrows so the dialog keeps the text on failure. */
  async function handleCreateLabel(name) {
    await withToast(() => notesApi.createLabel(name), `Label "${name}" created.`);
    summary.reload();
  }

  /** Deletes a label everywhere and clears the filter if it was selected. */
  async function handleDeleteLabel(name) {
    await withToast(() => notesApi.deleteLabel(name), `Label "${name}" deleted.`).catch(() => {});
    if (label === name) setFilters({ label: null });
    refreshAll();
  }

  /** Builds a link to another page of results, keeping the view, label and search. */
  const hrefFor = (target) => {
    const params = new URLSearchParams();
    if (view) params.set("view", view);
    if (label) params.set("label", label);
    if (q) params.set("q", q);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `/notes?${query}` : "/notes";
  };

  const heading = reminderView ? "Reminders" : label || (q ? `Results for "${q}"` : "All notes");
  const labelSuggestions = summary.data?.labels.map((item) => item.name) ?? [];
  const showPinned = page === 1 && (pinned.data?.data.length ?? 0) > 0;
  const loading = pinned.loading || others.loading;
  const error = pinned.error || others.error;
  const isEmpty = !loading && !error && !showPinned && (others.data?.data.length ?? 0) === 0;
  const emptyMessage = reminderView
    ? "No reminders. Use the bell in a note to set one."
    : q || label
      ? "No notes match. Try another search or label."
      : "No notes yet. Use “Take a note…” above to write your first one.";

  const renderNote = (note) => (
    <NoteCard note={note} onOpen={openEditor} onTogglePin={handleTogglePin} currentUserId={user?._id} />
  );

  return (
    <AppShell
      searchValue={q}
      onSearch={(term) => setFilters({ q: term || null })}
      renderSidebar={(close) => (
        <NotesSidebar
          summary={summary.data}
          activeView={view}
          activeLabel={label}
          onSelectView={(next) => {
            setFilters({ view: next || null, label: null });
            close();
          }}
          onSelectLabel={(name) => {
            setFilters({ label: name, view: null });
            close();
          }}
          onEditLabels={() => {
            setLabelsOpen(true);
            close();
          }}
        />
      )}
    >
      <NoteComposer onCreate={handleCreate} labelSuggestions={labelSuggestions} />

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
          {emptyMessage}
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
        labelSuggestions={labelSuggestions}
        actions={editorActions}
      />

      <EditLabelsDialog
        open={labelsOpen}
        onOpenChange={setLabelsOpen}
        labels={summary.data?.labels ?? []}
        onCreate={handleCreateLabel}
        onRename={handleRenameLabel}
        onDelete={handleDeleteLabel}
      />
    </AppShell>
  );
}
