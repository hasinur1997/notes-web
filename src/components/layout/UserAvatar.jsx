import { getInitials } from "@/lib/format";

/**
 * Round avatar with the user's initials on the soft amber background.
 *
 * @param {object} props
 * @param {string} props.name - User's full name.
 * @param {boolean} [props.ringed=false] - Adds the amber ring used in the header.
 * @returns {JSX.Element}
 */
export function UserAvatar({ name, ringed = false }) {
  return (
    <span
      className={`flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[15px] font-extrabold text-brand-strong ${
        ringed ? "border-2 border-primary" : ""
      }`}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}
