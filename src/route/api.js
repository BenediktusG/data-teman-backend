import express from 'express';
import userController from '../controller/user-controller';

export const userRouter = express.Router();
userRouter.post('/auth/session/logout', userController.logout);