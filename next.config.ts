import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Allow Matterport and Nira embed domains for iframe CSP
  async headers() {
    return [
      // Default CSP for all routes
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "frame-src 'self' https://*.matterport.com https://my.matterport.com https://*.nira.app https://nira.app",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.matterport.com",
              "connect-src 'self' https://*.matterport.com",
            ].join("; ") + ";",
          },
        ],
      },
      // Embed routes: allow external sites to iframe the embed page
      {
        source: "/embed/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "frame-ancestors *",
              "frame-src 'self' https://*.matterport.com https://my.matterport.com https://*.nira.app https://nira.app",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.matterport.com",
              "connect-src 'self' https://*.matterport.com",
            ].join("; ") + ";",
          },
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
