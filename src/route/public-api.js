import express from "express";
import userController from "../controller/user-controller.js";
import {
  otpLimiterByEmail,
  otpLimiterByIP,
  otpRateLimit,
  otpVerifyRateLimit,
} from "../middleware/rate-limit-middleware.js";
import {
  sendOtpValidation,
  verifyOtpValidation,
} from "../validation/otp-validation.js";
import { validateData } from "../validation/validation.js";
import { registerUserValidation } from "../validation/user-validation.js";

export const publicRouter = express.Router();

publicRouter.post(
  "/auth/register",
  otpLimiterByEmail,
  otpLimiterByIP,
  validateData(registerUserValidation),
  userController.register
);

publicRouter.post(
  "/auth/register/verify",
  otpVerifyRateLimit,
  validateData(verifyOtpValidation),
  userController.verifyRegistration
);

publicRouter.post(
  "/auth/register/resend-otp",
  otpRateLimit,
  validateData(sendOtpValidation),
  userController.resendOtp
);

publicRouter.post("/auth/login", userController.login);
publicRouter.post("/auth/session/refresh", userController.refresh);
