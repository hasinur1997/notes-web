import { LoginView } from "@/components/auth/LoginView";

export const metadata = {
  title: "Sign in",
};

/**
 * /login: sign-in page.
 *
 * @returns {JSX.Element}
 */
export default function LoginPage() {
  return <LoginView />;
}
