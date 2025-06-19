import { prismaClient } from "./database.js";

export const logger = async (logData) => {
    await prismaClient.log.create({
        data: logData,
    });
};