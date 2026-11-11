import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { InterestsView } from "@/components/admin/InterestsView";

export const metadata = {
  title: "Interests · Admin",
};

/**
 * /admin/interests: users grouped by interest (admins only).
 *
 * @returns {JSX.Element}
 */
export default function AdminInterestsPage() {
  return (
    <Suspense>
      <AdminShell active="interests">
        <InterestsView />
      </AdminShell>
    </Suspense>
  );
}
