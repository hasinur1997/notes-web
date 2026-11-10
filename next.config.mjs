/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  // Note images are stored on Cloudinary by the API; only that host may be optimized by next/image.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/**", search: "" }],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
