import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { UsersView } from "@/components/admin/UsersView";

export const metadata = {
  title: "Users · Admin",
};

/**
 * /admin/users: manage accounts (admins only). The page renders its own admin frame (like the
 * other signed-in pages), so the page segment itself is always rendered.
 *
 * @returns {JSX.Element}
 */
export default function AdminUsersPage() {
  return (
    <Suspense>
      <AdminShell>
        <UsersView />
      </AdminShell>
    </Suspense>
  );
}
