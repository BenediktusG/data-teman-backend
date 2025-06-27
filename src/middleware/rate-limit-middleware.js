import rateLimit from "express-rate-limit";

const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3, // Limit to 3 OTP requests per IP in 15 minutes
  message: {
    success: false,
    error: "Too many OTP requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

const otpVerifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit to 5 verification attempts per IP in 15 minutes
  message: {
    success: false,
    error: "Too many verification attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
});

const generalRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100, // Limit to 100 requests per IP in 10 minutes
  message: {
    success: false,
    error: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// registering rate limiters by email and IP
const otpLimiterByEmail = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 3, // 3 OTP requests per email in 15 minutes
  keyGenerator: (req) => req.body?.email?.trim().toLowerCase() || req.ip,
  message: {
    success: false,
    error: "Too many OTP requests for this email.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiterByIP = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3, // 3 OTP requests per IP
  message: {
    success: false,
    error: "Too many OTP requests from your IP.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10, // Limit to 1 login attempt per IP in 15 minutes
  message: {
    success: false,
    error: "Terlalu banyak percobaan login. Coba lagi nanti.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
});

export {
  otpRateLimit,
  otpVerifyRateLimit,
  generalRateLimit,
  otpLimiterByEmail,
  otpLimiterByIP,
  loginRateLimit,
};
