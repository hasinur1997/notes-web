import { RegisterView } from "@/components/auth/RegisterView";

export const metadata = {
  title: "Create account",
};

/**
 * /register: account creation page.
 *
 * @returns {JSX.Element}
 */
export default function RegisterPage() {
  return <RegisterView />;
}
