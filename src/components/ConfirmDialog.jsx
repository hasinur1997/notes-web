"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Confirmation for destructive actions (delete note, delete label).
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the dialog is shown.
 * @param {(open: boolean) => void} props.onOpenChange - Called to open or close it.
 * @param {string} props.title - Question, e.g. "Delete this note?".
 * @param {string} props.description - What will happen.
 * @param {string} [props.confirmLabel="Delete"] - Text of the destructive button.
 * @param {() => void} props.onConfirm - Called when the user confirms.
 * @returns {JSX.Element}
 */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Delete", onConfirm }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-extrabold">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[15px]">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-10 rounded-[10px] px-4 text-[15px]">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="h-10 rounded-[10px] bg-destructive px-4 text-[15px] font-bold text-white hover:bg-destructive/90"
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
