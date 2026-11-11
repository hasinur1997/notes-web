import Image from "next/image";
import Link from "next/link";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { formatDate } from "@/lib/format";
import { canOptimizeImage, resolveImageUrl } from "@/lib/imageUrl";
import { Markdown } from "@/lib/markdown";

/**
 * One post in full: images, title, author and dates, and the formatted text. Shared by the public
 * post page and the post viewer in My posts, so both show a post the same way.
 *
 * @param {object} props
 * @param {object} props.post - The post (with author and images).
 * @param {React.ElementType} [props.titleAs="h1"] - Element for the title (e.g. a dialog title).
 * @param {boolean} [props.linkAuthor=true] - Links the author's name to their public posts page.
 * @param {React.ReactNode} [props.actions] - Extra controls at the end of the author line.
 * @returns {JSX.Element}
 */
export function PostArticle({ post, titleAs: Title = "h1", linkAuthor = true, actions }) {
  const author = (
    <>
      <UserAvatar name={post.author.name} avatar={post.author.avatar} size="sm" />
      {post.author.name}
    </>
  );

  return (
    <>
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
        <Title className="text-[28px] leading-9 font-extrabold break-words">{post.title}</Title>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {linkAuthor ? (
            <Link href={`/users/${post.author._id}/posts`} className="flex items-center gap-2 rounded-full font-semibold hover:underline">
              {author}
            </Link>
          ) : (
            <span className="flex items-center gap-2 font-semibold">{author}</span>
          )}
          <span className="text-[14px] text-muted-foreground">
            {formatDate(post.createdAt)}
            {post.updatedAt !== post.createdAt && ` · Edited ${formatDate(post.updatedAt)}`}
          </span>
          {actions && <span className="ml-auto flex items-center gap-2">{actions}</span>}
        </div>
        {post.content && <Markdown text={post.content} className="mt-6 text-[16px] leading-7 break-words" />}
      </div>
    </>
  );
}
