import express from 'express';
import { publicRouter } from '../route/public-api';
import { errorMiddleware } from '../middleware/error-middleware';

export const web = express();

web.use(express.json());
web.set('trust proxy', true);
web.use((req, res, next) => {
    req.ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress;
    next();
});
web.use(publicRouter);
web.use(errorMiddleware);