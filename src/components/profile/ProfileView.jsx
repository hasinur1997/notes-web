"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/AuthGuard";
import { FormField } from "@/components/auth/FormField";
import { AppShell } from "@/components/layout/AppShell";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { InterestsInput, MAX_INTERESTS } from "@/components/profile/InterestsInput";
import { ProfilePhoto } from "@/components/profile/ProfilePhoto";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/format";

const CARD = "rounded-2xl border border-border bg-card p-6 shadow-[0_8px_24px_-12px] shadow-foreground/15 sm:p-8";
const SECTION_TITLE = "text-[17px] leading-6 font-extrabold";

/**
 * /profile page: signed-in only.
 *
 * @returns {JSX.Element}
 */
export function ProfileView() {
  return (
    <AuthGuard>
      <AppShell>
        <ProfileScreen />
      </AppShell>
    </AuthGuard>
  );
}

/**
 * Profile screen: profile photo, personal details (name and interests are editable; email is
 * read-only) and account information with sign out.
 *
 * @returns {JSX.Element}
 */
function ProfileScreen() {
  const { user, updateProfile, uploadAvatar, removeAvatar, logout } = useAuth();

  return (
    <div className="mx-auto flex w-full max-w-[600px] flex-col gap-6">
      <div>
        <Link
          href="/notes"
          className="inline-flex items-center gap-1.5 rounded-lg text-[15px] font-bold text-brand-strong hover:underline focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to notes
        </Link>
        <h1 className="mt-3 text-[22px] leading-7 font-extrabold">Profile</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">Manage how you appear and what you&apos;re interested in.</p>
      </div>

      <section className={CARD} aria-labelledby="photo-heading">
        <h2 id="photo-heading" className={SECTION_TITLE}>
          Profile photo
        </h2>
        <div className="mt-4">
          <ProfilePhoto user={user} onUpload={uploadAvatar} onRemove={removeAvatar} />
        </div>
      </section>

      {/* Remount the form when the saved user changes, so it always starts from the latest values. */}
      <PersonalInfoForm key={`${user.name}|${user.interests?.join(",")}`} user={user} onSave={updateProfile} />

      <section className={CARD} aria-labelledby="account-heading">
        <h2 id="account-heading" className={SECTION_TITLE}>
          Account
        </h2>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[15px]">
          <dt className="text-muted-foreground">Role</dt>
          <dd>
            <span className="inline-flex h-6 items-center rounded-full bg-brand-soft px-2.5 text-[13px] font-bold text-brand-strong capitalize">
              {user.role}
            </span>
          </dd>
          <dt className="text-muted-foreground">Member since</dt>
          <dd>{user.createdAt ? formatDate(user.createdAt) : "—"}</dd>
        </dl>
        <Button
          variant="outline"
          onClick={() => {
            logout();
            toast.success("Signed out.");
          }}
          className="mt-6 h-10 gap-2 rounded-[10px] px-4 text-[15px] text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </Button>
      </section>
    </div>
  );
}

/**
 * Editable personal details: name and interests (saved together); email shown read-only.
 *
 * @param {object} props
 * @param {{ name: string, email: string, interests?: string[] }} props.user - The signed-in user.
 * @param {(values: { name?: string, interests?: string[] }) => Promise<object>} props.onSave - Saves changes.
 * @returns {JSX.Element}
 */
function PersonalInfoForm({ user, onSave }) {
  const initial = { name: user.name, interests: user.interests ?? [] };
  const [name, setName] = useState(initial.name);
  const [interests, setInterests] = useState(initial.interests);
  const [saving, setSaving] = useState(false);

  const cleanName = name.trim().replace(/\s+/g, " ");
  const nameError = cleanName ? undefined : "Name is required.";
  const changes = {};
  if (cleanName !== initial.name) changes.name = cleanName;
  if (interests.join("\n") !== initial.interests.join("\n")) changes.interests = interests;
  const dirty = Object.keys(changes).length > 0;

  /** Saves only the changed fields. */
  async function handleSubmit(event) {
    event.preventDefault();
    if (!dirty || nameError || saving) return;
    setSaving(true);
    try {
      await onSave(changes);
      toast.success("Profile saved.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  /** Puts back the saved values. */
  function reset() {
    setName(initial.name);
    setInterests(initial.interests);
  }

  return (
    <section className={CARD} aria-labelledby="personal-heading">
      <div className="flex items-center gap-4">
        <UserAvatar name={cleanName || user.name} avatar={user.avatar} ringed />
        <div className="min-w-0">
          <h2 id="personal-heading" className={`${SECTION_TITLE} truncate`}>
            {cleanName || user.name}
          </h2>
          <p className="truncate text-[15px] text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <FormField
          id="profile-name"
          label="Full name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={100}
          autoComplete="name"
          error={nameError}
        />
        <FormField
          id="profile-email"
          label="Email"
          value={user.email}
          readOnly
          disabled
          aria-describedby="profile-email-hint"
        />
        <p id="profile-email-hint" className="-mt-2 text-xs text-muted-foreground">
          Your email is used to sign in and can&apos;t be changed.
        </p>

        <div className="flex flex-col gap-2">
          <label htmlFor="profile-interests" className="text-[13px] leading-5 font-semibold">
            Interests
          </label>
          <InterestsInput id="profile-interests" value={interests} onChange={setInterests} />
          <p className="text-xs text-muted-foreground">
            Press Enter or comma to add. Up to {MAX_INTERESTS}; saved in lowercase.
          </p>
        </div>

        <div className="mt-2 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={reset}
            disabled={!dirty || saving}
            className="h-[42px] rounded-[10px] px-5 text-[15px]"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!dirty || Boolean(nameError) || saving} className="h-[42px] rounded-[10px] px-6 text-[15px] font-bold">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </section>
  );
}

