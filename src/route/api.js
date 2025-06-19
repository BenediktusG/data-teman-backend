import express from 'express';
import userController from '../controller/user-controller';
import dataController from '../controller/data-controller';
import { authMiddleware } from '../middleware/auth-middleware';

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
userRouter.patch('/data/:dataId', dataController.update);
userRouter.delete('/data/:dataId', dataController.deleteData);