"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { PostArticle } from "@/components/posts/PostArticle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useApiQuery } from "@/hooks/useApiQuery";
import { postsApi } from "@/lib/api";
import { noteColorClass } from "@/lib/noteColors";

const NOT_FOUND = 404;

/**
 * `/posts/[id]`: one post in full (images, title, author, date and the formatted text). Public.
 *
 * @returns {JSX.Element}
 */
export function PostDetailView() {
  const { id } = useParams();
  const { user } = useAuth();
  const query = useApiQuery(`post:${id}`, (signal) => postsApi.get(id, signal));
  const post = query.data?.post;

  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 rounded-md text-[15px] font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          All posts
        </Link>

        {query.error ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6" role="alert">
            {query.error.status === NOT_FOUND ? (
              <p className="text-[15px]">This post doesn&apos;t exist or was deleted.</p>
            ) : (
              <>
                <p className="text-[15px]">Couldn&apos;t load the post. {query.error.message}</p>
                <Button variant="outline" onClick={query.reload} className="h-10 rounded-[10px] px-4 text-[15px]">
                  Try again
                </Button>
              </>
            )}
          </div>
        ) : !post ? (
          <p className="text-[15px] text-muted-foreground" role="status">
            Loading post…
          </p>
        ) : (
          <article className={`overflow-hidden rounded-2xl border border-border ${noteColorClass(post.color)}`}>
            <PostArticle
              post={post}
              actions={
                user?._id === post.author._id && (
                  <Link href="/posts" className="text-[14px] font-bold text-brand-strong hover:underline">
                    Edit in My posts
                  </Link>
                )
              }
            />
          </article>
        )}
      </div>
    </PublicShell>
  );
}
