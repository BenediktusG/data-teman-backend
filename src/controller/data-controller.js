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

const get = async (req, res, next) => {
    const result = await dataService.get(req.userId, req.ip);
    res.status(200).json({
        success: true,
        data: result,
    });
};

export default {
    register,
    get,
};