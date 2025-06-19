import express from 'express';
import userController from '../controller/user-controller';

export const publicRouter = express.Router();
publicRouter.post('/auth/register', userController.register);
publicRouter.post('/auth/login', userController.login);
publicRouter.patch('/auth/session/refresh', userController.refresh);