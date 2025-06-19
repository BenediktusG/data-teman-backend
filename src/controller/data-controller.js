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

const update = async (req, res, next) => {
    try {
        const result = await dataService.update(req.body, req.params.dataId, req.userId, req.ip);
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (e) {
        next(e);
    }
};

const deleteData =  async (req, res, next) => {
    try {
        await dataService.deleteData(req.params.dataId, req.userId, req.ip);
        res.status(200).json({
            success: true,
            data: {
                message: 'delete data successful',
            },
        });
    } catch (e) {
        next(e);
    }
};

export default {
    register,
    get,
    update,
    deleteData,
};