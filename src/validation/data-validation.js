import Joi from "joi";

export const createDataValidation = Joi.object({
  name: Joi.string().min(1).max(191).required(),
  description: Joi.string().min(1).max(191).required(),
  address: Joi.string().min(1).max(191).required(),
  birthDate: Joi.date().required(),
  photoLink: Joi.string().uri().required(),
});

export const updateDataValidation = Joi.object({
  name: Joi.string().min(1).max(191),
  description: Joi.string().min(1).max(191),
  address: Joi.string().min(1).max(191),
  birthDate: Joi.date(),
  photoLink: Joi.string().uri(),
}).min(1);

export const otpUserDataValidation = Joi.object({
  fullName: Joi.string()
    .min(1)
    .max(191)
    .pattern(/^[A-Za-zÀ-ÿ]+(?:[' -][A-Za-zÀ-ÿ]+)*$/)
    .required(),
  password: Joi.string().required(), // password sudah di-hash, tidak perlu pattern lagi
});
