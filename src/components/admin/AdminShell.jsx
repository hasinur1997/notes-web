"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AppShell } from "@/components/layout/AppShell";

const USERS_PATH = "/admin/users";

/**
 * Frame for every admin page: admins only, an "Admin" badge by the logo, the admin sidebar,
 * and a header search that finds a user by email (on the Users page).
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function AdminShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onUsersPage = pathname === USERS_PATH;
  const email = onUsersPage ? (searchParams.get("email") ?? "") : "";

  /** Shows the user with that email (replacing history while typing on the Users page). */
  function findUser(term) {
    const target = term ? `${USERS_PATH}?email=${encodeURIComponent(term)}` : USERS_PATH;
    if (onUsersPage) router.replace(target);
    else if (term) router.push(target);
  }

  return (
    <AuthGuard>
      <AdminGuard>
        <AppShell
          searchValue={email}
          onSearch={findUser}
          searchPlaceholder="Find a user by email"
          navLabel="Admin navigation"
          badge={
            <span className="hidden rounded-md bg-brand-soft px-1.5 py-0.5 text-xs font-bold text-brand-strong sm:inline">Admin</span>
          }
          renderSidebar={(close) => <AdminSidebar onNavigate={close} />}
        >
          {children}
        </AppShell>
      </AdminGuard>
    </AuthGuard>
  );
}
