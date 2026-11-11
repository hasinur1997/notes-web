"use client";

import { Pencil } from "lucide-react";
import { PostArticle } from "@/components/posts/PostArticle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { noteColorClass } from "@/lib/noteColors";

/**
 * Shows one of the user's own posts in full right where they are (My posts), instead of leaving
 * for the public post page. Edit switches to the editor.
 *
 * @param {object} props
 * @param {object | null} props.post - The post to show; null closes the dialog.
 * @param {(open: boolean) => void} props.onOpenChange - Called to close it.
 * @param {(post: object) => void} props.onEdit - Opens the post in the editor.
 * @returns {JSX.Element}
 */
export function PostViewDialog({ post, onOpenChange, onEdit }) {
  return (
    <Dialog open={Boolean(post)} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto rounded-2xl p-0 sm:max-w-2xl ${post ? noteColorClass(post.color) : ""}`}
      >
        {post && (
          <PostArticle
            post={post}
            titleAs={DialogTitle}
            linkAuthor={false}
            actions={
              <Button variant="outline" onClick={() => onEdit(post)} className="h-9 gap-1.5 rounded-[10px] px-3 text-[14px] font-bold">
                <Pencil className="size-4" aria-hidden="true" />
                Edit
              </Button>
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
