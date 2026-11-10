import { BrandLogo } from "@/components/BrandLogo";

/**
 * Split-screen layout for guest pages (register, login).
 * Left: brand, headline, description and feature list on the soft amber panel (large screens only).
 * Right: the form card, centered. On small screens only the brand and the card are shown.
 *
 * @param {object} props
 * @param {string} props.headline - Large marketing headline.
 * @param {string} props.description - Supporting paragraph under the headline.
 * @param {{ icon: import("lucide-react").LucideIcon, text: string }[]} props.features - Short selling points with icons.
 * @param {React.ReactNode} props.children - The form card.
 * @returns {JSX.Element}
 */
export function AuthLayout({ headline, description, features, children }) {
  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-1/2 flex-col justify-between bg-brand-soft p-8 lg:flex">
        <BrandLogo />

        <div className="max-w-[430px]">
          <h1 className="text-[33px] leading-[40px] font-extrabold tracking-[-0.01em]">{headline}</h1>
          <p className="mt-5 text-[15px] leading-[22px] text-muted-foreground">{description}</p>
        </div>

        <ul className="flex flex-col gap-3.5">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2.5 text-[15px] leading-[22px] font-medium">
              <Icon className="size-[18px] shrink-0 text-brand-strong" strokeWidth={2} aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-10 lg:px-8">
        <div className="lg:hidden">
          <BrandLogo />
        </div>
        {children}
      </main>
    </div>
  );
}
