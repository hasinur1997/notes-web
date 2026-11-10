import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

/**
 * Layout for /admin/*: the admin frame (admins only) around each admin page.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export default function AdminLayout({ children }) {
  return (
    <Suspense>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
