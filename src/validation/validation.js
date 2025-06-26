import { ClientError } from "../error/client-error.js";

export const validate = (schema, request) => {
  const result = schema.validate(request, {
    allUnknown: false,
  });
  if (result.error) {
    throw new ClientError(400, result.error.message);
  } else {
    return result.value;
  }
};

export const validateData = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details.map((d) => d.message),
      });
    }

    next();
  };
};
