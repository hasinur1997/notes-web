"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { UserMenu } from "@/components/layout/UserMenu";
import { useAuth } from "@/context/AuthContext";
import { PAGE_ENTER_CLASS } from "@/lib/motion";

const LINK_BUTTON =
  "inline-flex h-10 items-center justify-center rounded-[10px] px-4 text-[15px] font-bold focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none";

/**
 * Frame for public pages (the posts feed, a post, a user's posts): brand on the left and, on the
 * right, Log in / Sign up for visitors or My notes and the account menu for signed-in users.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Page content.
 * @returns {JSX.Element}
 */
export function PublicShell({ children }) {
  const { status } = useAuth();

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background px-4 md:px-8">
        <Link href="/" aria-label="Notes home" className="rounded-[10px] focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none">
          <BrandLogo nameClassName="hidden sm:inline" />
        </Link>
        <nav aria-label="Account" className="flex items-center gap-2">
          {status === "authenticated" && (
            <>
              <Link href="/notes" className={`${LINK_BUTTON} hover:bg-muted`}>
                My notes
              </Link>
              <UserMenu />
            </>
          )}
          {status === "anonymous" && (
            <>
              <Link href="/register" className={`${LINK_BUTTON} hover:bg-muted`}>
                Sign up
              </Link>
              <Link href="/login" className={`${LINK_BUTTON} bg-primary text-primary-foreground hover:bg-primary/85`}>
                Log in
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className={`mx-auto w-full max-w-6xl px-4 pt-8 pb-12 md:px-8 ${PAGE_ENTER_CLASS}`}>{children}</main>
    </div>
  );
}
