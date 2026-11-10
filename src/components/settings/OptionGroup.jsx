"use client";

import { Check } from "lucide-react";

/**
 * A set of mutually exclusive choices built on native radio inputs (so arrow keys, screen
 * readers and forms work as usual), styled as selectable cards or, when `compact`, as pills.
 *
 * @param {object} props
 * @param {string} props.name - Radio group name.
 * @param {string} props.legend - Visible group label.
 * @param {string} [props.hint] - Help text under the label.
 * @param {string | number} props.value - Selected value.
 * @param {{ value: string | number, label: string, description?: string, icon?: React.ElementType }[]} props.options - Choices.
 * @param {(value: string | number) => void} props.onChange - Called with the chosen value.
 * @param {boolean} [props.disabled] - Disables every choice (e.g. while saving).
 * @param {boolean} [props.compact] - Pills in one row instead of cards.
 * @param {string} [props.className] - Extra classes for the fieldset.
 * @returns {JSX.Element}
 */
export function OptionGroup({ name, legend, hint, value, options, onChange, disabled = false, compact = false, className = "" }) {
  const hintId = hint ? `${name}-hint` : undefined;

  return (
    <fieldset className={className} aria-describedby={hintId} disabled={disabled}>
      <legend className="text-[15px] font-bold">{legend}</legend>
      {hint && (
        <p id={hintId} className="mt-0.5 text-[13px] text-muted-foreground">
          {hint}
        </p>
      )}
      <div className={compact ? "mt-3 flex flex-wrap gap-2" : "mt-3 grid gap-3 sm:grid-cols-2"}>
        {options.map((option) => {
          const Icon = option.icon;
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={`relative flex cursor-pointer rounded-xl border transition-[background-color,border-color,box-shadow,color] duration-200 ease-out has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 has-[:disabled]:cursor-wait ${
                checked ? "border-brand-strong bg-brand-soft text-brand-strong" : "border-border bg-card hover:bg-muted"
              } ${compact ? "h-10 min-w-16 items-center justify-center px-4 text-[15px] font-bold" : "items-start gap-3 p-4"}`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {Icon && <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />}
              {compact ? (
                option.label
              ) : (
                <span className="min-w-0 pr-5">
                  <span className="block text-[15px] font-bold">{option.label}</span>
                  {option.description && (
                    <span className={`mt-0.5 block text-[13px] ${checked ? "text-brand-strong/80" : "text-muted-foreground"}`}>
                      {option.description}
                    </span>
                  )}
                </span>
              )}
              {!compact && (
                <Check
                  className={`absolute top-4 right-4 size-4 transition-[opacity,scale] duration-200 ease-out ${checked ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                  aria-hidden="true"
                />
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
