"use client";

import { Lock, Search, Tag } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useRedirectWhenAuthenticated } from "@/hooks/useRedirectWhenAuthenticated";

const FEATURES = [
  { icon: Lock, text: "Passwords are encrypted and never shown" },
  { icon: Tag, text: "Labels keep work and personal notes apart" },
  { icon: Search, text: "Search finds any note instantly" },
];

/**
 * Register screen: split layout with the create-account form.
 * Signed-in users are redirected to their notes.
 *
 * @returns {JSX.Element}
 */
export function RegisterView() {
  useRedirectWhenAuthenticated();

  return (
    <AuthLayout
      headline="Start writing in under a minute."
      description="Create a free account to save notes, organise them with labels and pick up where you left off on any device."
      features={FEATURES}
    >
      <RegisterForm />
    </AuthLayout>
  );
}
