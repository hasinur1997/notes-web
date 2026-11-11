import { Suspense } from "react";
import { MyPostsView } from "@/components/posts/MyPostsView";

export const metadata = {
  title: "My posts",
};

/**
 * /posts: the signed-in user's own posts (write, edit, delete).
 *
 * @returns {JSX.Element}
 */
export default function MyPostsPage() {
  return (
    <Suspense fallback={null}>
      <MyPostsView />
    </Suspense>
  );
}
