import { redis } from "../application/redis.js";
import { AuthenticationError } from "../error/authentication-error.js";
import { verifyToken } from "../utils/jwtUtils.js";

export const authMiddleware = async (req, res, next) => {
    const token = req.cookies.accessToken;
    if (!token) {
        next(new AuthenticationError('You need to sign in to access this resource'));
    } else {
        const information = verifyToken(token);
        if (!information) {
            next(new AuthenticationError('Your token is invalid or expired'));
        }
        const { id, role } = information;
        if (!id) {
            next(new AuthenticationError('Your token is invalid or expired'));
        } else {
            const isBlacklisted = await redis.get(`blacklistedAccessToken:${token}`);
            if (isBlacklisted) {
                next(new AuthenticationError('Your token is invalid or expired'));
            }
            req.userId = id;
            req.userRole = role;
            next();
        }
    }
}