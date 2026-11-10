"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Reads and updates the notes filters kept in the URL (`?label=`, `?q=`, `?page=`),
 * so filters survive reloads and can be shared or bookmarked.
 * Must be used inside a <Suspense> boundary (useSearchParams).
 *
 * @returns {{
 *   label: string, q: string, page: number,
 *   setFilters: (changes: { label?: string | null, q?: string | null, page?: number | null }) => void,
 * }}
 */
export function useNotesFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = useMemo(() => {
    const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
    return {
      label: searchParams.get("label") ?? "",
      q: searchParams.get("q") ?? "",
      page: Number.isFinite(page) && page > 0 ? page : 1,
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (changes) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === undefined || value === "" || (key === "page" && value === 1)) next.delete(key);
        else next.set(key, String(value));
      }
      // Changing what is shown always starts again from the first page.
      if (!("page" in changes)) next.delete("page");
      const query = next.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: "page" in changes });
    },
    [searchParams, router, pathname],
  );

  return { ...filters, setFilters };
}
