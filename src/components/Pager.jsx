import Link from "next/link";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from "@/components/ui/pagination";

/** How many page numbers to show around the current page before collapsing into "…". */
const SIBLINGS = 1;

/**
 * Lists the page numbers to show, with "…" gaps for long ranges.
 *
 * @param {number} page - Current page (1-based).
 * @param {number} totalPages - Total pages.
 * @returns {(number | "gap-start" | "gap-end")[]} Page numbers and gap markers.
 */
export function getPageItems(page, totalPages) {
  const first = Math.max(2, page - SIBLINGS);
  const last = Math.min(totalPages - 1, page + SIBLINGS);
  const items = [1];
  if (first > 2) items.push("gap-start");
  for (let n = first; n <= last; n++) items.push(n);
  if (last < totalPages - 1) items.push("gap-end");
  if (totalPages > 1) items.push(totalPages);
  return items;
}

const BASE = "inline-flex h-11 items-center justify-center rounded-xl text-[15px] font-medium transition-colors";
const BOXED = `${BASE} border border-border bg-card px-3 hover:bg-muted`;
const DISABLED = "pointer-events-none text-muted-foreground";

/**
 * Previous / page numbers / Next, as links that keep the rest of the URL.
 * Renders nothing when there is only one page.
 *
 * @param {object} props
 * @param {number} props.page - Current page (1-based).
 * @param {number} props.totalPages - Total number of pages.
 * @param {(page: number) => string} props.hrefFor - Builds the URL for a page.
 * @returns {JSX.Element | null}
 */
export function Pager({ page, totalPages, hrefFor }) {
  if (totalPages <= 1) return null;
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <Pagination>
      <PaginationContent className="gap-2">
        <PaginationItem>
          <Link
            href={hrefFor(Math.max(1, page - 1))}
            aria-disabled={!hasPrevious}
            tabIndex={hasPrevious ? undefined : -1}
            className={`${BOXED} ${hasPrevious ? "" : DISABLED}`}
          >
            Previous
          </Link>
        </PaginationItem>

        {getPageItems(page, totalPages).map((item) =>
          typeof item === "number" ? (
            <PaginationItem key={item}>
              <Link
                href={hrefFor(item)}
                aria-current={item === page ? "page" : undefined}
                className={`${BASE} size-11 ${
                  item === page ? "bg-brand-soft font-bold text-brand-strong" : "hover:bg-muted"
                }`}
              >
                {item}
              </Link>
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationEllipsis className="size-11" />
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <Link
            href={hrefFor(Math.min(totalPages, page + 1))}
            aria-disabled={!hasNext}
            tabIndex={hasNext ? undefined : -1}
            className={`${BOXED} ${hasNext ? "" : DISABLED}`}
          >
            Next
          </Link>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
