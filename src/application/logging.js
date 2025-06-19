import { prismaClient } from "./database";

export const logger = async (logData) => {
    await prismaClient.log.create({
        data: logData,
    });
};