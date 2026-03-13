import rateLimit from "express-rate-limit";

// ── Global Rate Limit ────────────────────────────────────────────────
// Applies to all endpoints — protects against general abuse
export const globalRateLimit = rateLimit({
  windowMs:          15 * 60 * 1000, // 15 minutes
  max:               100,             // max 100 requests per window
  standardHeaders:   true,            // return rate limit info in headers
  legacyHeaders:     false,
  message: {
    error: "Too many requests, please try again later.",
  },
});

// ── Auth Rate Limit ──────────────────────────────────────────────────
// Stricter limit for login/register — protects against brute force
export const authRateLimit = rateLimit({
  windowMs:          15 * 60 * 1000, // 15 minutes
  max:               10,              // max 10 attempts per window
  standardHeaders:   true,
  legacyHeaders:     false,
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
});