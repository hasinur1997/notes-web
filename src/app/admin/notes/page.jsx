import { Suspense } from "react";
import { AllNotesView } from "@/components/admin/AllNotesView";

export const metadata = {
  title: "All notes · Admin",
};

/**
 * /admin/notes: every note, read-only (admins only).
 *
 * @returns {JSX.Element}
 */
export default function AdminNotesPage() {
  return (
    <Suspense>
      <AllNotesView />
    </Suspense>
  );
}
