import { ClientError } from "./client-error";

export class AuthorizationError extends ClientError {
    constructor(message) {
        super(403, message);
        this.name = 'AuthorizationError';
    }   
};