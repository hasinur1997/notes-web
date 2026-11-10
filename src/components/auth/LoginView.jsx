"use client";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { NotePreviewCards } from "@/components/auth/NotePreviewCards";
import { useRedirectWhenAuthenticated } from "@/hooks/useRedirectWhenAuthenticated";

const PREVIEW_NOTES = [
  { title: "Weekly plan", body: "Finish API docs, review index strategy, prepare demo." },
  { title: "Book list", body: "Deep Work, Atomic Habits, Clean Code." },
];

/**
 * Sign-in screen: split layout with the sign-in form and example note cards.
 * Signed-in users are redirected to their notes.
 *
 * @returns {JSX.Element}
 */
export function LoginView() {
  useRedirectWhenAuthenticated();

  return (
    <AuthLayout
      headline="Your thoughts, kept private and easy to find."
      description="Write notes, sort them with labels and find anything in seconds. Only you can see your notes."
      aside={<NotePreviewCards notes={PREVIEW_NOTES} />}
    >
      <LoginForm />
    </AuthLayout>
  );
}
