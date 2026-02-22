/**
 * Extract the Matterport model SID from an embed URL.
 * Supports: https://my.matterport.com/show/?m=XgVq3XaSSvU
 */
export function extractMatterportSid(embedUrl: string): string | null {
  try {
    const url = new URL(embedUrl);
    return url.searchParams.get("m");
  } catch {
    return null;
  }
}

/**
 * Build a Showcase iframe URL from a base embed URL.
 * Appends play=1 and qs=1 for auto-start.
 * The applicationKey is intentionally NOT included in the iframe URL — an
 * invalid key causes Matterport to block the entire embed. The SDK connection
 * is attempted separately via MP_SDK.connect() which handles key validation
 * gracefully (see showcase-client.ts).
 */
export function buildShowcaseUrl(embedUrl: string): string {
  try {
    const url = new URL(embedUrl);
    url.searchParams.set("play", "1");
    url.searchParams.set("qs", "1");
    return url.toString();
  } catch {
    return embedUrl;
  }
}
