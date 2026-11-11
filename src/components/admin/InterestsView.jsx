"use client";

import Link from "next/link";
import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AdminPager } from "@/components/admin/AdminPager";
import { UserSearch } from "@/components/admin/UserSearch";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/useApiQuery";
import { adminApi } from "@/lib/api";

/** Interest groups per page. */
const PAGE_SIZE = 10;
const CARD = "overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_24px_-12px] shadow-foreground/15";

/**
 * /admin/interests: users grouped by interest, largest group first. Filter by one interest
 * (`?interest=`); clicking a group's name filters to it.
 *
 * @returns {JSX.Element}
 */
export function InterestsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const interest = searchParams.get("interest") ?? "";

  const groups = useApiQuery(`interest=${interest}&page=${page}`, (signal) =>
    adminApi.listInterestGroups({ interest: interest || undefined, page, limit: PAGE_SIZE }, signal),
  );
  const rows = groups.data?.data ?? [];
  const meta = groups.data?.meta;

  /** Puts the filter in the URL (back to page 1). */
  const handleFilter = useCallback(
    (term) => router.replace(term ? `${pathname}?interest=${encodeURIComponent(term)}` : pathname),
    [router, pathname],
  );

  const hrefFor = (target) => {
    const params = new URLSearchParams();
    if (interest) params.set("interest", interest);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] leading-10 font-extrabold">Interests</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">Users grouped by the interests on their profiles.</p>
      </div>

      <section className={CARD} aria-labelledby="interests-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5">
          <h2 id="interests-heading" className="sr-only">
            {interest ? `Users interested in ${interest}` : "All interests"}
          </h2>
          <UserSearch value={interest} onSearch={handleFilter} placeholder="Filter by an interest, e.g. chess"
            label="Filter by interest" className="w-full max-w-sm" />
          {meta && (
            <p className="text-[14px] text-muted-foreground" role="status">
              {meta.total === 1 ? "1 interest" : `${meta.total} interests`}
            </p>
          )}
        </div>

        {groups.error ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center" role="alert">
            <p className="text-[15px]">Couldn&apos;t load interests. {groups.error.message}</p>
            <Button variant="outline" onClick={groups.reload} className="h-10 rounded-[10px] px-4 text-[15px]">
              Try again
            </Button>
          </div>
        ) : groups.loading && !groups.data ? (
          <p className="px-4 py-10 text-center text-[15px] text-muted-foreground" role="status">
            Loading interests…
          </p>
        ) : rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-[15px] text-muted-foreground">
            {interest ? (
              <>
                Nobody is interested in &ldquo;{interest}&rdquo;.{" "}
                <Link href={pathname} className="font-bold text-brand-strong hover:underline">
                  Show all interests
                </Link>
              </>
            ) : (
              "No user has added interests yet."
            )}
          </p>
        ) : (
          <ul className={`divide-y divide-border ${groups.loading ? "opacity-60" : ""}`} aria-busy={groups.loading}>
            {rows.map((group) => (
              <li key={group.interest} className="flex flex-col gap-2 px-4 py-4">
                <div className="flex items-center gap-2">
                  <Link
                    href={`${pathname}?interest=${encodeURIComponent(group.interest)}`}
                    className="rounded-full bg-brand-soft px-3 py-1 text-[14px] font-bold text-brand-strong hover:underline"
                  >
                    {group.interest}
                  </Link>
                  <span className="text-[14px] text-muted-foreground">
                    {group.count === 1 ? "1 user" : `${group.count} users`}
                  </span>
                </div>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[14px]" aria-label={`Users interested in ${group.interest}`}>
                  {group.users.map((person) => (
                    <li key={person._id}>
                      <Link href={`/admin/user-notes?user=${person._id}`} className="font-semibold hover:underline">
                        {person.name}
                      </Link>{" "}
                      <span className="text-muted-foreground">{person.email}</span>
                    </li>
                  ))}
                  {group.count > group.users.length && (
                    // The API lists a limited number of people per group; count is the full size.
                    <li className="text-muted-foreground">and {group.count - group.users.length} more</li>
                  )}
                </ul>
              </li>
            ))}
          </ul>
        )}

        {meta && meta.total > 0 && (
          <AdminPager summary={`Page ${meta.page} of ${meta.totalPages}`} page={meta.page} totalPages={meta.totalPages} hrefFor={hrefFor} />
        )}
      </section>
    </div>
  );
}
