export class ClientError extends Error {
    constructor(status=400, message, code) {
        super(message);
        this.status = status;
        this.name = 'ClientError';
        this.code = code;
    }
}