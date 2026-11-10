import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AllNotesView } from "@/components/admin/AllNotesView";

export const metadata = {
  title: "All notes · Admin",
};

/**
 * /admin/notes: every note, read-only (admins only). Renders its own admin frame.
 *
 * @returns {JSX.Element}
 */
export default function AdminNotesPage() {
  return (
    <Suspense>
      <AdminShell>
        <AllNotesView />
      </AdminShell>
    </Suspense>
  );
}
