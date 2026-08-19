import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The on-screen route indicator sits bottom-left, which is exactly where the
  // spine and the chapter captions are. Compile and runtime errors are still
  // surfaced; this only hides the badge.
  devIndicators: false,
};

export default nextConfig;
