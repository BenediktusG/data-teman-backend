import Joi from "joi";

const sendOtpValidation = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
});

const verifyOtpValidation = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  otpCode: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.length": "OTP code must be exactly 6 digits",
      "string.pattern.base": "OTP code must contain only numbers",
      "any.required": "OTP code is required",
    }),
});

export { sendOtpValidation, verifyOtpValidation };
