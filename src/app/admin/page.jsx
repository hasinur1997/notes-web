import { redirect } from "next/navigation";

/**
 * /admin: opens the Users page.
 *
 * @returns {never}
 */
export default function AdminIndexPage() {
  redirect("/admin/users");
}
