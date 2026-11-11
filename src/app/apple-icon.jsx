import { ImageResponse } from "next/og";
import { BrandIcon } from "@/components/BrandIcon";

const SIZE = 180;

export const size = { width: SIZE, height: SIZE };
export const contentType = "image/png";

/**
 * Home screen icon for iPhone and iPad (iOS rounds the corners itself).
 *
 * @returns {ImageResponse}
 */
export default function AppleIcon() {
  return new ImageResponse(<BrandIcon size={SIZE} rounded={false} />, size);
}
