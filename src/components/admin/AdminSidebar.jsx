"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { File, LayoutGrid, Shield, UsersRound } from "lucide-react";

const ROW =
  "flex h-11 w-full items-center gap-4 rounded-full px-4 text-[15px] focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none";

/** Admin pages, in sidebar order. */
const ADMIN_LINKS = [
  { href: "/admin/users", label: "Users", icon: UsersRound },
  { href: "/admin/notes", label: "All notes", icon: LayoutGrid },
  { href: "/admin/roles", label: "Roles & access", icon: Shield },
];

/**
 * Sidebar for the admin area: a link back to the admin's own notes, then the admin pages.
 * The current page is highlighted like the notes sidebar.
 *
 * @param {{ onNavigate: () => void }} props - Called after a link is chosen (closes the mobile sheet).
 * @returns {JSX.Element}
 */
export function AdminSidebar({ onNavigate }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col">
      <Link href="/notes" onClick={onNavigate} className={`${ROW} font-medium hover:bg-brand-soft`}>
        <File className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
        My notes
      </Link>
      <p className="mt-6 mb-2 px-4 text-[13px] leading-[18px] text-muted-foreground">Admin</p>
      <ul className="flex flex-col gap-1">
        {ADMIN_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`${ROW} ${active ? "bg-primary/75 font-bold" : "font-medium hover:bg-brand-soft"}`}
              >
                <Icon className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
