import dataService from "../service/data-service"

const register = async (req, res, next) => {
    try {
        const result = await dataService.create(req.body, req.userId, req.ip);
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