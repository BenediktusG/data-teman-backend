import { ClientError } from "./client-error.js";

export class ConflictError extends ClientError {
    constructor(message) {
        super(409, message);
        this.name = 'ConflictError';
    }
};