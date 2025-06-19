import { ClientError } from "./client-error.js";

export class AuthorizationError extends ClientError {
    constructor(message) {
        super(403, message);
        this.name = 'AuthorizationError';
    }   
};