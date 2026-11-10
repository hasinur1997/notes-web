import { RolesView } from "@/components/admin/RolesView";

export const metadata = {
  title: "Roles & access · Admin",
};

/**
 * /admin/roles: roles, permissions and role changes (admins only).
 *
 * @returns {JSX.Element}
 */
export default function AdminRolesPage() {
  return <RolesView />;
}
