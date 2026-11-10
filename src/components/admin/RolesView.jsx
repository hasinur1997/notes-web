"use client";

import { useState } from "react";
import { Check, Info, ShieldCheck, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { adminApi } from "@/lib/api";
import { PERMISSIONS, ROLE_OPTIONS, roleLabel } from "@/lib/roles";

const CARD_FRAME = "rounded-2xl border shadow-[0_8px_24px_-12px] shadow-foreground/15";
const CARD = `${CARD_FRAME} border-border bg-card`;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * /admin/roles: the two roles, what each can do, and a form to change someone's role.
 *
 * @returns {JSX.Element}
 */
export function RolesView() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] leading-10 font-extrabold">Roles &amp; access</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">There are two built-in roles. You decide which role each person has.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RoleCard icon={UserRound} title="User" tag="Default for new sign-ups" description="Writes and manages their own notes, shares them with others, and edits their profile, interests and settings." />
        <RoleCard
          icon={ShieldCheck}
          title="Admin"
          tag="Given by another admin"
          description="Everything a user can do, plus creating, editing and removing users, changing roles and reading every note."
          highlighted
        />
      </div>

      <PermissionsTable />
      <ChangeRoleCard />
    </div>
  );
}

/**
 * Summary card for one role.
 *
 * @param {{ icon: React.ElementType, title: string, tag: string, description: string, highlighted?: boolean }} props
 * @returns {JSX.Element}
 */
function RoleCard({ icon: Icon, title, tag, description, highlighted = false }) {
  return (
    <section className={`${CARD_FRAME} p-6 ${highlighted ? "border-transparent bg-brand-soft" : "border-border bg-card"}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`flex size-10 items-center justify-center rounded-xl ${highlighted ? "bg-primary" : "border border-border"}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <h2 className="flex-1 text-[19px] font-extrabold">{title}</h2>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${highlighted ? "border-transparent bg-card text-brand-strong" : "border-border text-muted-foreground"}`}>
          {tag}
        </span>
      </div>
      <p className="mt-3 text-[15px] leading-[22px] text-foreground/80">{description}</p>
    </section>
  );
}

/** Yes / No / qualified yes for one cell of the permissions table. */
function Allowed({ value }) {
  if (!value) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[14px] text-muted-foreground">
        <X className="size-4" aria-hidden="true" />
        No
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-success">
      <Check className="size-4" aria-hidden="true" />
      {typeof value === "string" ? value : "Yes"}
    </span>
  );
}

/** What each role can do, grouped by area. */
function PermissionsTable() {
  return (
    <section className={`${CARD} overflow-hidden`} aria-labelledby="permissions-heading">
      <h2 id="permissions-heading" className="border-b border-border px-4 py-4 text-[17px] font-extrabold">
        What each role can do
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className="border-b border-border text-left text-[13px] font-semibold text-muted-foreground">
              <th scope="col" className="px-4 py-3">Permission</th>
              <th scope="col" className="w-[18%] px-4 py-3">User</th>
              <th scope="col" className="w-[18%] px-4 py-3">Admin</th>
            </tr>
          </thead>
          {PERMISSIONS.map(({ group, rows }) => (
            <tbody key={group}>
              <tr className="border-b border-border bg-muted/60">
                <th scope="colgroup" colSpan={3} className="px-4 py-2.5 text-left text-[14px] font-bold">
                  {group}
                </th>
              </tr>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-b-0">
                  <th scope="row" className="px-4 py-3 text-left text-[15px] font-normal">
                    {row.label}
                  </th>
                  <td className="px-4 py-3">
                    <Allowed value={row.user} />
                  </td>
                  <td className="px-4 py-3">
                    <Allowed value={row.admin} />
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}

/**
 * Finds a person by email and changes their role. Your own role cannot be changed (the API
 * refuses too), which guarantees there is always at least one admin.
 *
 * @returns {JSX.Element}
 */
function ChangeRoleCard() {
  const { user: me } = useAuth();
  const [email, setEmail] = useState("");
  const [lookup, setLookup] = useState({ status: "idle", person: null, error: "" });
  const [role, setRole] = useState("user");
  const [saving, setSaving] = useState(false);

  const person = lookup.person;
  const isSelf = person?._id === me?._id;
  const firstName = person?.name.split(" ")[0];

  async function handleFind(event) {
    event.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(clean)) {
      setLookup({ status: "error", person: null, error: "Enter a full email address." });
      return;
    }
    setLookup({ status: "loading", person: null, error: "" });
    try {
      const { data } = await adminApi.listUsers({ email: clean, limit: 1 });
      if (!data.length) {
        setLookup({ status: "error", person: null, error: `No account uses ${clean}.` });
        return;
      }
      setLookup({ status: "found", person: data[0], error: "" });
      setRole(data[0].role === "admin" ? "user" : "admin");
    } catch (err) {
      setLookup({ status: "error", person: null, error: err.message });
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { user } = await adminApi.updateUser(person._id, { role });
      setLookup({ status: "found", person: user, error: "" });
      toast.success(`${user.name} is now ${role === "admin" ? "an Admin" : "a User"}.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`${CARD} p-6`} aria-labelledby="change-role-heading">
      <h2 id="change-role-heading" className="text-[17px] font-extrabold">
        Change someone&apos;s role
      </h2>
      <p className="mt-1 text-[15px] text-muted-foreground">Find the person by email, pick a role and save. The change applies to their next request.</p>

      <form onSubmit={handleFind} className="mt-5 flex flex-col gap-2">
        <Label htmlFor="role-email" className="text-[13px] font-semibold">
          Email
        </Label>
        <div className="flex gap-2">
          <Input
            id="role-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            maxLength={254}
            className="h-11 flex-1 rounded-[10px] bg-card px-4 text-[15px] md:text-[15px]"
          />
          <Button type="submit" variant="outline" disabled={lookup.status === "loading"} className="h-11 rounded-[10px] px-4 text-[15px] font-bold">
            {lookup.status === "loading" ? "Finding…" : "Find"}
          </Button>
        </div>
      </form>

      {lookup.status === "error" && (
        <p className="mt-3 text-[14px] text-destructive" role="alert">
          {lookup.error}
        </p>
      )}

      {person && (
        <div className="mt-4 flex flex-col gap-3 animate-in fade-in-0 duration-200">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-4">
            <UserAvatar name={person.name} avatar={person.avatar} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold">{person.name}</p>
              <p className="truncate text-[13px] text-muted-foreground">
                {person.email} · currently {roleLabel(person.role)}
              </p>
            </div>
            <div role="radiogroup" aria-label="New role" className="flex rounded-xl bg-muted p-1">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={role === option.value}
                  disabled={isSelf}
                  onClick={() => setRole(option.value)}
                  className="h-9 rounded-lg px-4 text-[14px] font-semibold text-muted-foreground aria-checked:bg-card aria-checked:text-foreground aria-checked:shadow-sm disabled:opacity-50"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Button onClick={handleSave} disabled={isSelf || saving || role === person.role} className="h-10 rounded-[10px] px-4 text-[15px] font-bold">
              {saving ? "Saving…" : "Save role"}
            </Button>
          </div>

          {!isSelf && role !== person.role && (
            <p className="flex items-start gap-2 rounded-xl bg-info-soft px-4 py-3 text-[15px] font-medium text-info" role="status">
              <Info className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
              {role === "admin"
                ? `${firstName} will become an Admin and can manage users and read every note.`
                : `${firstName} will become a User and lose access to the admin area.`}
            </p>
          )}
          {isSelf && <p className="text-[14px] text-muted-foreground">This is you. Ask another admin to change your role.</p>}
        </div>
      )}

      <p className="mt-4 text-[13px] text-muted-foreground">
        You can&apos;t change your own role or delete your own account, so there is always at least one admin.
      </p>
    </section>
  );
}
