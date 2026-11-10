"use client";

import { useState } from "react";
import { FormField } from "@/components/auth/FormField";
import { InterestsInput } from "@/components/profile/InterestsInput";
import { OptionGroup } from "@/components/settings/OptionGroup";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ROLE_OPTIONS } from "@/lib/roles";

const MIN_PASSWORD = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Dialog to create a user, or edit one when `user` is given. Shows field errors after the
 * first submit attempt; the API validates everything again.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the dialog is shown.
 * @param {(open: boolean) => void} props.onOpenChange - Opens or closes it.
 * @param {object | null} props.user - The user to edit, or null to create one.
 * @param {boolean} props.isSelf - Editing your own account (your role cannot change).
 * @param {(values: object) => Promise<void>} props.onSubmit - Saves; rejects to keep the dialog open.
 * @returns {JSX.Element}
 */
export function UserFormDialog({ open, onOpenChange, user, isSelf, onSubmit }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto rounded-2xl p-6 sm:max-w-[520px]">
        {/* Keyed so each opening starts from the user's current values. */}
        {open && <UserForm key={user?._id ?? "new"} user={user} isSelf={isSelf} onSubmit={onSubmit} onCancel={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

/**
 * The form inside UserFormDialog.
 *
 * @param {object} props - See UserFormDialog; `onCancel` closes the dialog.
 * @returns {JSX.Element}
 */
function UserForm({ user, isSelf, onSubmit, onCancel }) {
  const editing = Boolean(user);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.role ?? "user");
  const [interests, setInterests] = useState(user?.interests ?? []);
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);

  const cleanName = name.trim().replace(/\s+/g, " ");
  const cleanEmail = email.trim().toLowerCase();
  const errors = {
    name: cleanName ? undefined : "Name is required.",
    email: EMAIL_PATTERN.test(cleanEmail) ? undefined : "Enter a valid email address.",
    password:
      (editing && !password) || password.length >= MIN_PASSWORD ? undefined : `At least ${MIN_PASSWORD} characters.`,
  };
  const valid = !errors.name && !errors.email && !errors.password;

  /** Only what changed is sent when editing; everything when creating. */
  function buildValues() {
    if (!editing) return { name: cleanName, email: cleanEmail, password, role, interests };
    const values = {};
    if (cleanName !== user.name) values.name = cleanName;
    if (cleanEmail !== user.email) values.email = cleanEmail;
    if (role !== user.role) values.role = role;
    if (interests.join("\n") !== (user.interests ?? []).join("\n")) values.interests = interests;
    if (password) values.password = password;
    return values;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setAttempted(true);
    if (!valid) return;
    const values = buildValues();
    if (!Object.keys(values).length) return onCancel();
    setSaving(true);
    try {
      await onSubmit(values);
    } catch {
      setSaving(false);
    }
  }

  const show = (key) => (attempted ? errors[key] : undefined);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle className="text-[22px] leading-7 font-extrabold">{editing ? "Edit user" : "Create user"}</DialogTitle>
        <DialogDescription className="text-[15px]">
          {editing ? `Change ${user.name}'s details, role or password.` : "They can sign in right away with this email and password."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="user-name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} error={show("name")} maxLength={100} autoComplete="off" />
        <FormField id="user-email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={show("email")} maxLength={254} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-1.5">
        <FormField
          id="user-password"
          label={editing ? "New password (optional)" : "Temporary password"}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={show("password")}
          maxLength={72}
          autoComplete="new-password"
        />
        {!show("password") && (
          <p className="text-xs leading-[18px] text-muted-foreground">
            {editing
              ? "Leave empty to keep their password. A new one signs them out everywhere."
              : `At least ${MIN_PASSWORD} characters. Share it with them privately.`}
          </p>
        )}
      </div>

      <OptionGroup
        name="user-role"
        legend="Role"
        hint={isSelf ? "You can't change your own role." : undefined}
        value={role}
        options={ROLE_OPTIONS}
        onChange={setRole}
        disabled={isSelf || saving}
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="user-interests" className="text-[13px] leading-5 font-semibold">
          Interests <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <InterestsInput id="user-interests" value={interests} onChange={setInterests} />
      </div>

      <DialogFooter className="mx-0 mb-0 rounded-none border-0 bg-transparent p-0">
        <Button type="button" variant="outline" onClick={onCancel} className="h-10 rounded-[10px] px-4 text-[15px]">
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="h-10 rounded-[10px] px-5 text-[15px] font-bold">
          {saving ? "Saving…" : editing ? "Save changes" : "Create user"}
        </Button>
      </DialogFooter>
    </form>
  );
}
