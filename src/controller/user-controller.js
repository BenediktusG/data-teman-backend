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
        res.cookie('accessToken', result.accessToken, {
            path:'/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? "strict" : "none",
            maxAge: 60 * 1000, 
        });

        res.cookie('refreshToken', result.refreshToken, {
            path: '/auth/session',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? "strict" : "none",
            maxAge: 7 * 24 * 60 * 60 * 1000, 
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

export default {
    register,
    login,
    logout,
};