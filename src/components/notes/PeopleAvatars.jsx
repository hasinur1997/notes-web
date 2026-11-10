import { getInitials } from "@/lib/format";

const MAX_SHOWN = 4;

/**
 * Overlapping initials for the people a note is shared with.
 *
 * @param {object} props
 * @param {{ _id: string, name: string, email?: string }[]} props.people - People to show.
 * @param {() => void} [props.onClick] - Makes the avatars a button (e.g. to open sharing).
 * @returns {JSX.Element | null}
 */
export function PeopleAvatars({ people, onClick }) {
  if (!people.length) return null;
  const shown = people.slice(0, MAX_SHOWN);
  const extra = people.length - shown.length;
  const label = `Shared with ${people.map((person) => person.name).join(", ")}`;

  const content = (
    <span className="flex -space-x-1.5">
      {shown.map((person) => (
        <span
          key={person._id}
          title={person.email ? `${person.name} (${person.email})` : person.name}
          className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-brand-soft text-[11px] font-extrabold text-brand-strong"
        >
          {getInitials(person.name)}
        </span>
      ))}
      {extra > 0 && (
        <span className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[11px] font-bold">
          +{extra}
        </span>
      )}
    </span>
  );

  return onClick ? (
    <button type="button" onClick={onClick} aria-label={label} className="relative z-10 rounded-full">
      {content}
    </button>
  ) : (
    <span role="img" aria-label={label}>
      {content}
    </span>
  );
}
