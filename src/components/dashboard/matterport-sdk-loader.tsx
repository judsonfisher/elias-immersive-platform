"use client";

import Script from "next/script";

/**
 * Loads the Matterport Showcase SDK script globally.
 * Sets window.MP_SDK which is used by ShowcaseEventCapture.
 */
export function MatterportSdkLoader() {
  const sdkKey = process.env.NEXT_PUBLIC_MATTERPORT_SDK_KEY;
  if (!sdkKey) return null;

  return (
    <Script
      src="https://static.matterport.com/showcase-sdk/latest.js"
      strategy="lazyOnload"
    />
  );
}
