/**
 * Fade for a page's content when it first appears. Applied to the content area only (never the
 * header or sidebar), so moving between pages keeps the frame steady instead of flashing the
 * whole screen like a reload. `prefers-reduced-motion` turns it off (globals.css).
 */
export const PAGE_ENTER_CLASS = "animate-in fade-in-0 duration-300 ease-out";
