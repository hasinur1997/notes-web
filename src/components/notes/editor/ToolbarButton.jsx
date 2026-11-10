/**
 * Round icon button used across the note toolbar.
 *
 * @param {object} props
 * @param {string} props.label - Accessible name and tooltip.
 * @param {boolean} [props.pressed] - Toggle state, for toggle buttons.
 * @param {boolean} [props.disabled] - Disables the button.
 * @param {React.ReactNode} props.children - The icon.
 * @returns {JSX.Element}
 */
export function ToolbarButton({ label, pressed, disabled, children, className = "", ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      disabled={disabled}
      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35 aria-pressed:bg-brand-soft aria-pressed:text-brand-strong ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Classes that make a dropdown trigger look like a ToolbarButton. */
export const TOOLBAR_TRIGGER_CLASS =
  "flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-brand-soft data-popup-open:text-brand-strong";
