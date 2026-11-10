"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AUTH_LINK_CLASS, AUTH_SUBMIT_CLASS, AuthCard } from "@/components/auth/AuthCard";
import { FormField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const EMPTY_FORM = { name: "", email: "", password: "", confirmPassword: "" };
const PASSWORD_MISMATCH = "Passwords do not match.";
const AFTER_REGISTER_PATH = "/notes";

/**
 * "Create your account" card: name, email, password and confirmation.
 * Field rules (length, format, duplicates) are enforced by the API; the browser's
 * native checks are only hints. The confirmation match is a UI-only check.
 * On success the user is signed in and sent to their notes.
 *
 * @returns {JSX.Element}
 */
export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState(EMPTY_FORM);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const passwordsMatch = values.password === values.confirmPassword;
  const confirmError = confirmTouched && !passwordsMatch ? PASSWORD_MISMATCH : undefined;

  /** Updates one field from its input's `name`. */
  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  /** Validates the confirmation, then creates the account. */
  async function handleSubmit(event) {
    event.preventDefault();
    setConfirmTouched(true);
    if (!passwordsMatch || submitting) return;

    setSubmitting(true);
    try {
      const { name, email, password } = values;
      await register({ name, email, password });
      // Clear passwords so they do not linger in a preserved (hidden) route.
      setValues(EMPTY_FORM);
      setConfirmTouched(false);
      toast.success("Account created. Welcome to Notes!");
      router.replace(AFTER_REGISTER_PATH);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className={AUTH_LINK_CLASS}>
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          id="name"
          name="name"
          label="Full name"
          placeholder="Your name"
          autoComplete="name"
          required
          maxLength={100}
          value={values.name}
          onChange={handleChange}
        />
        <FormField
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          maxLength={254}
          value={values.email}
          onChange={handleChange}
        />
        <FormField
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          value={values.password}
          onChange={handleChange}
        />
        <FormField
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm password"
          placeholder="Type it again"
          autoComplete="new-password"
          maxLength={72}
          value={values.confirmPassword}
          onChange={handleChange}
          onBlur={() => values.confirmPassword && setConfirmTouched(true)}
          error={confirmError}
        />

        <Button
          type="submit"
          disabled={submitting}
          className={AUTH_SUBMIT_CLASS}
        >
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
