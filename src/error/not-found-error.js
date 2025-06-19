import { ClientError } from "./client-error";

export class NotFoundError extends ClientError {
    constructor(message) {
        super(404, message);
        this.name = 'NotFoundError';
    }   
};