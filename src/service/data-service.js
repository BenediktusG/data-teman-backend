import xss from "xss";
import { prismaClient } from "../application/database.js";
import { logger } from "../application/logging.js";
import { AuthorizationError } from "../error/authorization-error.js";
import { NotFoundError } from "../error/not-found-error.js";
import {
  createDataValidation,
  updateDataValidation,
} from "../validation/data-validation.js";
import { validate } from "../validation/validation.js";
import { ClientError } from "../error/client-error.js";

const isMaliciousInput = (input) => {
  const sanitized = xss(input, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed"],
  });

  return input !== sanitized;
};

const create = async (request, userId, ip) => {
  request = validate(createDataValidation, request);

  if (
    isMaliciousInput(request.name) ||
    isMaliciousInput(request.description) ||
    isMaliciousInput(request.address) ||
    isMaliciousInput(request.photoLink)
  ) {
    console.warn("Potential XSS input in updateData:", request);
    throw new ClientError(
      400,
      "Invalid input. Please check your data and try again."
    );
  }

  request.ownerId = userId;
  const result = await prismaClient.data.create({
    data: request,
  });
  await logger({
    apiEndpoint: "/data",
    message: "Add new data teman",
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
    },
  });
  await logger({
    apiEndpoint: "/data",
    message: "Get all data teman",
    tableName: "Data",
    action: "READ",
    meta: data,
    userId: userId,
    ip: ip,
  });
  return data;
};

const getDataWithId = async (userId, dataId, ip) => {
  const data = await prismaClient.data.findUnique({
    where: {
      id: dataId,
    },
  });
  if (!data) {
    await logger({
      apiEndpoint: "/data/:dataId",
      message: "Failed to get data teman due to invalid data id",
      tableName: "Data",
      action: "READ",
      userId: userId,
      ip: ip,
    });
    throw new NotFoundError("Data ID is invalid");
  }

  if (data.ownerId !== userId) {
    await logger({
      apiEndpoint: "/data/:dataId",
      message: "Failed to get data teman due to forbidden access",
      tableName: "Data",
      action: "READ",
      userId: userId,
      recordId: dataId,
      ip: ip,
    });
    throw new AuthorizationError("You are not authorized to do this action");
  }

  await logger({
    apiEndpoint: "/data/:dataId",
    message: "Get data teman",
    tableName: "Data",
    action: "READ",
    recordId: data.id,
    meta: data,
    userId: userId,
    ip: ip,
  });
  return data;
};

const update = async (request, dataId, userId, ip) => {
  request = validate(updateDataValidation, request);

  if (
    isMaliciousInput(request.name) ||
    isMaliciousInput(request.description) ||
    isMaliciousInput(request.address) ||
    isMaliciousInput(request.photoLink)
  ) {
    console.warn("Potential XSS input in updateData:", request);
    throw new ClientError(
      "Invalid input. Please check your data and try again."
    );
  }

  const data = await prismaClient.data.findUnique({
    where: {
      id: dataId,
    },
  });
  if (!data) {
    await logger({
      apiEndpoint: "/data/:dataId",
      message: "Failed to update data teman due to invalid data id",
      tableName: "Data",
      action: "UPDATE",
      userId: userId,
      ip: ip,
    });
    throw new NotFoundError("Data ID is invalid");
  }

  if (data.ownerId !== userId) {
    await logger({
      apiEndpoint: "/data/:dataId",
      message: "Failed to update data teman due to forbidden access",
      tableName: "Data",
      action: "UPDATE",
      userId: userId,
      recordId: dataId,
      ip: ip,
    });
    throw new AuthorizationError("You are not authorized to do this action");
  }

  const result = await prismaClient.data.update({
    where: {
      id: dataId,
    },
    data: request,
  });
  await logger({
    apiEndpoint: "/data/:dataId",
    message: "Update data teman",
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
      message: "Failed to delete data teman due to invalid data id",
      tableName: "Data",
      action: "DELETE",
      userId: userId,
      recordId: dataId,
      ip: ip,
    });
    throw new NotFoundError("Data ID is invalid");
  }

  if (data.ownerId !== userId) {
    await logger({
      apiEndpoint: "/data/:dataId",
      message: "Failed to delete data teman due to forbidden access",
      tableName: "Data",
      action: "DELETE",
      userId: userId,
      recordId: dataId,
      ip: ip,
    });
    throw new AuthorizationError("You are not authorized to do this action");
  }

  await prismaClient.data.delete({
    where: {
      id: dataId,
    },
  });
  await logger({
    apiEndpoint: "/data/:dataId",
    message: "Success delete data teman",
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
  getDataWithId,
};
