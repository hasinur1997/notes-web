/**
 * Small rounded label tag shown on note cards and in the editor.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Label text (and optionally a remove button).
 * @returns {JSX.Element}
 */
export function LabelChip({ children }) {
  return (
    <span className="inline-flex h-5 max-w-full items-center gap-1 rounded-full bg-brand-soft px-2 text-xs leading-5 font-medium text-brand-strong">
      {children}
    </span>
  );
}
