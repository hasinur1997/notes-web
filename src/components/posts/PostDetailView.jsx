"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useApiQuery } from "@/hooks/useApiQuery";
import { postsApi } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { canOptimizeImage, resolveImageUrl } from "@/lib/imageUrl";
import { Markdown } from "@/lib/markdown";
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
            {post.images.map((image) => {
              const url = resolveImageUrl(image.url);
              return (
                <Image
                  key={image._id}
                  src={url}
                  alt=""
                  width={image.width}
                  height={image.height}
                  sizes="(max-width: 768px) 100vw, 768px"
                  unoptimized={!canOptimizeImage(url)}
                  className="max-h-[480px] w-full object-cover"
                />
              );
            })}
            <div className="px-5 pt-6 pb-8 md:px-8">
              <h1 className="text-[28px] leading-9 font-extrabold break-words">{post.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link href={`/users/${post.author._id}/posts`} className="flex items-center gap-2 rounded-full font-semibold hover:underline">
                  <UserAvatar name={post.author.name} avatar={post.author.avatar} size="sm" />
                  {post.author.name}
                </Link>
                <span className="text-[14px] text-muted-foreground">
                  {formatDate(post.createdAt)}
                  {post.updatedAt !== post.createdAt && ` · Edited ${formatDate(post.updatedAt)}`}
                </span>
                {user?._id === post.author._id && (
                  <Link href="/posts" className="ml-auto text-[14px] font-bold text-brand-strong hover:underline">
                    Edit in My posts
                  </Link>
                )}
              </div>
              {post.content && <Markdown text={post.content} className="mt-6 text-[16px] leading-7 break-words" />}
            </div>
          </article>
        )}
      </div>
    </PublicShell>
  );
}
