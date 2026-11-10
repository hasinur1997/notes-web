import { Suspense } from "react";
import { UsersView } from "@/components/admin/UsersView";

export const metadata = {
  title: "Users · Admin",
};

/**
 * /admin/users: manage accounts (admins only).
 *
 * @returns {JSX.Element}
 */
export default function AdminUsersPage() {
  return (
    <Suspense>
      <UsersView />
    </Suspense>
  );
}
