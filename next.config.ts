import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Allow Matterport and Nira embed domains for iframe CSP
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-src 'self' https://*.matterport.com https://my.matterport.com https://*.nira.app https://nira.app;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
