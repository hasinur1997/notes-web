"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { AUTH_LINK_CLASS, AUTH_SUBMIT_CLASS, AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { NotePreviewCards } from "@/components/auth/NotePreviewCards";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";

const PREVIEW_NOTES = [
  { title: "Weekly plan", body: "Finish API docs, review index strategy, prepare demo." },
  { title: "Book list", body: "Deep Work, Atomic Habits, Clean Code." },
];

const BACK_TO_SIGN_IN = (
  <>
    Remembered it?{" "}
    <Link href="/login" className={AUTH_LINK_CLASS}>
      Back to sign in
    </Link>
  </>
);

/**
 * /forgot-password: asks for an email and sends a reset link. The confirmation is the same
 * whether or not the account exists, matching the API, so it never reveals registered emails.
 *
 * @returns {JSX.Element}
 */
export function ForgotPasswordView() {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /** Requests the reset email. */
  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      headline="Locked out? It happens."
      description="Enter the email you signed up with and we'll send you a link to choose a new password."
      aside={<NotePreviewCards notes={PREVIEW_NOTES} />}
    >
      {sentTo ? (
        <AuthCard title="Check your email" subtitle="The link works once and expires in 30 minutes." footer={BACK_TO_SIGN_IN}>
          <div className="flex flex-col items-start gap-4">
            <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
              <MailCheck className="size-6" aria-hidden="true" />
            </span>
            <p className="text-[15px] leading-[22px]" role="status">
              If an account exists for <span className="font-bold break-all">{sentTo}</span>, we&apos;ve sent a link to reset
              the password. Check your spam folder if you don&apos;t see it.
            </p>
            <Button type="button" variant="outline" onClick={() => setSentTo("")} className="h-10 rounded-[10px] px-4 text-[15px]">
              Use a different email
            </Button>
          </div>
        </AuthCard>
      ) : (
        <AuthCard title="Forgot password?" subtitle="We'll email you a reset link." footer={BACK_TO_SIGN_IN}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField
              id="email"
              name="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button type="submit" disabled={submitting} className={AUTH_SUBMIT_CLASS}>
              {submitting ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </AuthCard>
      )}
    </AuthLayout>
  );
}
