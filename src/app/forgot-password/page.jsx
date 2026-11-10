import { ForgotPasswordView } from "@/components/auth/ForgotPasswordView";

export const metadata = {
  title: "Forgot password",
};

/**
 * /forgot-password: request a password reset email.
 *
 * @returns {JSX.Element}
 */
export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
