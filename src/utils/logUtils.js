export const extractLogs = (data) => (
    data.map((item) => {
        const result = item;
        if (item.user) {
            result.email = item.user.email;
            delete result.user; 
        } else {
            result.email = null;
        }
        return result;
    })
);