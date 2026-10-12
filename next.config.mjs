/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Lint runs separately; don't let it block a deploy.
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Photos of handwritten notes are resized in the browser first, so this stays small.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
