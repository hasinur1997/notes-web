import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Pencil } from "lucide-react";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { formatDate } from "@/lib/format";
import { canOptimizeImage, resolveImageUrl } from "@/lib/imageUrl";
import { markdownToPlainText } from "@/lib/markdown";
import { noteColorClass } from "@/lib/noteColors";

/** Longest text preview, in characters (the card also clamps it to a few lines). */
const EXCERPT_LENGTH = 220;

/**
 * The first part of a post's text as plain text, for previews.
 *
 * @param {string} content - Markdown text.
 * @returns {string} Plain text, cut at a word with "…" when it is longer than the preview.
 */
export function postExcerpt(content) {
  const text = markdownToPlainText(content);
  if (text.length <= EXCERPT_LENGTH) return text;
  return `${text.slice(0, EXCERPT_LENGTH).replace(/\s+\S*$/, "")}…`;
}

/**
 * One post in a list: cover image, title, a short description, author and date, and "Read more".
 * By default the post opens on its public page; with `onOpen` (the author's own list) it opens in
 * place instead. With `onEdit`, an Edit button is shown too.
 *
 * @param {object} props
 * @param {object} props.post - The post (with author and images).
 * @param {boolean} [props.showAuthor=true] - Shows the author (hidden on an author's own page).
 * @param {(post: object) => void} [props.onOpen] - Opens the full post in place (instead of its page).
 * @param {(post: object) => void} [props.onEdit] - Opens the post in the editor.
 * @returns {JSX.Element}
 */
export function PostCard({ post, showAuthor = true, onOpen, onEdit }) {
  const [cover] = post.images ?? [];
  const coverUrl = cover ? resolveImageUrl(cover.url) : "";
  const href = `/posts/${post._id}`;
  const excerpt = postExcerpt(post.content);
  // The title, cover and "Read more" either open the post in place or go to its public page.
  const OpenLink = onOpen ? OpenButton : Link;
  const openProps = onOpen ? { onClick: () => onOpen(post) } : { href };

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border border-border shadow-[0_8px_24px_-12px] shadow-foreground/15 ${noteColorClass(post.color)}`}
    >
      {cover && (
        <OpenLink {...openProps} tabIndex={-1} aria-hidden="true" className="block w-full">
          <Image
            src={coverUrl}
            alt=""
            width={cover.width}
            height={cover.height}
            sizes="(max-width: 640px) 100vw, 360px"
            unoptimized={!canOptimizeImage(coverUrl)}
            className="h-48 w-full object-cover"
          />
        </OpenLink>
      )}

      <div className="flex flex-1 flex-col px-4 pt-4 pb-3">
        <h2 className="text-[19px] leading-6 font-bold break-words">
          <OpenLink {...openProps} className="rounded-sm text-left outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus">
            {post.title}
          </OpenLink>
        </h2>
        {excerpt && <p className="mt-2 line-clamp-3 text-[15px] leading-[22px] break-words text-foreground/85">{excerpt}</p>}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-4">
          {showAuthor && (
            <Link
              href={`/users/${post.author._id}/posts`}
              className="flex min-w-0 items-center gap-2 rounded-full text-[14px] font-semibold hover:underline focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none"
            >
              <UserAvatar name={post.author.name} avatar={post.author.avatar} size="sm" />
              <span className="truncate">{post.author.name}</span>
            </Link>
          )}
          <span className="text-[13px] text-muted-foreground">{formatDate(post.createdAt)}</span>
          <span className="ml-auto flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(post)}
                aria-label={`Edit ${post.title}`}
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none"
              >
                <Pencil className="size-[18px]" aria-hidden="true" />
              </button>
            )}
            <OpenLink
              {...openProps}
              aria-label={`Read more: ${post.title}`}
              className="flex items-center gap-1 rounded-md text-[14px] font-bold text-brand-strong hover:underline focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none"
            >
              Read more
              <ArrowRight className="size-4" aria-hidden="true" />
            </OpenLink>
          </span>
        </div>
      </div>
    </article>
  );
}

/** A button with the same props as the link it replaces (used when the post opens in place). */
function OpenButton({ children, ...props }) {
  return (
    <button type="button" {...props}>
      {children}
    </button>
  );
}
