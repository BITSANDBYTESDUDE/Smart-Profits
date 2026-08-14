import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["xlsx", "unpdf", "tesseract.js"],
};

export default nextConfig;
