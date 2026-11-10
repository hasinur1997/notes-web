"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Renders its children only for signed-in users; everyone else is sent to /login.
 * UX only: the API rejects unauthenticated requests regardless of this guard.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Protected content.
 * @returns {JSX.Element | null}
 */
export function AuthGuard({ children }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-svh items-center justify-center text-[15px] text-muted-foreground" role="status">
        Loading…
      </div>
    );
  }

  return children;
}
