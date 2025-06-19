import express from 'express';

export const web = express();

web.use(express.json());
web.set('trust proxy', true);
web.use((req, res, next) => {
    req.ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress;
    next();
});