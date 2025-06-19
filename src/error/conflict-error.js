import { ClientError } from "./client-error";

export class ConflictError extends ClientError {
    constructor(message) {
        super(409, message);
        this.name = 'ConflictError';
    }
};