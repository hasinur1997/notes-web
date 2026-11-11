"use client";

import { useParams, useSearchParams } from "next/navigation";
import { PublicShell } from "@/components/layout/PublicShell";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { PostList } from "@/components/posts/PostList";
import { useApiQuery } from "@/hooks/useApiQuery";
import { postsApi } from "@/lib/api";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 12;
const NOT_FOUND = 404;

/**
 * `/users/[id]/posts`: a person's public profile (name, photo, interests) and their posts.
 * Both come from one API call (one aggregation pipeline with $lookup on the server).
 *
 * @returns {JSX.Element}
 */
export function UserPostsView() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const query = useApiQuery(`user-posts:${id}&page=${page}`, (signal) => postsApi.listByUser(id, { page, limit: PAGE_SIZE }, signal));
  const person = query.data?.user;
  const missing = query.error?.status === NOT_FOUND;

  return (
    <PublicShell>
      {missing ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-[15px]" role="alert">
          This person doesn&apos;t exist or their account was deleted.
        </div>
      ) : (
        <>
          {person && (
            <section className="mb-8 flex flex-wrap items-center gap-4" aria-label="Profile">
              <UserAvatar name={person.name} avatar={person.avatar} size="lg" />
              <div className="min-w-0">
                <h1 className="text-[28px] leading-9 font-extrabold break-words">{person.name}</h1>
                <p className="text-[14px] text-muted-foreground">
                  Joined {formatDate(person.createdAt)} · {query.data.meta.total === 1 ? "1 post" : `${query.data.meta.total} posts`}
                </p>
                {person.interests.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1" aria-label="Interests">
                    {person.interests.map((interest) => (
                      <li key={interest} className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-strong">
                        {interest}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
          <PostList
            query={query}
            showAuthor={false}
            hrefFor={(target) => (target > 1 ? `/users/${id}/posts?page=${target}` : `/users/${id}/posts`)}
            emptyMessage="No posts yet."
          />
        </>
      )}
    </PublicShell>
  );
}
