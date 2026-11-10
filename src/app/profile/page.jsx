import { ProfileView } from "@/components/profile/ProfileView";

export const metadata = {
  title: "Profile",
};

/**
 * /profile: the signed-in user's profile.
 *
 * @returns {JSX.Element}
 */
export default function ProfilePage() {
  return <ProfileView />;
}
