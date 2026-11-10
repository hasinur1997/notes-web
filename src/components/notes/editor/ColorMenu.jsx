"use client";

import { Check, Palette } from "lucide-react";
import { TOOLBAR_TRIGGER_CLASS } from "@/components/notes/editor/ToolbarButton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NOTE_COLORS } from "@/lib/noteColors";

/**
 * Background colour picker: a grid of swatches from the app palette.
 *
 * @param {object} props
 * @param {string} props.value - Current colour key.
 * @param {(key: string) => void} props.onChange - Called with the chosen key.
 * @returns {JSX.Element}
 */
export function ColorMenu({ value, onChange }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Background colour" title="Background colour" className={TOOLBAR_TRIGGER_CLASS}>
        <Palette className="size-[18px]" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto rounded-2xl border border-border p-2 ring-0">
        <div className="grid grid-cols-4 gap-1.5">
          {NOTE_COLORS.map((color) => (
            <DropdownMenuItem
              key={color.key}
              onClick={() => onChange(color.key)}
              aria-label={color.label}
              title={color.label}
              className={`flex size-9 items-center justify-center rounded-full border p-0 ${color.className} ${
                value === color.key ? "border-brand-strong border-2" : "border-border"
              } focus:ring-3 focus:ring-focus`}
            >
              {value === color.key && <Check className="size-4 text-brand-strong" aria-hidden="true" />}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
