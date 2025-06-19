import { ClientError } from "../error/client-error.js";

export const errorMiddleware = async (err, req, res, next) => {
    if (!err) {
        next();
        return;
    }

    if (err instanceof ClientError) {
        res.status(err.status).json({
            success: false,
            error: {
                message: err.message,
            },
        }).end();
    } else {
        res.status(500).json({
            success: false,
            error: {
                message: err.message,
            },
        }).end();
    }
}