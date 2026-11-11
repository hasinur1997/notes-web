import { ImageResponse } from "next/og";
import { BrandIcon } from "@/components/BrandIcon";

const SIZE = 32;

export const size = { width: SIZE, height: SIZE };
export const contentType = "image/png";

/**
 * Browser tab icon: the app's logo mark, generated as a PNG at build time.
 *
 * @returns {ImageResponse}
 */
export default function Icon() {
  return new ImageResponse(<BrandIcon size={SIZE} />, size);
}
