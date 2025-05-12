const formatErrorResponse = (status, errorMessage) => {
    const error = new Error(errorMessage || "An unexpected error occurred");
    error.status = status;
    return error;
};

const getUnexpectedErrorStatus = (error) => {
    return error.isConnectionError ? 503 : 500;
}

module.exports = { formatErrorResponse, getUnexpectedErrorStatus };
