import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Labelled text input with an optional error message, styled for the auth cards.
 * The error is linked to the input with aria-describedby and marks it aria-invalid,
 * so screen readers announce it and the input shows the red border.
 *
 * @param {object} props
 * @param {string} props.id - Input id; also used to build the error id.
 * @param {string} props.label - Visible label text.
 * @param {string} [props.error] - Error message shown under the input.
 * @returns {JSX.Element}
 */
export function FormField({ id, label, error, ...inputProps }) {
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-[13px] leading-5 font-semibold">
        {label}
      </Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="h-[42px] rounded-[10px] bg-card px-4 text-[15px] placeholder:text-placeholder aria-invalid:ring-0 md:text-[15px]"
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-xs leading-[18px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
