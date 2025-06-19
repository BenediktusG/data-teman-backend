import { ClientError } from "./client-error.js";

export class AuthenticationError extends ClientError {
    constructor(message) {
        super(401, message);
        this.name = 'AuthenticationError';
    }   
};