"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** How long the finished bar stays (filling up, then fading) before it is removed. */
const FINISH_MS = 400;
/** Gives up if a navigation never completes (e.g. it was cancelled), so the bar never sticks. */
const GIVE_UP_MS = 15_000;

/**
 * Finds the internal link a click should navigate with, or null when the browser or Next.js
 * will not do a client-side page change (new tab, download, other site, same page, hash only).
 *
 * @param {MouseEvent} event - The click.
 * @param {string} current - Current path and query.
 * @returns {boolean} Whether the click starts a page change.
 */
function startsNavigation(event, current) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  const link = event.target.closest?.("a[href]");
  if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return false;
  const url = new URL(link.href, window.location.href);
  return url.origin === window.location.origin && `${url.pathname}${url.search}` !== current;
}

/**
 * A thin bar at the very top of the window that shows a page is loading after a link is clicked:
 * it grows while the next page loads and fills up and fades once the URL changes. Only the bar
 * moves, so changing pages never looks like a full reload.
 * Uses useSearchParams, so render it inside <Suspense>.
 *
 * @returns {JSX.Element | null}
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const current = query ? `${pathname}?${query}` : pathname;
  // The URL a navigation started from; the bar is "loading" while we are still there.
  const [startedFrom, setStartedFrom] = useState(null);
  const [grown, setGrown] = useState(false);
  const loading = startedFrom !== null && startedFrom === current;
  const finishing = startedFrom !== null && startedFrom !== current;

  // Capture phase, so the click is seen even if a component stops it from bubbling.
  useEffect(() => {
    function handleClick(event) {
      if (!startsNavigation(event, current)) return;
      setGrown(false);
      setStartedFrom(current);
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [current]);

  // Start at 0 width, then grow on the next frame so the CSS transition runs.
  useEffect(() => {
    if (!loading || grown) return undefined;
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, [loading, grown]);

  // Remove the bar after it finishes, or give up on a navigation that never completes.
  useEffect(() => {
    if (startedFrom === null) return undefined;
    const timer = setTimeout(() => setStartedFrom(null), finishing ? FINISH_MS : GIVE_UP_MS);
    return () => clearTimeout(timer);
  }, [startedFrom, finishing]);

  if (startedFrom === null) return null;

  const width = finishing ? "100%" : grown ? "85%" : "0%";
  // Slow creep while waiting (never reaching the end), quick fill when done.
  const transition = finishing ? "width 200ms ease-out, opacity 200ms ease-out 200ms" : "width 8s cubic-bezier(0.1, 0.7, 0.2, 1)";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]" role="progressbar" aria-label="Loading page">
      <div className="h-full bg-brand-strong" style={{ width, transition, opacity: finishing ? 0 : 1 }} />
    </div>
  );
}
