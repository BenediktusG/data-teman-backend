import { ClientError } from "./client-error.js";

export class NotFoundError extends ClientError {
    constructor(message) {
        super(404, message);
        this.name = 'NotFoundError';
    }   
};