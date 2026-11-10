"use client";

import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AppShell } from "@/components/layout/AppShell";
import { NotesSidebar } from "@/components/notes/NotesSidebar";
import { useApiQuery } from "@/hooks/useApiQuery";
import { notesApi } from "@/lib/api";

/**
 * Frame for the admin pages: admins only, with the same header and notes sidebar as the notes
 * page (the admin menus highlighted). Choosing a notes entry in the sidebar opens the notes page.
 *
 * @param {object} props
 * @param {"users" | "user-notes"} props.active - The admin menu to highlight.
 * @param {React.ReactNode} props.children - Page content.
 * @returns {JSX.Element}
 */
export function AdminShell({ active, children }) {
  return (
    <AuthGuard>
      <AdminGuard>
        <AdminFrame active={active}>{children}</AdminFrame>
      </AdminGuard>
    </AuthGuard>
  );
}

/** The header and sidebar, rendered once the user is known to be an admin. */
function AdminFrame({ active, children }) {
  const router = useRouter();
  const summary = useApiQuery("summary", (signal) => notesApi.summary(signal));

  /** Opens the notes page with the given filters. */
  function openNotes(params) {
    const query = new URLSearchParams(params).toString();
    router.push(query ? `/notes?${query}` : "/notes");
  }

  return (
    <AppShell
      renderSidebar={(close) => (
        <NotesSidebar
          summary={summary.data}
          activeView=""
          activeLabel=""
          activeAdmin={active}
          showAdmin
          onNavigate={close}
          onSelectView={(view) => {
            close();
            openNotes(view ? { view } : {});
          }}
          onSelectLabel={(label) => {
            close();
            openNotes({ label });
          }}
        />
      )}
    >
      {children}
    </AppShell>
  );
}
