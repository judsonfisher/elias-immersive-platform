import type { MatterportSDK } from "./types";
import { MockMatterportSDK } from "./mock-sdk";
import { RealMatterportSDK } from "./real-sdk";

let instance: MatterportSDK | null = null;

/**
 * Get the Matterport SDK instance.
 * Returns MockMatterportSDK by default, or RealMatterportSDK
 * when NEXT_PUBLIC_MATTERPORT_MODE is set to "live".
 */
export function getMatterportSDK(): MatterportSDK {
  if (!instance) {
    const mode = process.env.NEXT_PUBLIC_MATTERPORT_MODE || "mock";
    instance = mode === "live"
      ? new RealMatterportSDK()
      : new MockMatterportSDK();
  }
  return instance;
}

/**
 * Check if the SDK is running in mock mode.
 */
export function isMockMode(): boolean {
  return getMatterportSDK().isMock;
}
