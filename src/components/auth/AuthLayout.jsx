import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { PAGE_ENTER_CLASS } from "@/lib/motion";

const HOME_LINK_CLASS = "w-fit rounded-[10px] focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none";

/** The brand, linking to the public home page (the posts feed). */
function HomeLink() {
  return (
    <Link href="/" aria-label="Notes home" className={HOME_LINK_CLASS}>
      <BrandLogo />
    </Link>
  );
}

/**
 * Split-screen layout for guest pages (register, login).
 * Left: brand (links home), headline, description and a page-specific footer on the soft amber panel (large screens only).
 * Right: the form card, centered. On small screens only the brand and the card are shown.
 *
 * @param {object} props
 * @param {string} props.headline - Large marketing headline.
 * @param {string} props.description - Supporting paragraph under the headline.
 * @param {React.ReactNode} props.aside - Content pinned to the bottom of the left panel (feature list, note previews).
 * @param {React.ReactNode} props.children - The form card.
 * @returns {JSX.Element}
 */
export function AuthLayout({ headline, description, aside, children }) {
  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-1/2 flex-col justify-between bg-brand-soft p-8 lg:flex">
        <HomeLink />

        <div className="max-w-[430px]">
          <h1 className="text-[33px] leading-[40px] font-extrabold tracking-[-0.01em]">{headline}</h1>
          <p className="mt-[18px] text-[15px] leading-[22px] text-muted-foreground">{description}</p>
        </div>

        {aside}
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-10 lg:px-8">
        <div className="lg:hidden">
          <HomeLink />
        </div>
        <div className={`flex w-full justify-center ${PAGE_ENTER_CLASS}`}>{children}</div>
      </main>
    </div>
  );
}
