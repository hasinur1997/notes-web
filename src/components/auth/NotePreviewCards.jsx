/** Tilt and vertical offset for each preview card, so they look casually placed. */
const CARD_POSES = ["-rotate-2", "mt-3 rotate-2"];

/**
 * Small decorative note cards, slightly tilted (sign-in page, left panel).
 * Purely illustrative: hidden from assistive technology.
 *
 * @param {object} props
 * @param {{ title: string, body: string }[]} props.notes - Example notes to show (two fit the panel).
 * @returns {JSX.Element}
 */
export function NotePreviewCards({ notes }) {
  return (
    // Negative bottom margin lets the tilted cards sit closer to the panel edge, as in the design.
    <div className="-mb-3 flex items-start gap-5" aria-hidden="true">
      {notes.map(({ title, body }, index) => (
        <div
          key={title}
          className={`w-[210px] rounded-2xl bg-card px-4 pt-4 pb-3 shadow-[0_6px_20px_-8px] shadow-foreground/15 ${CARD_POSES[index % CARD_POSES.length]}`}
        >
          <p className="text-sm leading-5 font-bold">{title}</p>
          <p className="mt-1 text-[13px] leading-4 text-muted-foreground">{body}</p>
        </div>
      ))}
    </div>
  );
}
