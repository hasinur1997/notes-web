"use client";

import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Shows who a note is shared with. The owner can add people by email and remove them;
 * a collaborator sees the list and can leave the note.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the dialog is shown.
 * @param {(open: boolean) => void} props.onOpenChange - Opens or closes it.
 * @param {{ _id: string, name: string, email: string }} props.owner - The note owner.
 * @param {{ _id: string, name: string, email: string, pending?: boolean }[]} props.collaborators - Current (or pending) collaborators.
 * @param {boolean} props.canManage - True for the owner.
 * @param {string} props.currentUserId - The signed-in user.
 * @param {(email: string) => Promise<void>} props.onAdd - Adds a person; rejects to keep the input.
 * @param {(person: object) => Promise<void>} props.onRemove - Removes a person (or the current user, to leave).
 * @returns {JSX.Element}
 */
export function CollaboratorsDialog({ open, onOpenChange, owner, collaborators, canManage, currentUserId, onAdd, onRemove }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const trimmed = email.trim().toLowerCase();
  const valid = EMAIL_PATTERN.test(trimmed);

  /** Adds the typed email. */
  async function handleAdd(event) {
    event.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      await onAdd(trimmed);
      setEmail("");
    } catch {
      // The caller showed the error; keep the email so it can be corrected.
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 rounded-2xl p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold">Collaborators</DialogTitle>
          <DialogDescription className="text-[15px]">
            {canManage
              ? "People you add can see and edit this note. Only you can delete it."
              : "You can see and edit this shared note. Only the owner can delete it or change who it's shared with."}
          </DialogDescription>
        </DialogHeader>

        <ul className="flex max-h-[50svh] flex-col gap-3 overflow-y-auto">
          <PersonRow person={owner} note="Owner" />
          {collaborators.map((person) => {
            const isMe = person._id === currentUserId;
            const removable = canManage || isMe;
            return (
              <PersonRow
                key={person._id}
                person={person}
                note={person.pending ? "Will be added when you save" : isMe ? "You" : undefined}
                action={
                  removable && (
                    <button
                      type="button"
                      onClick={() => onRemove(person)}
                      aria-label={isMe && !canManage ? "Leave this note" : `Remove ${person.name}`}
                      title={isMe && !canManage ? "Leave" : "Remove"}
                      className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  )
                }
              />
            );
          })}
        </ul>

        {canManage && (
          <form onSubmit={handleAdd} className="flex items-center gap-2">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
              <UserPlus className="size-5" aria-hidden="true" />
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Person's email to share with"
              aria-label="Email of the person to share with"
              maxLength={254}
              className="h-10 min-w-0 flex-1 rounded-[10px] border border-border bg-card px-3 text-[15px] outline-none placeholder:text-placeholder focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-focus"
            />
            <Button type="submit" disabled={!valid || busy} className="h-10 rounded-[10px] px-4 text-[15px] font-bold">
              Add
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * One person in the collaborators list.
 *
 * @param {object} props
 * @param {{ name: string, email: string }} props.person - The person.
 * @param {string} [props.note] - Small note after the email (e.g. "Owner").
 * @param {React.ReactNode} [props.action] - Optional trailing button.
 * @returns {JSX.Element}
 */
function PersonRow({ person, note, action }) {
  return (
    <li className="flex items-center gap-3">
      <UserAvatar name={person.name} avatar={person.avatar} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold">{person.name}</p>
        <p className="truncate text-[13px] text-muted-foreground">
          {person.email}
          {note && <span className="italic"> · {note}</span>}
        </p>
      </div>
      {action}
    </li>
  );
}
