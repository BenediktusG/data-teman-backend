import logService from "../service/log-service.js"

const get = async (req, res, next) => {
    try {
        const result = await logService.get(req.userRole);
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (e) {
        next(e);
    }
};

export default {
    get,
};
