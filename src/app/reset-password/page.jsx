import { Suspense } from "react";
import { ResetPasswordView } from "@/components/auth/ResetPasswordView";

export const metadata = {
  title: "Reset password",
};

/**
 * /reset-password: set a new password from the emailed link. The link's values are read from
 * the URL, so the view is wrapped in Suspense as required by useSearchParams.
 *
 * @returns {JSX.Element}
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordView />
    </Suspense>
  );
}
