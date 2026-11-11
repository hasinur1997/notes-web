"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { SidebarPage } from "@/components/layout/SidebarPage";

/**
 * Frame for the admin pages: admins only, with the same header and notes sidebar as the notes
 * page (the admin menu highlighted).
 *
 * @param {object} props
 * @param {"users" | "user-notes" | "interests"} props.active - The admin menu to highlight.
 * @param {React.ReactNode} props.children - Page content.
 * @returns {JSX.Element}
 */
export function AdminShell({ active, children }) {
  return (
    <AuthGuard>
      <AdminGuard>
        <SidebarPage active={active}>{children}</SidebarPage>
      </AdminGuard>
    </AuthGuard>
  );
}
