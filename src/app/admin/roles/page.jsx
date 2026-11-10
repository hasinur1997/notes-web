import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { RolesView } from "@/components/admin/RolesView";

export const metadata = {
  title: "Roles & access · Admin",
};

/**
 * /admin/roles: roles, permissions and role changes (admins only). Renders its own admin frame.
 *
 * @returns {JSX.Element}
 */
export default function AdminRolesPage() {
  return (
    <Suspense>
      <AdminShell>
        <RolesView />
      </AdminShell>
    </Suspense>
  );
}
