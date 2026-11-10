import { Bold, Heading1, Heading2, Italic, List, ListOrdered, Strikethrough, Underline } from "lucide-react";
import { ToolbarButton } from "@/components/notes/editor/ToolbarButton";

const FORMAT_BUTTONS = [
  { format: "h1", label: "Heading", icon: Heading1 },
  { format: "h2", label: "Subheading", icon: Heading2 },
  { format: "bold", label: "Bold (Ctrl+B)", icon: Bold },
  { format: "italic", label: "Italic (Ctrl+I)", icon: Italic },
  { format: "underline", label: "Underline (Ctrl+U)", icon: Underline },
  { format: "strike", label: "Strikethrough", icon: Strikethrough },
  { format: "bullet", label: "Bulleted list", icon: List },
  { format: "numbered", label: "Numbered list", icon: ListOrdered },
];

/**
 * Row of text formatting buttons shown above the toolbar when "Formatting" is on.
 * Buttons keep focus in the text (mouse down is prevented) so the selection is not lost.
 *
 * @param {object} props
 * @param {(format: string) => void} props.onFormat - Applies a format from lib/formatText.
 * @returns {JSX.Element}
 */
export function FormatBar({ onFormat }) {
  return (
    <div role="toolbar" aria-label="Text formatting" className="flex flex-wrap items-center gap-0.5 px-2.5 pt-1">
      {FORMAT_BUTTONS.map(({ format, label, icon: Icon }) => (
        <ToolbarButton
          key={format}
          label={label}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onFormat(format)}
        >
          <Icon className="size-[18px]" aria-hidden="true" />
        </ToolbarButton>
      ))}
    </div>
  );
}
