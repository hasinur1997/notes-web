/**
 * The app's logo mark (document icon on an amber tile, like BrandLogo) for generated icons.
 * Colours are written out here because icons are rendered as images, outside the page's CSS.
 */

const AMBER = "#f2a93b";
const INK = "#2b211a";

/** FileText from lucide-react (24×24), the same icon BrandLogo shows. */
const ICON_PATHS = [
  "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
  "M14 2v5a1 1 0 0 0 1 1h5",
  "M10 9H8",
  "M16 13H8",
  "M16 17H8",
];

/**
 * Renders the logo mark filling a square of the given size.
 *
 * @param {object} props
 * @param {number} props.size - Width and height in pixels.
 * @param {boolean} [props.rounded=true] - Rounded corners (off for Apple icons, which iOS rounds itself).
 * @returns {JSX.Element}
 */
export function BrandIcon({ size, rounded = true }) {
  const iconSize = Math.round(size * 0.6);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: AMBER,
        borderRadius: rounded ? Math.round(size * 0.25) : 0,
      }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
        {ICON_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    </div>
  );
}
