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
      "string.email": "Invalid credentials.",
      "any.required": "Invalid credentials.",
    }),
  otpCode: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.length": "Invalid credentials.",
      "string.pattern.base": "Invalid credentials.",
      "any.required": "Invalid credentials.",
    }),
});

export { sendOtpValidation, verifyOtpValidation };
