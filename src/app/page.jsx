import { Suspense } from "react";
import { HomeFeedView } from "@/components/posts/HomeFeedView";

/**
 * `/`: the public posts feed, for visitors and signed-in users alike.
 *
 * @returns {JSX.Element}
 */
export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeFeedView />
    </Suspense>
  );
}
