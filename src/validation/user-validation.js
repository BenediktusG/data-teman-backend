import Joi from 'joi';

export const registerUserValidation = Joi.object({
    fullName: Joi.string.min(1).max(191).patern(/^[A-Za-zÀ-ÿ]+(?:[' -][A-Za-zÀ-ÿ]+)*$/).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&_]{8,128}$/).required(),
    confirmationPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only':'Confirmation password does not match password',
    }),
});

export const loginValidation = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
});

export const editUserInformationValidation = Joi.object({
    fullName: Joi.string.min(1).max(191).patern(/^[A-Za-zÀ-ÿ]+(?:[' -][A-Za-zÀ-ÿ]+)*$/).required(),
});

export const changePasswordValidation = Joi.object({
    oldPassword: Joi.string().min(8).required(),
    newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&_]{8,128}$/).required(),
    confirmationPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
        'any.only':'Confirmation password does not match password',
    }),
});