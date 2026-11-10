"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPager } from "@/components/admin/AdminPager";
import { UserFormDialog } from "@/components/admin/UserFormDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useApiQuery } from "@/hooks/useApiQuery";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { roleLabel } from "@/lib/roles";

/** Users per page (fits the table without scrolling on a laptop screen). */
const PAGE_SIZE = 8;
/** Interests shown per row before "+N". */
const MAX_INTERESTS_SHOWN = 3;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CARD = "overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_24px_-12px] shadow-foreground/15";
const TH = "px-4 py-3 text-left text-[13px] font-semibold text-muted-foreground";
const ICON_BUTTON =
  "flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40";

/**
 * /admin/users: every account, newest first, with create, edit, delete and a link to each
 * person's notes. `?email=` (from the header search) shows the one user with that address.
 *
 * @returns {JSX.Element}
 */
export function UsersView() {
  const { user: me } = useAuth();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();
  const emailComplete = EMAIL_PATTERN.test(email);
  const [form, setForm] = useState({ open: false, user: null });
  const [deleting, setDeleting] = useState(null);

  const key = email ? (emailComplete ? `email=${email}` : null) : `page=${page}`;
  const users = useApiQuery(key, (signal) =>
    adminApi.listUsers(email ? { email, limit: 1 } : { page, limit: PAGE_SIZE }, signal),
  );
  // A search must never show the previous list while it loads; page changes keep the old rows
  // (faded) so the table does not jump.
  const searching = Boolean(email) && users.dataKey !== key;
  const rows = searching ? [] : (users.data?.data ?? []);
  const meta = searching ? undefined : users.data?.meta;

  /** Creates or updates, then reloads the list. Rethrows so the dialog stays open on errors. */
  async function handleSubmit(values) {
    try {
      if (form.user) {
        await adminApi.updateUser(form.user._id, values);
        toast.success("User updated.");
      } else {
        await adminApi.createUser(values);
        toast.success(`Account created for ${values.email}.`);
      }
      setForm({ open: false, user: form.user });
      users.reload();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }

  async function handleDelete(target) {
    try {
      await adminApi.deleteUser(target._id);
      toast.success(`${target.name} was deleted.`);
      users.reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const hrefFor = (target) => (target > 1 ? `/admin/users?page=${target}` : "/admin/users");
  const first = meta ? (meta.page - 1) * meta.limit + 1 : 0;
  const last = meta ? first + rows.length - 1 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] leading-10 font-extrabold">Users</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">Create accounts, change roles and remove people.</p>
        </div>
        <Button onClick={() => setForm({ open: true, user: null })} className="h-11 gap-2 rounded-xl px-4 text-[15px] font-bold">
          <Plus className="size-5" aria-hidden="true" />
          Create user
        </Button>
      </div>

      <section className={CARD} aria-labelledby="users-heading">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
          <h2 id="users-heading" className="text-[17px] font-extrabold">
            {email ? `Results for "${email}"` : "All users"}
          </h2>
          {email ? (
            <Link href="/admin/users" className="text-[14px] font-bold text-brand-strong hover:underline">
              Show all users
            </Link>
          ) : (
            meta && <p className="text-[14px] text-muted-foreground">{meta.total === 1 ? "1 user" : `${meta.total} users`}</p>
          )}
        </div>

        {email && !emailComplete ? (
          <p className="px-4 py-10 text-center text-[15px] text-muted-foreground">Type the full email address to find someone.</p>
        ) : users.error ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center" role="alert">
            <p className="text-[15px]">Couldn&apos;t load users. {users.error.message}</p>
            <Button variant="outline" onClick={users.reload} className="h-10 rounded-[10px] px-4 text-[15px]">
              Try again
            </Button>
          </div>
        ) : searching || (users.loading && !users.data) ? (
          <p className="px-4 py-10 text-center text-[15px] text-muted-foreground" role="status">
            {searching ? "Searching…" : "Loading users…"}
          </p>
        ) : rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-[15px] text-muted-foreground">
            {email ? `No account uses ${email}.` : "No users yet."}
          </p>
        ) : (
          <div className={`overflow-x-auto transition-opacity duration-200 ${users.loading ? "opacity-60" : ""}`} aria-busy={users.loading}>
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className={TH}>User</th>
                  <th scope="col" className={TH}>Role</th>
                  <th scope="col" className={`${TH} hidden lg:table-cell`}>Interests</th>
                  <th scope="col" className={`${TH} hidden md:table-cell`}>Joined</th>
                  <th scope="col" className={`${TH} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((person) => (
                  <UserRow
                    key={person._id}
                    person={person}
                    isSelf={person._id === me?._id}
                    onEdit={() => setForm({ open: true, user: person })}
                    onDelete={() => setDeleting(person)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!email && meta && meta.total > 0 && (
          <AdminPager summary={`Showing ${first}–${last} of ${meta.total}`} page={meta.page} totalPages={meta.totalPages} hrefFor={hrefFor} />
        )}
      </section>

      <UserFormDialog
        open={form.open}
        onOpenChange={(open) => setForm((current) => ({ ...current, open }))}
        user={form.user}
        isSelf={form.user?._id === me?._id}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "this user"}?`}
        description="Their account, all their notes and images are deleted, and they are removed from notes shared with them. This can't be undone."
        confirmLabel="Delete user"
        onConfirm={() => handleDelete(deleting)}
      />
    </div>
  );
}

/**
 * One row of the users table.
 *
 * @param {object} props
 * @param {object} props.person - The user.
 * @param {boolean} props.isSelf - Whether this is the signed-in admin (cannot be deleted).
 * @param {() => void} props.onEdit - Opens the edit dialog.
 * @param {() => void} props.onDelete - Asks to delete.
 * @returns {JSX.Element}
 */
function UserRow({ person, isSelf, onEdit, onDelete }) {
  const interests = person.interests ?? [];
  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar name={person.name} avatar={person.avatar} />
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[15px] font-bold">
              <span className="truncate">{person.name}</span>
              {isSelf && <span className="rounded-full border border-border px-2 text-xs font-medium text-muted-foreground">You</span>}
            </p>
            <p className="truncate text-[13px] text-muted-foreground">{person.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold ${
            person.role === "admin" ? "bg-primary/75 text-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {roleLabel(person.role)}
        </span>
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        {interests.length ? (
          <ul className="flex flex-wrap gap-1" aria-label="Interests">
            {interests.slice(0, MAX_INTERESTS_SHOWN).map((interest) => (
              <li key={interest} className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-strong">
                {interest}
              </li>
            ))}
            {interests.length > MAX_INTERESTS_SHOWN && (
              <li className="px-1 py-0.5 text-xs text-muted-foreground">+{interests.length - MAX_INTERESTS_SHOWN}</li>
            )}
          </ul>
        ) : (
          <span className="text-[14px] text-muted-foreground">No interests yet</span>
        )}
      </td>
      <td className="hidden px-4 py-3 text-[14px] whitespace-nowrap text-muted-foreground md:table-cell">{formatDate(person.createdAt)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/admin/notes?owner=${person._id}`}
            className="mr-2 rounded-md text-[14px] font-bold whitespace-nowrap text-brand-strong hover:underline focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none"
          >
            View notes
          </Link>
          <button type="button" onClick={onEdit} aria-label={`Edit ${person.name}`} className={ICON_BUTTON}>
            <Pencil className="size-[18px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isSelf}
            aria-label={isSelf ? "You can't delete your own account" : `Delete ${person.name}`}
            title={isSelf ? "You can't delete your own account" : undefined}
            className={`${ICON_BUTTON} text-destructive hover:bg-destructive/10 hover:text-destructive`}
          >
            <Trash2 className="size-[18px]" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}
