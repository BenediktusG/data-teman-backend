import { prismaClient } from "../application/database";
import { createDataValidation, updateDataValidation } from "../validation/data-validation";
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

const update = async (request, dataId ,userId, ip) => {
    request = validate(updateDataValidation, request);
    const result = await prismaClient.data.update({
        where: {
            id: dataId,
        },
        data: request,
    });
    await logger({
        apiEndpoint: "/data/:dataId",
        message:"Update data teman",
        tableName: "Data",
        action: "UPDATE",
        recordId: result.id,
        meta: result,
        userId: userId,
        ip: ip,
    });
    return result;
};

export default {
    create,
    get,
    update,
};