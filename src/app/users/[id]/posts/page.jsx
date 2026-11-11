import { Suspense } from "react";
import { UserPostsView } from "@/components/posts/UserPostsView";

export const metadata = {
  title: "Posts",
};

/**
 * /users/[id]/posts: a person's public profile and posts (Scenario 2). Public.
 *
 * @returns {JSX.Element}
 */
export default function UserPostsPage() {
  return (
    <Suspense fallback={null}>
      <UserPostsView />
    </Suspense>
  );
}
