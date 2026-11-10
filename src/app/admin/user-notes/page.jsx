import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { UserNotesView } from "@/components/admin/UserNotesView";

export const metadata = {
  title: "User's Notes · Admin",
};

/**
 * /admin/user-notes: everyone's notes, one person at a time, read-only (admins only).
 *
 * @returns {JSX.Element}
 */
export default function AdminUserNotesPage() {
  return (
    <Suspense>
      <AdminShell active="user-notes">
        <UserNotesView />
      </AdminShell>
    </Suspense>
  );
}
