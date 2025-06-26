import { v4 } from "uuid";
import { prismaClient } from "../application/database.js";
import { logger } from "../application/logging.js";
import { AuthenticationError } from "../error/authentication-error.js";
import { ConflictError } from "../error/conflict-error.js";
import { generateToken } from "../utils/jwtUtils.js";
import {
  changePasswordValidation,
  editUserInformationValidation,
  loginValidation,
  registerUserValidation,
} from "../validation/user-validation.js";
import { validate } from "../validation/validation.js";
import bcrypt from "bcrypt";
import { AuthorizationError } from "../error/authorization-error.js";
import { redis } from "../application/redis.js";
import { Resend } from "resend";
import crypto from "crypto";

const prisma = prismaClient;
const resend = new Resend(process.env.RESEND_API_KEY);

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES);
const MAX_OTP_ATTEMPTS = parseInt(process.env.MAX_OTP_ATTEMPTS);
const MAX_FAILED_ATTEMPTS = parseInt(process.env.MAX_FAILED_ATTEMPTS);
const OTP_BLOCK_DURATION_MINUTES = parseInt(
  process.env.OTP_BLOCK_DURATION_MINUTES
);

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const sendOtpEmail = async (email, otpCode) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.SENDER_EMAIL,
      to: [email],
      subject: "Email Verification - OTP Code",
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <h2>Email Verification</h2>
                    <p>Please use this OTP code to verify your email address:</p>
                    <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px;">
                        <h1 style="color: #007bff; letter-spacing: 5px;">${otpCode}</h1>
                    </div>
                    <p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
                </div>
            `,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
};

const checkRecentAttempts = async (email) => {
  try {
    const blockTime = new Date(
      Date.now() - OTP_BLOCK_DURATION_MINUTES * 60 * 1000
    );

    const recentOtps = await prisma.otp.findMany({
      where: {
        email,
        createdAt: { gte: blockTime },
      },
      orderBy: { createdAt: "desc" },
    });

    const failedAttempts = recentOtps.filter(
      (otp) => otp.attempts >= MAX_OTP_ATTEMPTS
    ).length;

    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      const latestFailedOtp = recentOtps.find(
        (otp) => otp.attempts >= MAX_OTP_ATTEMPTS
      );
      const blockEndTime = new Date(
        latestFailedOtp.updatedAt.getTime() +
          OTP_BLOCK_DURATION_MINUTES * 60 * 1000
      );
      const remainingTime = Math.ceil(
        (blockEndTime - new Date()) / (60 * 1000)
      );
      if (remainingTime > 0) {
        return { isBlocked: true, remainingTime };
      }
    }

    return { isBlocked: false };
  } catch (error) {
    console.error("Error in checkRecentAttempts:", error);
    throw error;
  }
};

const register = async (request) => {
  const user = validate(registerUserValidation, request);

  const isUserExists = await prismaClient.user.findUnique({
    where: { email: user.email },
    select: { id: true },
  });

  if (isUserExists) {
    throw new ConflictError("Email already used");
  }

  const recentAttempt = await checkRecentAttempts(user.email);
  if (recentAttempt.isBlocked) {
    throw new ConflictError(
      `Too many attempts. Please try again after ${recentAttempt.remainingTime} minutes.`
    );
  }

  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otp.deleteMany({ where: { email: user.email } });

  const hashedPassword = await bcrypt.hash(
    user.password,
    parseInt(process.env.BCRYPT_SALT_ROUNDS)
  );

  await prisma.otp.create({
    data: {
      email: user.email,
      otpCode,
      expiresAt,
      attempts: 0,
      userData: JSON.stringify({
        fullName: user.fullName,
        password: hashedPassword,
      }),
    },
  });

  await sendOtpEmail(user.email, otpCode);

  return {
    message: "OTP sent successfully. Please verify to complete registration.",
    // email: user.email,
    // expiresIn: `${OTP_EXPIRY_MINUTES} minutes`,
  };
};

const verifyRegistration = async (request, ip) => {
  const { email, otpCode } = request;

  const otpRecord = await prisma.otp.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    console.log("OTP check failed: no record found for", email);
    throw new AuthenticationError("OTP is invalid or has expired.");
  }

  if (new Date() > otpRecord.expiresAt) {
    console.log("OTP expired for", email);
    await prisma.otp.delete({ where: { id: otpRecord.id } });
    throw new AuthenticationError("OTP is invalid or has expired.");
  }

  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    console.log("OTP attempts exceeded for", email);
    await prisma.otp.delete({ where: { id: otpRecord.id } });
    throw new AuthenticationError("OTP is invalid or has expired.");
  }

  if (otpRecord.otpCode !== otpCode) {
    const updated = await prisma.otp.update({
      where: { id: otpRecord.id },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    const remainingAttempts = MAX_OTP_ATTEMPTS - updated.attempts;
    if (remainingAttempts <= 0) {
      await prisma.otp.delete({ where: { id: otpRecord.id } });
      console.warn(`OTP attempts exceeded for email: ${otpRecord.email}`);
      throw new AuthenticationError("OTP is invalid or has expired.");
    }

    console.log(
      `Invalid OTP code for ${email}. ${remainingAttempts} attempts remaining.`
    );
    throw new AuthenticationError(`Invalid OTP code.`);
  }

  const userData = JSON.parse(otpRecord.userData);
  await prisma.otp.delete({ where: { id: otpRecord.id } });

  const userToCreate = {
    fullName: userData.fullName,
    email: email,
    password: userData.password,
  };

  const result = await prismaClient.user.create({
    data: userToCreate,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      registeredAt: true,
    },
  });

  await logger({
    apiEndpoint: "/auth/register/verify",
    message: "User registered successfully after OTP verification",
    tableName: "User",
    action: "CREATE",
    recordId: result.id,
    meta: result,
    ip: ip,
  });

  return result;
};

const resendOtp = async (email) => {
  const existingOtp = await prisma.otp.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (existingOtp) {
    const waitTime = parseInt(process.env.OTP_RESEND_WAIT_SECONDS);
    const timeSinceCreation = (new Date() - existingOtp.createdAt) / 1000;

    if (timeSinceCreation < waitTime) {
      const remainingWait = Math.ceil(waitTime - timeSinceCreation);
      console.warn(
        `[OTP] Resend blocked for ${email}. ${remainingWait}s remaining.`
      );
      throw new ConflictError("Please wait before requesting a new OTP.");
    }
  }

  const recentAttempt = await checkRecentAttempts(email);
  if (recentAttempt.isBlocked) {
    throw new ConflictError(
      `Too many attempts. Please try again after ${recentAttempt.remainingTime} minutes.`
    );
  }

  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const currentOtp = await prisma.otp.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  await prisma.otp.deleteMany({ where: { email } });
  await prisma.otp.create({
    data: {
      email,
      otpCode,
      expiresAt,
      attempts: 0,
      userData: currentOtp?.userData || null,
    },
  });

  await sendOtpEmail(email, otpCode);

  console.log(
    `[OTP] Resent OTP for ${email}. ExpiresIn: ${OTP_EXPIRY_MINUTES} minutes`
  );

  return {
    message: "OTP resent successfully",
  };
};

const login = async (request, ip) => {
  const credential = validate(loginValidation, request);
  const user = await prismaClient.user.findUnique({
    where: {
      email: credential.email,
    },
  });
  if (!user) {
    await logger({
      apiEndpoint: "/auth/login",
      message: "Failed to login because of invalid email",
      tableName: "Token",
      action: "CREATE",
      ip: ip,
    });
    throw new AuthenticationError("username and password didn't match");
  }
  const isPasswordValid = await bcrypt.compare(
    credential.password,
    user.password
  );
  if (!isPasswordValid) {
    await logger({
      apiEndpoint: "/auth/login",
      message: "Failed to login because of invalid password",
      tableName: "Token",
      action: "CREATE",
      ip: ip,
    });
    throw new AuthenticationError("username and password didn't match");
  }

  const accessToken = generateToken(user);
  const refreshToken = v4();

  const result = await prismaClient.token.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(
        Date.now() + Number(process.env.REFRESH_TOKEN_COOKIE_AGE)
      ),
    },
  });

  await logger({
    apiEndpoint: "/auth/login",
    message: "Login user",
    tableName: "token",
    action: "CREATE",
    recordId: result.id,
    meta: result,
    userId: user.id,
    ip: ip,
  });

  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
  };
};

const logout = async (userId, refreshToken, accessToken, ip) => {
  const token = await prismaClient.token.findUnique({
    where: {
      token: refreshToken,
    },
  });
  if (token.userId !== userId) {
    await logger({
      apiEndpoint: "/auth/session/logout",
      message:
        "Failed to logout because accessToken and refreshToken didn't match",
      tableName: "Token",
      action: "UPDATE",
      ip: ip,
    });
    throw new AuthorizationError("You are not authorized to this action");
  }
  const result = await prismaClient.token.update({
    where: {
      token: refreshToken,
    },
    data: {
      valid: false,
      usedAt: new Date(),
    },
  });
  await logger({
    apiEndpoint: "/auth/session/logout",
    message: "User Logout",
    tableName: "Token",
    action: "UPDATE",
    recordId: result.id,
    meta: result,
    userId: userId,
    ip: ip,
  });
  redis.set(
    `blacklistedAccessToken:${accessToken}`,
    "1",
    "EX",
    process.env.REDIS_TTL
  );
};

const getUserInformation = async (userId, ip) => {
  const result = await prismaClient.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      registeredAt: true,
    },
  });
  await logger({
    apiEndpoint: "/auth/me",
    message: "Get detailed user information",
    tableName: "User",
    action: "READ",
    recordId: result.id,
    meta: result,
    userId: userId,
    ip: ip,
  });
  return result;
};

const editUserInformation = async (request, userId, ip) => {
  const { fullName } = validate(editUserInformationValidation, request);
  const result = await prismaClient.user.update({
    where: {
      id: userId,
    },
    data: {
      fullName: fullName,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      registeredAt: true,
    },
  });

  await logger({
    apiEndpoint: "/auth/me",
    message: "Update user information",
    tableName: "User",
    action: "UPDATE",
    recordId: result.id,
    meta: result,
    userId: userId,
    ip: ip,
  });

  return result;
};

const deleteUser = async (userId, ip) => {
  await logger({
    apiEndpoint: "/auth/me",
    message: "Delete user",
    tableName: "User",
    action: "DELETE",
    userId: userId,
    ip: ip,
  });
  await prismaClient.user.delete({
    where: {
      id: userId,
    },
  });
};

const changePassword = async (request, userId, ip) => {
  request = validate(changePasswordValidation, request);
  const user = await prismaClient.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      password: true,
    },
  });
  const isPasswordValid = await bcrypt.compare(
    request.oldPassword,
    user.password
  );
  if (!isPasswordValid) {
    await logger({
      apiEndpoint: "/auth/password",
      message: "Failed to change password due to invalid old password",
      tableName: "User",
      action: "UPDATE",
      userId: userId,
      ip: ip,
    });
    throw new AuthenticationError(
      "Failed to change password due to invalid old password"
    );
  }
  const hashedPassword = await bcrypt.hash(
    request.newPassword,
    parseInt(process.env.BCRYPT_SALT_ROUNDS)
  );
  await prismaClient.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });
  await logger({
    apiEndpoint: "/auth/password",
    message: "Change password",
    tableName: "User",
    action: "UPDATE",
    recordId: user.id,
    userId: userId,
    ip: ip,
  });
};

const refresh = async (refreshToken, ip) => {
  const token = await prismaClient.token.findUnique({
    where: {
      token: refreshToken,
    },
    include: {
      user: {
        select: {
          id: true,
          role: true,
        },
      },
    },
  });

  if (!token) {
    await logger({
      apiEndpoint: "/auth/session/refresh",
      message: "Failed to refresh access token due to invalid access token",
      tableName: "Token",
      action: "CREATE",
      ip: ip,
    });
    throw new AuthenticationError(
      "Failed to refresh access token due to invalid refresh token"
    );
  }

  if (!token.valid || token.expiresAt <= Date.now()) {
    ((token.valid = false),
      await logger({
        apiEndpoint: "/auth/session/refresh",
        message: "Failed to refresh access token due to invalid access token",
        tableName: "Token",
        action: "CREATE",
        userId: token.user.id,
        ip: ip,
      }));
    throw new AuthenticationError(
      "Failed to refresh access token due to invalid refresh token"
    );
  }

  await prismaClient.token.update({
    where: {
      token: refreshToken,
    },
    data: {
      valid: false,
      usedAt: new Date(),
    },
  });

  const accessToken = generateToken(token.user);
  const newRefreshToken = v4();

  const result = await prismaClient.token.create({
    data: {
      token: newRefreshToken,
      userId: token.user.id,
      expiresAt: new Date(
        Date.now() + Number(process.env.REFRESH_TOKEN_COOKIE_AGE)
      ),
    },
  });

  await logger({
    apiEndpoint: "/auth/session/refresh",
    message: "Refresh access token",
    tableName: "token",
    action: "CREATE",
    recordId: result.id,
    meta: result,
    userId: token.user.id,
    ip: ip,
  });
  return {
    refreshToken: newRefreshToken,
    accessToken: accessToken,
  };
};

export default {
  register,
  resendOtp,
  verifyRegistration,
  login,
  logout,
  getUserInformation,
  editUserInformation,
  deleteUser,
  changePassword,
  refresh,
};
