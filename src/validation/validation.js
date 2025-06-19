import { ClientError } from "../error/client-error";

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