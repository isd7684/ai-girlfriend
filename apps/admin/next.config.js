/** @type {import('next').NextConfig} */

const nextConfig = {
  output: "export",
  transpilePackages: ["@repo/ui", "@repo/contracts", "@repo/api"]
};

export default nextConfig;
