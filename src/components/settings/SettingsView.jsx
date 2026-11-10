"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Infinity as InfinityIcon, ListOrdered } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { OptionGroup } from "@/components/settings/OptionGroup";
import { useAuth } from "@/context/AuthContext";
import { getSettings, PAGINATION_OPTIONS, PER_PAGE_OPTIONS } from "@/lib/settings";

const CARD = "rounded-2xl border border-border bg-card p-6 shadow-[0_8px_24px_-12px] shadow-foreground/15 sm:p-8";
const PAGINATION_ICONS = { pages: ListOrdered, infinite: InfinityIcon };

/**
 * /settings page: signed-in only.
 *
 * @returns {JSX.Element}
 */
export function SettingsView() {
  return (
    <AuthGuard>
      <AppShell>
        <SettingsScreen />
      </AppShell>
    </AuthGuard>
  );
}

/**
 * Settings screen. Each change is saved to the account right away (shown immediately, and put
 * back if saving fails), so the same settings apply on every device.
 *
 * @returns {JSX.Element}
 */
function SettingsScreen() {
  const { user, updateSettings } = useAuth();
  const [pending, setPending] = useState(null); // { key, value } being saved
  const saved = getSettings(user);
  const settings = pending ? { ...saved, [pending.key]: pending.value } : saved;

  /** Saves one setting and confirms it with a toast. */
  async function change(key, value) {
    if (pending || saved[key] === value) return;
    setPending({ key, value });
    try {
      await updateSettings({ [key]: value });
      toast.success("Settings saved.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[600px] flex-col gap-6">
      <div>
        <Link
          href="/notes"
          className="inline-flex items-center gap-1.5 rounded-lg text-[15px] font-bold text-brand-strong hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to notes
        </Link>
        <h1 className="mt-3 text-[22px] leading-7 font-extrabold">Settings</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">Choose how the app works for you. Changes are saved to your account.</p>
      </div>

      <section className={CARD} aria-labelledby="notes-settings-heading">
        <h2 id="notes-settings-heading" className="text-[17px] leading-6 font-extrabold">
          Notes
        </h2>

        <OptionGroup
          className="mt-5"
          name="notesPagination"
          legend="Pagination"
          hint="How you move through a long list of notes."
          value={settings.notesPagination}
          disabled={Boolean(pending)}
          onChange={(value) => change("notesPagination", value)}
          options={PAGINATION_OPTIONS.map((option) => ({ ...option, icon: PAGINATION_ICONS[option.value] }))}
        />

        <OptionGroup
          className="mt-6"
          name="notesPerPage"
          legend="Notes per page"
          hint={
            settings.notesPagination === "infinite"
              ? "How many notes load each time you reach the bottom."
              : "How many notes each page shows."
          }
          value={settings.notesPerPage}
          disabled={Boolean(pending)}
          onChange={(value) => change("notesPerPage", value)}
          options={PER_PAGE_OPTIONS.map((count) => ({ value: count, label: String(count) }))}
          compact
        />
      </section>
    </div>
  );
}
