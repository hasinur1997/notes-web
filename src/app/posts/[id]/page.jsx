import { Suspense } from "react";
import { PostDetailView } from "@/components/posts/PostDetailView";

export const metadata = {
  title: "Post",
};

/**
 * /posts/[id]: one post in full. Public.
 *
 * @returns {JSX.Element}
 */
export default function PostPage() {
  return (
    <Suspense fallback={null}>
      <PostDetailView />
    </Suspense>
  );
}
