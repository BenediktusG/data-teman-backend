import express from 'express';
import userController from '../controller/user-controller';

export const userRouter = express.Router();
userRouter.post('/auth/session/logout', userController.logout);
userRouter.get('/auth/me', userController.getUserInformation);
userRouter.patch('/auth/me', userController.editUserInformation);
userRouter.delete('/auth/me', userController.deleteUser);
userRouter.patch('/auth/password', userController.changePassword);