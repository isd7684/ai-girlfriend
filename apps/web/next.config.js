/** @type {import('next').NextConfig} */

const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@repo/ui", "@repo/contracts", "@repo/api"]
};

export default nextConfig;
