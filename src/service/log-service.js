import { prismaClient } from "../application/database.js";
import { AuthorizationError } from "../error/authorization-error.js";

const get = async (userRole) => {
    if (userRole !== "ADMIN") {
        throw new AuthorizationError("You are not authorized to access this resource");
    }
    return prismaClient.log.findMany();
};

export default {
    get,
};