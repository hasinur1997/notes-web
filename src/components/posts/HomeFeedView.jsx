"use client";

import Link from "next/link";
import { PublicShell } from "@/components/layout/PublicShell";
import { PostList } from "@/components/posts/PostList";
import { useAuth } from "@/context/AuthContext";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { postsApi } from "@/lib/api";

/** Posts loaded per batch (fills 1, 2 or 3 columns evenly). */
const PAGE_SIZE = 12;

/**
 * `/`: the public feed. Everyone (signed in or not) sees every post, newest first, with a short
 * description and "Read more". More posts load as the reader scrolls.
 *
 * @returns {JSX.Element}
 */
export function HomeFeedView() {
  const { status } = useAuth();
  const posts = useInfiniteList(`feed&limit=${PAGE_SIZE}`, (page, signal) => postsApi.list({ page, limit: PAGE_SIZE }, signal));

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
      <PostList query={posts} emptyMessage="No posts yet." />
    </PublicShell>
  );
}
