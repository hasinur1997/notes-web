"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AUTH_LINK_CLASS, AUTH_SUBMIT_CLASS, AuthCard } from "@/components/auth/AuthCard";
import { FormField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { checkConfirmation, checkEmail, checkName, checkNewPassword } from "@/lib/validation";

const EMPTY_FORM = { name: "", email: "", password: "", confirmPassword: "" };
const AFTER_REGISTER_PATH = "/notes";

/** Message per invalid field of the registration form. */
function validateRegistration({ name, email, password, confirmPassword }) {
  return {
    name: checkName(name),
    email: checkEmail(email),
    password: checkNewPassword(password),
    confirmPassword: checkConfirmation(password, confirmPassword),
  };
}

/**
 * "Create your account" card: name, email, password and confirmation.
 * Each field shows its own message under it (no browser popups); the API checks everything
 * again, including duplicate emails. The confirmation match is a UI-only check.
 * On success the user is signed in and sent to their notes.
 *
 * @returns {JSX.Element}
 */
export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const { errors, handleBlur, validateAll, reset } = useFieldErrors(values, validateRegistration);

  /** Updates one field from its input's `name`. */
  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  /** Checks every field, then creates the account. */
  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || !validateAll(event.currentTarget)) return;

    setSubmitting(true);
    try {
      const { name, email, password } = values;
      await register({ name, email, password });
      // Clear passwords so they do not linger in a preserved (hidden) route.
      setValues(EMPTY_FORM);
      reset();
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
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField
          id="name"
          name="name"
          label="Full name"
          placeholder="Your name"
          autoComplete="name"
          maxLength={100}
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.name}
        />
        <FormField
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          maxLength={254}
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
        />
        <FormField
          id="password"
          name="password"
          type="password"
          label="Password"
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
          label="Confirm password"
          placeholder="Type it again"
          autoComplete="new-password"
          maxLength={72}
          value={values.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.confirmPassword}
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
