import { FileText } from "lucide-react";

/** App name shown next to the logo mark. */
export const APP_NAME = "Notes";

/**
 * Logo mark (document icon on an amber tile) followed by the app name.
 *
 * @param {object} props
 * @param {string} [props.nameClassName] - Extra classes for the name, e.g. to hide it on small screens.
 * @returns {JSX.Element}
 */
export function BrandLogo({ nameClassName = "" }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary text-foreground">
        <FileText className="size-[18px]" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className={`text-lg font-extrabold tracking-[-0.01em] ${nameClassName}`}>{APP_NAME}</span>
    </div>
  );
}
