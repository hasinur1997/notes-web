"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PublicShell } from "@/components/layout/PublicShell";
import { PostList } from "@/components/posts/PostList";
import { useAuth } from "@/context/AuthContext";
import { useApiQuery } from "@/hooks/useApiQuery";
import { postsApi } from "@/lib/api";

/** Posts per page (fills 1, 2 or 3 columns evenly). */
const PAGE_SIZE = 12;

/**
 * `/`: the public feed. Everyone (signed in or not) sees every post, newest first, with a short
 * description and "Read more". The page number lives in the URL.
 *
 * @returns {JSX.Element}
 */
export function HomeFeedView() {
  const { status } = useAuth();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const posts = useApiQuery(`feed&page=${page}`, (signal) => postsApi.list({ page, limit: PAGE_SIZE }, signal));

  return (
    <PublicShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] leading-10 font-extrabold">Posts</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">What people are sharing, newest first.</p>
        </div>
        {status === "authenticated" && (
          <Link
            href="/posts"
            className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-[15px] font-bold text-primary-foreground hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none"
          >
            Write a post
          </Link>
        )}
      </div>
      <PostList query={posts} hrefFor={(target) => (target > 1 ? `/?page=${target}` : "/")} emptyMessage="No posts yet." />
    </PublicShell>
  );
}
