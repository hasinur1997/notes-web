import { Suspense } from "react";
import { NotesView } from "@/components/notes/NotesView";

export const metadata = {
  title: "All notes",
};

/**
 * /notes: the signed-in user's notes. Filters are read from the URL, so the view
 * is wrapped in Suspense as required by useSearchParams.
 *
 * @returns {JSX.Element}
 */
export default function NotesPage() {
  return (
    <Suspense fallback={null}>
      <NotesView />
    </Suspense>
  );
}
