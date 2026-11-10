"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AUTH_LINK_CLASS, AUTH_SUBMIT_CLASS, AuthCard } from "@/components/auth/AuthCard";
import { FormField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const EMPTY_FORM = { email: "", password: "" };
const AFTER_LOGIN_PATH = "/notes";

/**
 * "Sign in" card: email and password.
 * Wrong credentials and rate limits come back from the API as messages and are shown as toasts.
 * On success the user is signed in, the password is cleared, and the app goes to their notes.
 *
 * @returns {JSX.Element}
 */
export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /** Updates one field from its input's `name`. */
  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  /** Signs in with the entered credentials. */
  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      await login(values);
      // Clear the password so it does not linger in a preserved (hidden) route.
      setValues(EMPTY_FORM);
      toast.success("Welcome back!");
      router.replace(AFTER_LOGIN_PATH);
    } catch (err) {
      setValues((current) => ({ ...current, password: "" }));
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Welcome back. Sign in to see your notes."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className={AUTH_LINK_CLASS}>
            Create an account
          </Link>
        </>
      }
    >
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
          value={values.email}
          onChange={handleChange}
        />
        <FormField
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          maxLength={72}
          value={values.password}
          onChange={handleChange}
          labelAction={
            <Link href="/forgot-password" className={`text-[13px] leading-5 ${AUTH_LINK_CLASS}`}>
              Forgot password?
            </Link>
          }
        />

        <Button type="submit" disabled={submitting} className={AUTH_SUBMIT_CLASS}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}
