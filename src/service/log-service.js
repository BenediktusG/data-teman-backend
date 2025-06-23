import { prismaClient } from "../application/database.js";
import { AuthorizationError } from "../error/authorization-error.js";
import { extractLogs } from "../utils/logUtils.js";

const get = async (userRole) => {
    if (userRole !== "ADMIN") {
        throw new AuthorizationError("You are not authorized to access this resource");
    }
    const result = await prismaClient.log.findMany({
        include: {
            user: {
                select: {
                    email: true,
                },
            },
        },
    });
    return extractLogs(result);
};

export default {
    get,
};