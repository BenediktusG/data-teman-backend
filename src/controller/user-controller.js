import userService from "../service/user-service";

const register = async (req, res, next) => {
    try {
        const result = await userService.register(req.body, ip);
        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (e) {
        next(e);
    }
};

export default {
    register,
};