"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Start loading this far before the end of the list comes into view, so scrolling never waits. */
const PRELOAD_MARGIN = "400px 0px";

/**
 * Sits under an infinite list and asks for more when it comes near the viewport. Shows a
 * spinner while loading, a retry button after an error, and an end message when done.
 * A "Load more" button is always offered too, for keyboard users and as a fallback.
 *
 * @param {object} props
 * @param {boolean} props.hasMore - Whether more items exist.
 * @param {boolean} props.loading - Whether the next page is loading.
 * @param {Error | null} props.error - Error from the last attempt.
 * @param {() => void} props.onLoadMore - Loads the next page.
 * @param {string} props.endMessage - Shown once everything is loaded.
 * @returns {JSX.Element}
 */
export function InfiniteScrollTrigger({ hasMore, loading, error, onLoadMore, endMessage }) {
  const ref = useRef(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  });

  // Re-observing after each load also covers a short page: if the trigger is still in view,
  // the observer fires again immediately and the next page loads.
  useEffect(() => {
    const element = ref.current;
    if (!element || !hasMore || loading || error) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && onLoadMoreRef.current(),
      { rootMargin: PRELOAD_MARGIN },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMore, loading, error]);

  return (
    <div ref={ref} className="flex min-h-12 flex-col items-center justify-center gap-2 text-[14px] text-muted-foreground">
      {loading && (
        <p role="status" className="flex items-center gap-2 animate-in fade-in-0 duration-200">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading more notes…
        </p>
      )}
      {!loading && error && (
        <div role="alert" className="flex flex-col items-center gap-2">
          <p>Couldn&apos;t load more notes. {error.message}</p>
          <Button variant="outline" onClick={onLoadMore} className="h-10 rounded-[10px] px-4 text-[15px]">
            Try again
          </Button>
        </div>
      )}
      {!loading && !error && hasMore && (
        <Button variant="ghost" onClick={onLoadMore} className="h-10 rounded-[10px] px-4 text-[15px]">
          Load more
        </Button>
      )}
      {!loading && !error && !hasMore && <p className="animate-in fade-in-0 duration-300">{endMessage}</p>}
    </div>
  );
}
