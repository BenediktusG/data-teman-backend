import { v4 } from "uuid";
import { prismaClient } from "../application/database.js";
import { logger } from "../application/logging.js";
import { AuthenticationError } from "../error/authentication-error.js";
import { ConflictError } from "../error/conflict-error.js";
import { generateToken } from "../utils/jwtUtils.js";
import { changePasswordValidation, editUserInformationValidation, loginValidation, registerUserValidation } from "../validation/user-validation.js";
import { validate } from "../validation/validation.js";
import bcrypt from 'bcrypt';
import { AuthorizationError } from "../error/authorization-error.js";
import { redis } from "../application/redis.js";

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
        throw new ConflictError('Email already used');
    }

    user.password = await bcrypt.hash(user.password, 10);
    delete user.confirmationPassword;
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
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + Number(process.env.REFRESH_TOKEN_COOKIE_AGE)),
        },
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
        where: {
            token: refreshToken,
        },
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
};

const deleteUser = async (userId, ip) => {
    await logger({
        apiEndpoint: "/auth/me",
        message:"Delete user",
        tableName: "User",
        action: "DELETE",
        userId: userId,
        ip: ip,
    });
    await prismaClient.user.delete({
        where: {
            id: userId,
        },
    });
};

const changePassword = async (request, userId, ip) => {
    request = validate(changePasswordValidation, request);
    const user = await prismaClient.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            password: true,
        },
    });
    const isPasswordValid = await bcrypt.compare(request.oldPassword, user.password);
    if (!isPasswordValid) {
        await logger({
            apiEndpoint: "/auth/password",
            message:"Failed to change password due to invalid old password",
            tableName: "User",
            action: "UPDATE",
            userId: userId,
            ip: ip,
        });
        throw new AuthenticationError('Failed to change password due to invalid old password');
    }
    const hashedPassword = await bcrypt.hash(request.newPassword, 10);
    await prismaClient.user.update({
        where: {
            id: userId,
        },
        data: {
            password: hashedPassword,
        },
    });
    await logger({
        apiEndpoint: "/auth/password",
        message:"Change password",
        tableName: "User",
        action: "UPDATE",
        recordId: user.id,
        userId: userId,
        ip: ip,
    });
};

const refresh = async (refreshToken, ip) => {
    const token = await prismaClient.token.findUnique({
        where: {
            token: refreshToken,
        },
        include: {
            user: {
                select: {
                    id: true,
                    role: true,
                },
            },
        },
    });

    if (!token) {
       await logger({
            apiEndpoint: "/auth/session/refresh",
            message:"Failed to refresh access token due to invalid access token",
            tableName: "Token",
            action: "CREATE",
            ip: ip,
        }); 
        throw new AuthenticationError('Failed to refresh access token due to invalid refresh token');
    }

    if (!token.valid || token.expiresAt <= Date.now()) {
        token.valid = false,
        await logger({
            apiEndpoint: "/auth/session/refresh",
            message:"Failed to refresh access token due to invalid access token",
            tableName: "Token",
            action: "CREATE",
            userId: token.user.id,
            ip: ip,
        });
        throw new AuthenticationError('Failed to refresh access token due to invalid refresh token');
    }

    await prismaClient.token.update({
        where: {
            token: refreshToken,
        },
        data: {
            valid: false,
            usedAt: new Date(),
        },
    }); 

    const accessToken = generateToken(token.user);
    const newRefreshToken = v4();

    const result = await prismaClient.token.create({
        data: {
            token: newRefreshToken,
            userId: token.user.id,
            expiresAt: new Date(Date.now() + Number(process.env.REFRESH_TOKEN_COOKIE_AGE)),
        },
    });

    await logger({
        apiEndpoint: "/auth/session/refresh",
        message:"Refresh access token",
        tableName: "token",
        action: "CREATE",
        recordId: result.id,
        meta: result,
        userId: token.user.id,
        ip: ip,
    });
    return {
        refreshToken: newRefreshToken,
        accessToken: accessToken,
    };
};

export default {
    register,
    login,
    logout,
    getUserInformation,
    editUserInformation,
    deleteUser,
    changePassword,
    refresh,
}