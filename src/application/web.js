import express from 'express';
import { publicRouter } from '../route/public-api.js';
import { errorMiddleware } from '../middleware/error-middleware.js';
import cookieParser from 'cookie-parser';
import { userRouter } from '../route/api.js';
import cors from 'cors';

export const web = express();

web.use(cors({
    origin: process.env.FRONT_END_URL,
    credentials: true,
}));
web.use(cookieParser());
web.use(express.json());
web.set('trust proxy', true);
web.use((req, res, next) => {
    req.ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress;
    next();
});
web.use(publicRouter);
web.use(userRouter);
web.use(errorMiddleware);

web.listen(process.env.APP_PORT, () => {
    console.log('Application is running');
});