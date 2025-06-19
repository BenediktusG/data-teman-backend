import { ClientError } from "../error/client-error";

export const errorMiddleware = async (err, req, res, next) => {
    if (!err) {
        next();
        return;
    }

    if (err instanceof ClientError) {
        res.status(err.status).json({
            message: err.message,
        }).end();
    } else {
        res.status(500).json({
            errors: err.message,
        }).end();
    }
}