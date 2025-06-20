import userService from "../service/user-service.js";

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
        res.cookie('accessToken', result.accessToken, {
            path:'/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? "strict" : "none",
            maxAge: process.env.ACCESS_TOKEN_COOKIE_AGE,  
        });

        res.cookie('refreshToken', result.refreshToken, {
            path: '/auth/session',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? "strict" : "none",
            maxAge: process.env.REFRESH_TOKEN_COOKIE_AGE, 
        });

        res.status(200).json({
            success: true,
            data: {
                message: "login successful",
            },
        });
    } catch (e) {
        next(e);
    }
};

const logout = async (req, res, next) => {
    try {
        const { refreshToken, accessToken } = req.cookies;
        await userService.logout(req.userId, refreshToken, accessToken, req.ip);
        res.clearCookie('accessToken', { path: '/' });
        res.clearCookie('refreshToken', { path: '/api/session' });
        res.status(200).json({
            success: true,
            data: {
                message: "logout successful",
            },
        });
    } catch (e) {
        next(e);
    }
}

const getUserInformation = async (req, res, next) => {
    const result = await userService.getUserInformation(req.userId, req.ip);
    res.status(200).json({
        success: true,
        data: result,
    });
};

const editUserInformation = async (req, res, next) => {
    const result = await userService.editUserInformation(req.body, req.userId, req.ip);
    res.status(200).json({
        success: true,
        data: result,
    });
};

const deleteUser = async (req, res, next) => {
    await userService.deleteUser(req.userId, req.ip);
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/session' });
    res.status(200).json({
        success: true,
        data: {
            message: "delete user successful",
        },
    });
};

const changePassword = async (req, res, next) => {
    try {
        await userService.changePassword(req.body, req.userId, req.ip);
        res.status(200).json({
            success: true,
            data: {
                message: "Change password successful",
            },
        });
    } catch (e) {
        next(e);
    }
};

const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.cookies;
        const result = await userService.refresh(refreshToken, req.ip);
         res.cookie('accessToken', result.accessToken, {
            path:'/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? "strict" : "none",
            maxAge: process.env.ACCESS_TOKEN_COOKIE_AGE, 
        });

        res.cookie('refreshToken', result.refreshToken, {
            path: '/auth/session',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? "strict" : "none",
            maxAge: process.env.REFRESH_TOKEN_COOKIE_AGE, 
        });
        res.status(200).json({
            success: true,
            data: {
                message: "Refresh access token successful",
            },
        });
    } catch (e) {
        next(e);
    }
};

export default {
    register,
    login,
    logout,
    getUserInformation,
    editUserInformation,
    deleteUser,
    changePassword,
    refresh,
};