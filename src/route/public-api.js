import express from 'express';
import userController from '../controller/user-controller.js';

export const publicRouter = express.Router();
publicRouter.post('/auth/register', userController.register);
publicRouter.post('/auth/login', userController.login);
publicRouter.post('/auth/session/refresh', userController.refresh);