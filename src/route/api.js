import express from 'express';
import userController from '../controller/user-controller.js';
import dataController from '../controller/data-controller.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import logController from '../controller/log-controller.js';

export const userRouter = express.Router();
userRouter.use(authMiddleware);

// User API
userRouter.post('/auth/session/logout', userController.logout);
userRouter.get('/auth/me', userController.getUserInformation);
userRouter.patch('/auth/me', userController.editUserInformation);
userRouter.delete('/auth/me', userController.deleteUser);
userRouter.patch('/auth/password', userController.changePassword);

// Data API
userRouter.post('/data', dataController.register);
userRouter.get('/data', dataController.get);
userRouter.get('/data/:dataId', dataController.getDataWithId);
userRouter.patch('/data/:dataId', dataController.update);
userRouter.delete('/data/:dataId', dataController.deleteData);

// Log API
userRouter.get('/logs', logController.get);