import { prismaClient } from "../application/database.js";
import { AuthorizationError } from "../error/authorization-error.js";
import { NotFoundError } from "../error/not-found-error.js";
import { createDataValidation, updateDataValidation } from "../validation/data-validation.js";
import { validate } from "../validation/validation.js";

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
    const data = await prismaClient.data.findUnique({
        where: {
            id: dataId,
        },
    });
    if (!data) {
        await logger({
            apiEndpoint: "/data/:dataId",
            message:"Failed to update data teman due to invalid data id",
            tableName: "Data",
            action: "UPDATE",
            userId: userId,
            recordId: dataId,
            ip: ip,
        });
        throw new NotFoundError('Data ID is invalid');
    }

    if (data.ownerId !== userId) {
        await logger({
            apiEndpoint: "/data/:dataId",
            message:"Failed to update data teman due to forbidden access",
            tableName: "Data",
            action: "UPDATE",
            userId: userId,
            recordId: dataId,
            ip: ip,
        });
        throw new AuthorizationError('You are not authorized to do this action');
    }

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

const deleteData = async (dataId, userId, ip) => {
    const data = await prismaClient.data.findUnique({
        where: {
            id: dataId,
        },
    });
    if (!data) {
        await logger({
            apiEndpoint: "/data/:dataId",
            message:"Failed to delete data teman due to invalid data id",
            tableName: "Data",
            action: "DELETE",
            userId: userId,
            recordId: dataId,
            ip: ip,
        });
        throw new NotFoundError('Data ID is invalid');
    }

    if (data.ownerId !== userId) {
        await logger({
            apiEndpoint: "/data/:dataId",
            message:"Failed to delete data teman due to forbidden access",
            tableName: "Data",
            action: "DELETE",
            userId: userId,
            recordId: dataId,
            ip: ip,
        });
        throw new AuthorizationError('You are not authorized to do this action');
    }

    await prismaClient.data.delete({
        where: {
            id: dataId,
        },
    });
    await logger({
        apiEndpoint: "/data/:dataId",
        message:"Success delete data teman",
        tableName: "Data",
        action: "DELETE",
        userId: userId,
        recordId: dataId,
        ip: ip,
    });
};

export default {
    create,
    get,
    update,
    deleteData,
};