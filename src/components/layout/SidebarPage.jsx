"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { NotesSidebar } from "@/components/notes/NotesSidebar";
import { useAuth } from "@/context/AuthContext";
import { useApiQuery } from "@/hooks/useApiQuery";
import { notesApi } from "@/lib/api";
import { isAdmin } from "@/lib/roles";

/**
 * Frame for signed-in pages other than /notes (Posts, admin pages): the app header and the notes
 * sidebar with this page's menu highlighted. Choosing a notes entry in the sidebar opens the
 * notes page. Render it inside AuthGuard.
 *
 * @param {object} props
 * @param {"posts" | "users" | "user-notes" | "interests"} props.active - The sidebar menu to highlight.
 * @param {React.ReactNode} props.children - Page content.
 * @returns {JSX.Element}
 */
export function SidebarPage({ active, children }) {
  const router = useRouter();
  const { user } = useAuth();
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
          activePage={active}
          showAdmin={isAdmin(user)}
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
