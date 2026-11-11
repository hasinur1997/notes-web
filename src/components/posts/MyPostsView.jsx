"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AuthGuard } from "@/components/AuthGuard";
import { SidebarPage } from "@/components/layout/SidebarPage";
import { PostComposer } from "@/components/posts/PostComposer";
import { PostEditorDialog } from "@/components/posts/PostEditorDialog";
import { PostList } from "@/components/posts/PostList";
import { PostViewDialog } from "@/components/posts/PostViewDialog";
import { useAuth } from "@/context/AuthContext";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { postsApi } from "@/lib/api";
import { withToast } from "@/lib/withToast";

const PAGE_SIZE = 12;

/**
 * `/posts`: the signed-in user's own posts (signed-in only).
 *
 * @returns {JSX.Element}
 */
export function MyPostsView() {
  return (
    <AuthGuard>
      <SidebarPage active="posts">
        <MyPostsScreen />
      </SidebarPage>
    </AuthGuard>
  );
}

/** Runs an image action; resolves to the updated post, or null after showing the error. */
async function imageAction(call, success) {
  try {
    const { post } = await withToast(call, success);
    return post;
  } catch {
    return null;
  }
}

/**
 * Composer for a new post, the user's posts (newest first, from the same endpoint as their public
 * page, loading more while scrolling), a viewer that opens a post in place, and the editor dialog
 * for changing or deleting one.
 * After a change, reload() refetches every batch already shown, so the scroll position is kept.
 *
 * @returns {JSX.Element}
 */
function MyPostsScreen() {
  const { user } = useAuth();
  const [editor, setEditor] = useState({ open: false, post: null, key: 0 });
  const [viewing, setViewing] = useState(null);
  const posts = useInfiniteList(`my-posts&limit=${PAGE_SIZE}`, (page, signal) =>
    postsApi.listByUser(user._id, { page, limit: PAGE_SIZE }, signal),
  );

  /** Opens a post in the editor (from its card or from the viewer). */
  function openEditor(post) {
    setViewing(null);
    setEditor((current) => ({ open: true, post, key: current.key + 1 }));
  }

  /** Publishes a post, then uploads the queued images. */
  async function handleCreate(values, images) {
    const { post } = await withToast(() => postsApi.create(values));
    const failures = [];
    for (const file of images) {
      await postsApi.uploadImage(post._id, file).catch((err) => failures.push(`${file.name}: ${err.message}`));
    }
    if (failures.length) toast.error(`Post published, but some images failed. ${failures.join(" · ")}`);
    else toast.success("Post published.");
    posts.reload();
  }

  /** Actions for the editor dialog. Each shows a toast; save and remove rethrow on failure. */
  const editorActions = {
    save: async (post, changes) => {
      await withToast(() => postsApi.update(post._id, changes), "Post saved.");
      posts.reload();
    },
    remove: async (post) => {
      await withToast(() => postsApi.remove(post._id), "Post deleted.");
      posts.reload();
    },
    addImage: async (post, file) => {
      const updated = await imageAction(() => postsApi.uploadImage(post._id, file));
      posts.reload();
      return updated;
    },
    replaceImage: async (post, imageId, file) => {
      const updated = await imageAction(() => postsApi.replaceImage(post._id, imageId, file), "Image cropped.");
      posts.reload();
      return updated;
    },
    removeImage: async (post, imageId) => {
      const updated = await imageAction(() => postsApi.removeImage(post._id, imageId), "Image removed.");
      posts.reload();
      return updated;
    },
  };

  return (
    <>
      <PostComposer onCreate={handleCreate} />

      <div className="mt-[26px] mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-[22px] leading-7 font-extrabold">My posts</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">Posts are public: anyone can read them on the home page.</p>
        </div>
        <Link href={`/users/${user._id}/posts`} className="text-[14px] font-bold text-brand-strong hover:underline">
          View my public page
        </Link>
      </div>

      <PostList
        query={posts}
        showAuthor={false}
        onOpen={setViewing}
        onEdit={openEditor}
        emptyMessage="You haven't posted anything yet. Use “Write a post…” above to share your first one."
      />

      <PostViewDialog post={viewing} onOpenChange={(open) => !open && setViewing(null)} onEdit={openEditor} />

      <PostEditorDialog
        key={editor.key}
        open={editor.open}
        onOpenChange={(open) => setEditor((current) => ({ ...current, open }))}
        post={editor.post}
        actions={editorActions}
      />
    </>
  );
}
