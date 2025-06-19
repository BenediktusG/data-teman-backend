import { prismaClient } from "../application/database";
import { logger } from "../application/logging";
import { ConflictError } from "../error/conflict-error";
import { registerUserValidation } from "../validation/user-validation";
import { validate } from "../validation/validation";
import bcrypt from 'bcrypt';

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

export default {
    register,
}