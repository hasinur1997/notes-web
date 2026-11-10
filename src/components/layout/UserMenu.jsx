"use client";

import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/layout/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";

const ITEM_CLASS = "h-11 gap-2 rounded-lg px-2 text-[15px] font-medium [&_svg:not([class*='size-'])]:size-[18px]";

/**
 * Avatar button in the header that opens the account menu: name, email, Edit profile, Sign out.
 *
 * @returns {JSX.Element}
 */
export function UserMenu() {
  const { user, logout } = useAuth();

  /** Ends the session and confirms it with a toast. */
  function handleSignOut() {
    logout();
    toast.success("Signed out.");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <UserAvatar name={user?.name} avatar={user?.avatar} ringed />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={13}
        className="w-[260px] rounded-2xl border border-border p-2 shadow-[0_8px_24px_-6px] shadow-foreground/15 ring-0"
      >
        <div className="flex items-center gap-2.5 p-2 pb-4">
          <UserAvatar name={user?.name} avatar={user?.avatar} />
          <div className="min-w-0">
            <p className="truncate text-base leading-6 font-bold">{user?.name}</p>
            <p className="truncate text-[13px] leading-[18px] text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator className="mx-0 my-0 mb-2 bg-border" />
        <DropdownMenuItem render={<Link href="/profile" />} className={ITEM_CLASS}>
          <UserRound aria-hidden="true" />
          Edit profile
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={handleSignOut} className={ITEM_CLASS}>
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
