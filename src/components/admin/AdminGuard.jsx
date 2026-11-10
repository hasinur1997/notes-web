"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/roles";

/**
 * Renders its children only for admins; other signed-in users are sent to their notes.
 * UX only: every admin request is checked by the API (403 for non-admins).
 * Must be used inside AuthGuard.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element | null}
 */
export function AdminGuard({ children }) {
  const { user } = useAuth();
  const router = useRouter();
  const allowed = isAdmin(user);

  useEffect(() => {
    if (!allowed) router.replace("/notes");
  }, [allowed, router]);

  if (!allowed) {
    return (
      <div className="flex min-h-svh items-center justify-center text-[15px] text-muted-foreground" role="status">
        Loading…
      </div>
    );
  }
  return children;
}
