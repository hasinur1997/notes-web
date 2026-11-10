import Link from "next/link";

const BUTTON =
  "inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-4 text-[15px] font-medium hover:bg-muted focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none";
const DISABLED = "pointer-events-none text-muted-foreground";

/**
 * Footer of an admin table: a summary on the left, Previous / Next links on the right.
 *
 * @param {object} props
 * @param {React.ReactNode} props.summary - e.g. "Showing 1–8 of 24".
 * @param {number} props.page - Current page (1-based).
 * @param {number} props.totalPages - Total pages.
 * @param {(page: number) => string} props.hrefFor - URL for a page.
 * @returns {JSX.Element}
 */
export function AdminPager({ summary, page, totalPages, hrefFor }) {
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
      <p className="text-[14px] text-muted-foreground">{summary}</p>
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex gap-2">
          <Link href={hrefFor(page - 1)} aria-disabled={!hasPrevious} tabIndex={hasPrevious ? undefined : -1} className={`${BUTTON} ${hasPrevious ? "" : DISABLED}`}>
            Previous
          </Link>
          <Link href={hrefFor(page + 1)} aria-disabled={!hasNext} tabIndex={hasNext ? undefined : -1} className={`${BUTTON} ${hasNext ? "" : DISABLED}`}>
            Next
          </Link>
        </nav>
      )}
    </div>
  );
}
