import rateLimit from "express-rate-limit";

const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3, // Limit to 3 OTP requests per IP in 15 minutes
  message: {
    success: false,
    error: "Too many OTP requests from this IP. Please try again later.",
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
    error:
      "Too many verification attempts from this IP. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
});

const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: "Too many requests from this IP. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export { otpRateLimit, otpVerifyRateLimit, generalRateLimit };
