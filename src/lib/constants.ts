export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Elias Immersive";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Invite token expiry (7 days)
export const INVITE_EXPIRY_DAYS = 7;

// Password reset token expiry (1 hour)
export const PASSWORD_RESET_EXPIRY_HOURS = 1;

// Phone verification code expiry (10 minutes)
export const PHONE_CODE_EXPIRY_MINUTES = 10;

// Max phone verification attempts per code
export const MAX_PHONE_VERIFY_ATTEMPTS = 3;

// Allowed embed domains for scan iframes
export const ALLOWED_EMBED_DOMAINS = [
  "my.matterport.com",
  "matterport.com",
  "nira.app",
];

// Bcrypt salt rounds
export const BCRYPT_SALT_ROUNDS = 10;

// Share link defaults
export const SHARE_LINK_DEFAULT_EXPIRY_DAYS = 7;
export const SHARE_LINK_MAX_EXPIRY_DAYS = 90;

// Embed widget
export const EMBED_API_KEY_LENGTH = 32;
