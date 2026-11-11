"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AUTH_LINK_CLASS, AUTH_SUBMIT_CLASS, AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { NotePreviewCards } from "@/components/auth/NotePreviewCards";
import { Button } from "@/components/ui/button";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { authApi } from "@/lib/api";
import { checkConfirmation, checkNewPassword } from "@/lib/validation";

const PREVIEW_NOTES = [
  { title: "Weekly plan", body: "Finish API docs, review index strategy, prepare demo." },
  { title: "Book list", body: "Deep Work, Atomic Habits, Clean Code." },
];
const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

/** Message per invalid field of the new-password form. */
function validateNewPassword({ password, confirmPassword }) {
  return { password: checkNewPassword(password), confirmPassword: checkConfirmation(password, confirmPassword) };
}

const REQUEST_NEW_LINK = (
  <>
    Link not working?{" "}
    <Link href="/forgot-password" className={AUTH_LINK_CLASS}>
      Request a new one
    </Link>
  </>
);

/**
 * /reset-password?email=…&token=…: sets a new password from the emailed link, then sends the
 * user to sign in. Wrong, used or expired links show a clear message with a way to get a new one.
 * Must be rendered inside <Suspense> (useSearchParams).
 *
 * @returns {JSX.Element}
 */
export function ResetPasswordView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";
  const linkLooksValid = Boolean(email) && TOKEN_PATTERN.test(token);

  const [values, setValues] = useState({ password: "", confirmPassword: "" });
  const [submitting, setSubmitting] = useState(false);
  const { errors, handleBlur, validateAll, reset } = useFieldErrors(values, validateNewPassword);
  const [linkError, setLinkError] = useState(linkLooksValid ? "" : "This reset link is incomplete. Please request a new one.");

  /** Updates one field from its input's `name`. */
  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  /** Sets the new password and goes to sign in. */
  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || !validateAll(event.currentTarget)) return;
    setSubmitting(true);
    try {
      const { message } = await authApi.resetPassword({ email, token, password: values.password });
      setValues({ password: "", confirmPassword: "" });
      reset();
      toast.success(message);
      router.replace("/login");
    } catch (err) {
      if (err.code === "INVALID_RESET_TOKEN") setLinkError(err.message);
      else toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      headline="Choose a new password."
      description="Pick something you haven't used before. You'll be signed out on other devices once it's changed."
      aside={<NotePreviewCards notes={PREVIEW_NOTES} />}
    >
      {linkError ? (
        <AuthCard title="Link expired" subtitle="Reset links work once and expire after 30 minutes." footer={REQUEST_NEW_LINK}>
          <p className="text-[15px] leading-[22px] text-destructive" role="alert">
            {linkError}
          </p>
          <Button type="button" onClick={() => router.push("/forgot-password")} className={`${AUTH_SUBMIT_CLASS} mt-4`}>
            Request a new link
          </Button>
        </AuthCard>
      ) : (
        <AuthCard title="Set a new password" subtitle={`For ${email}`} footer={REQUEST_NEW_LINK}>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <FormField
              id="password"
              name="password"
              type="password"
              label="New password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              maxLength={72}
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
            />
            <FormField
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm new password"
              placeholder="Type it again"
              autoComplete="new-password"
              maxLength={72}
              value={values.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.confirmPassword}
            />
            <Button type="submit" disabled={submitting} className={AUTH_SUBMIT_CLASS}>
              {submitting ? "Saving…" : "Change password"}
            </Button>
          </form>
        </AuthCard>
      )}
    </AuthLayout>
  );
}
