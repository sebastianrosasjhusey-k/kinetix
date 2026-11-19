import type { NextConfig } from "next";

// Mockup: exportación estática (carpeta out/) para publicar en Netlify sin servidor.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
