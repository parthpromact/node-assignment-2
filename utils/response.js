// Response Handler
const httpResponse = (res, status, message, data) => {
    return res.status(status).json({
        message: message,
        data: data
    });
}

export default httpResponse;


