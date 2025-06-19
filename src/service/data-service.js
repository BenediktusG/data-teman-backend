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

export default {
    create,
}