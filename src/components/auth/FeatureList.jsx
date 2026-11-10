/**
 * Vertical list of short selling points, each with an icon (register page, left panel).
 *
 * @param {object} props
 * @param {{ icon: import("lucide-react").LucideIcon, text: string }[]} props.features - Points to show, in order.
 * @returns {JSX.Element}
 */
export function FeatureList({ features }) {
  return (
    <ul className="flex flex-col gap-3.5">
      {features.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-2.5 text-[15px] leading-[22px] font-medium">
          <Icon className="size-[18px] shrink-0 text-brand-strong" strokeWidth={2} aria-hidden="true" />
          {text}
        </li>
      ))}
    </ul>
  );
}
