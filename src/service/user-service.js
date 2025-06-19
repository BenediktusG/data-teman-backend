import { v4 } from "uuid";
import { prismaClient } from "../application/database";
import { logger } from "../application/logging";
import { AuthenticationError } from "../error/authentication-error";
import { ConflictError } from "../error/conflict-error";
import { generateToken } from "../utils/jwtUtils";
import { loginValidation, registerUserValidation } from "../validation/user-validation";
import { validate } from "../validation/validation";
import bcrypt from 'bcrypt';
import { AuthorizationError } from "../error/authorization-error";
import { redis } from "../application/redis";

const register = async (request, ip) => {
    const user = validate(registerUserValidation, request);

    const isUserExists = await prismaClient.user.findUnique({
        where: {
            email: user.email,
        },
        select: {
            id: true,
        }
    });

    if (isUserExists) {
        throw new ConflictError('Username already exists');
    }

    user.password = await bcrypt.hash(user.password, 10);
    const result = await prismaClient.user.create({
        data: user,
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            registeredAt: true,
        },
    });
    await logger({
        message:"Register new user",
        tableName: "User",
        action: "CREATE",
        recordId: result.id,
        meta: result,
        userId: result.id,
        ip: ip,
    });
    return result;
};

const login = async (request, ip) => {
    const credential = validate(loginValidation, request);
    const user = await prismaClient.user.findUnique({
        where: {
            email: credential.email,
        }
    });
    if (!user) {
        throw new AuthenticationError("username and password didn't match");
    }
    const isPasswordValid = await bcrypt.compare(credential.password, user.password);
    if (!isPasswordValid) {
        throw new AuthenticationError("username and password didn't match");
    }
    
    const accessToken = generateToken(user);
    const refreshToken = v4();

    const result = await prismaClient.token.create({
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    await logger({
        message:"Login user",
        tableName: "token",
        action: "CREATE",
        recordId: result.id,
        meta: result,
        userId: user.id,
        ip: ip,
    });

    return {
        accessToken: accessToken,
        refreshToken: refreshToken,
    };
};

const logout = async (userId, refreshToken, accessToken ,ip) => {
    const token = await prismaClient.token.findUnique({
        where: {
            token: refreshToken,
        }
    });
    if (token.userId !== userId) {
        throw new AuthorizationError('You are not authorized to this action');
    }
    const result = await prismaClient.token.update({
        data: {
            valid: false,
            usedAt: new Date(),
        },
    });
    await logger({
        message:"User Logout",
        tableName: "token",
        action: "UPDATE",
        recordId: result.id,
        meta: result,
        userId: userId,
        ip: ip,
    });
    redis.set(`blacklistedAccessToken:${accessToken}`, "1", 'EX', process.env.REDIS_TTL);
}

export default {
    register,
    login,
    logout,
}