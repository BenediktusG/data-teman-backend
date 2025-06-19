import Joi from 'joi';

export const createDataValidation = Joi.object({
    name: Joi.string().min(1).max(191).required(),
    description: Joi.string().min(1).max(191),
    address: Joi.string().min(1).max(191).required(),
    birthDate: Joi.date().required(),
    photoLink: Joi.string().uri(),
});