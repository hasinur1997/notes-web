import { SettingsView } from "@/components/settings/SettingsView";

export const metadata = {
  title: "Settings",
};

/**
 * /settings: the signed-in user's app settings.
 *
 * @returns {JSX.Element}
 */
export default function SettingsPage() {
  return <SettingsView />;
}
