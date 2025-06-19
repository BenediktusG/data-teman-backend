import userService from "../service/user-service";

const register = async (req, res, next) => {
    try {
        const result = await userService.register(req.body, req.ip);
        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (e) {
        next(e);
    }
};

const login = async (req, res, next) => {
    try {
        const result = await userService.login(req.body, req.ip);
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (e) {
        next(e);
    }
};

export default {
    register,
    login,
};