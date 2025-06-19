import { prismaClient } from "../application/database";
import { createDataValidation } from "../validation/data-validation";
import { validate } from "../validation/validation";

const create = async (request, userId, ip) => {
    request = validate(createDataValidation, request);  
    request.ownerId = userId;
    const result = await prismaClient.data.create({
        data: request,
    });
    await logger({
        apiEndpoint: "/data",
        message:"Add new data teman",
        tableName: "Data",
        action: "CREATE",
        recordId: result.id,
        meta: result,
        userId: userId,
        ip: ip,
    });
    return result;
};

const get = async (userId, ip) => {
    const { data } = await prismaClient.user.findUnique({
        where: {
            id: userId,
        },
        include: {
            data: true,
        }
    });
    await logger({
        apiEndpoint: "/data",
        message:"Get all data teman",
        tableName: "Data",
        action: "GET",
        meta: data,
        userId: userId,
        ip: ip,
    });
    return data;
};

export default {
    create,
    get,
};