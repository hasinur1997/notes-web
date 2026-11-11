import { Pager } from "@/components/Pager";
import { PostCard } from "@/components/posts/PostCard";
import { Button } from "@/components/ui/button";

/**
 * A page of posts as a card grid, with loading, error and empty states and page links.
 *
 * @param {object} props
 * @param {{ data: { data: object[], meta: object } | undefined, loading: boolean, error: Error | null, reload: () => void }} props.query - The list query (from useApiQuery).
 * @param {(page: number) => string} props.hrefFor - URL for a page of results.
 * @param {React.ReactNode} props.emptyMessage - Shown when there are no posts.
 * @param {boolean} [props.showAuthor=true] - Shows each post's author.
 * @param {(post: object) => void} [props.onEdit] - Adds an Edit button to each card.
 * @returns {JSX.Element}
 */
export function PostList({ query, hrefFor, emptyMessage, showAuthor = true, onEdit }) {
  if (query.error) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6" role="alert">
        <p className="text-[15px]">Couldn&apos;t load posts. {query.error.message}</p>
        <Button variant="outline" onClick={query.reload} className="h-10 rounded-[10px] px-4 text-[15px]">
          Try again
        </Button>
      </div>
    );
  }
  if (query.loading && !query.data) {
    return (
      <p className="text-[15px] text-muted-foreground" role="status">
        Loading posts…
      </p>
    );
  }
  const posts = query.data?.data ?? [];
  if (!posts.length) {
    return <div className="rounded-2xl border border-dashed border-border p-10 text-center text-[15px] text-muted-foreground">{emptyMessage}</div>;
  }
  const { page, totalPages } = query.data.meta;
  return (
    <>
      <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${query.loading ? "opacity-60" : ""}`} aria-busy={query.loading}>
        {posts.map((post) => (
          <PostCard key={post._id} post={post} showAuthor={showAuthor} onEdit={onEdit} />
        ))}
      </div>
      <div className="mt-6">
        <Pager page={page} totalPages={totalPages} hrefFor={hrefFor} />
      </div>
    </>
  );
}
