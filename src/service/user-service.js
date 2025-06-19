import { v4 } from "uuid";
import { prismaClient } from "../application/database";
import { logger } from "../application/logging";
import { AuthenticationError } from "../error/authentication-error";
import { ConflictError } from "../error/conflict-error";
import { generateToken } from "../utils/jwtUtils";
import { editUserInformationValidation, loginValidation, registerUserValidation } from "../validation/user-validation";
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
        await logger({
            apiEndpoint: "/auth/register",
            message:"Failed to register new user because of email have already used",
            tableName: "User",
            action: "CREATE",
            ip: ip,
        });
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
        apiEndpoint: "/auth/register",
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
        await logger({
            apiEndpoint: "/auth/login",
            message:"Failed to login because of invalid email",
            tableName: "Token",
            action: "CREATE",
            ip: ip,
        });
        throw new AuthenticationError("username and password didn't match");
    }
    const isPasswordValid = await bcrypt.compare(credential.password, user.password);
    if (!isPasswordValid) {
        await logger({
            apiEndpoint: "/auth/login",
            message:"Failed to login because of invalid password",
            tableName: "Token",
            action: "CREATE",
            ip: ip,
        });
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
        apiEndpoint: "/auth/login",
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
        await logger({
            apiEndpoint: "/auth/session/logout",
            message:"Failed to logout because accessToken and refreshToken didn't match",
            tableName: "Token",
            action: "UPDATE",
            ip: ip,
        });
        throw new AuthorizationError('You are not authorized to this action');
    }
    const result = await prismaClient.token.update({
        data: {
            valid: false,
            usedAt: new Date(),
        },
    });
    await logger({
        apiEndpoint: "/auth/session/logout",
        message:"User Logout",
        tableName: "Token",
        action: "UPDATE",
        recordId: result.id,
        meta: result,
        userId: userId,
        ip: ip,
    });
    redis.set(`blacklistedAccessToken:${accessToken}`, "1", 'EX', process.env.REDIS_TTL);
};

const getUserInformation = async (userId, ip) => {
    const result = await prismaClient.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            registeredAt: true,
        },
    });
    await logger({
        apiEndpoint: "/auth/me",
        message:"Get detailed user information",
        tableName: "User",
        action: "READ",
        recordId: result.id,
        meta: result,
        userId: userId,
        ip: ip,
    });
    return result;
};

const editUserInformation = async (request, userId, ip) => {
    const { fullName } = validate(editUserInformationValidation, request);
    const result = await prismaClient.user.update({
        where: {
            id: userId,
        },
        data: {
            fullName: fullName,
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            registeredAt: true,
        },
    });

    await logger({
        apiEndpoint: "/auth/me",
        message:"Update user information",
        tableName: "User",
        action: "UPDATE",
        recordId: result.id,
        meta: result,
        userId: userId,
        ip: ip,
    });

    return result;
}

export default {
    register,
    login,
    logout,
    getUserInformation,
    editUserInformation,
}