import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Pin the workspace root explicitly. Without this, Next/Turbopack can
  // mis-infer the project root when there's another package.json/lockfile
  // higher up the folder tree (e.g. in Documents/Github), which breaks the
  // build with "Next.js inferred your workspace root, but it may not be
  // correct".
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
