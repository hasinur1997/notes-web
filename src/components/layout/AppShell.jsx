"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { SearchBox } from "@/components/layout/SearchBox";
import { UserMenu } from "@/components/layout/UserMenu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

/** Matches Tailwind's `lg` breakpoint, where the sidebar sits beside the content. */
const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * App frame for signed-in pages: header (menu button, brand, search, account menu),
 * a sidebar, and the main content.
 * On large screens the menu button collapses the sidebar; on small screens it opens it as a sheet.
 *
 * @param {object} props
 * @param {(close: () => void) => React.ReactNode} props.renderSidebar - Sidebar content; call `close` after navigating.
 * @param {string} props.searchValue - Current search term.
 * @param {(term: string) => void} props.onSearch - Called when the search term changes.
 * @param {React.ReactNode} props.children - Page content.
 * @returns {JSX.Element}
 */
export function AppShell({ renderSidebar, searchValue, onSearch, children }) {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  /** Collapses the desktop sidebar, or opens the mobile sheet, depending on screen size. */
  function handleMenuClick() {
    if (window.matchMedia(DESKTOP_QUERY).matches) setDesktopOpen((open) => !open);
    else setMobileOpen(true);
  }

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 grid h-16 grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-border bg-background px-4 md:grid-cols-[1fr_minmax(0,640px)_1fr] md:px-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMenuClick}
            aria-label="Toggle navigation"
            className="flex size-11 items-center justify-center rounded-full hover:bg-muted"
          >
            <Menu className="size-6" strokeWidth={2} aria-hidden="true" />
          </button>
          <BrandLogo nameClassName="hidden sm:inline" />
        </div>
        <SearchBox value={searchValue} onSearch={onSearch} />
        <div className="justify-self-end">
          <UserMenu />
        </div>
      </header>

      <div className="flex">
        {desktopOpen && (
          <aside className="hidden w-[248px] shrink-0 px-4 pt-6 pb-8 lg:block" aria-label="Notes navigation">
            {renderSidebar(() => {})}
          </aside>
        )}
        <main className="min-w-0 flex-1 px-4 pt-6 pb-8 md:px-8">{children}</main>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] bg-background px-4 pt-16">
          <SheetTitle className="sr-only">Notes navigation</SheetTitle>
          {renderSidebar(() => setMobileOpen(false))}
        </SheetContent>
      </Sheet>
    </div>
  );
}
