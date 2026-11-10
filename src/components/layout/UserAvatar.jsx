import Image from "next/image";
import { getInitials } from "@/lib/format";
import { canOptimizeImage, resolveImageUrl } from "@/lib/imageUrl";

/** Size presets: box size, initials text size, and the pixel size requested for photos. */
const SIZES = {
  sm: { box: "size-7", text: "text-[11px]", px: 28 },
  md: { box: "size-11", text: "text-[15px]", px: 44 },
  lg: { box: "size-20", text: "text-[26px]", px: 80 },
};

/**
 * Round avatar: the user's profile photo, or their initials on the soft amber background.
 *
 * @param {object} props
 * @param {string} props.name - User's full name (used for initials and the photo's alt text).
 * @param {{ url: string } | null} [props.avatar] - Profile photo, if any.
 * @param {"sm" | "md" | "lg"} [props.size="md"] - Avatar size.
 * @param {boolean} [props.ringed=false] - Adds the amber ring used in the header.
 * @param {string} [props.className] - Extra classes (e.g. a border when overlapping).
 * @returns {JSX.Element}
 */
export function UserAvatar({ name, avatar, size = "md", ringed = false, className = "" }) {
  const { box, text, px } = SIZES[size];
  const url = avatar?.url ? resolveImageUrl(avatar.url) : "";
  const frame = `relative flex ${box} shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft ${
    ringed ? "border-2 border-primary" : ""
  } ${className}`;

  return (
    <span className={frame} aria-hidden="true">
      {url ? (
        <Image src={url} alt="" width={px * 2} height={px * 2} unoptimized={!canOptimizeImage(url)} className="size-full object-cover" />
      ) : (
        <span className={`${text} font-extrabold text-brand-strong`}>{getInitials(name)}</span>
      )}
    </span>
  );
}
