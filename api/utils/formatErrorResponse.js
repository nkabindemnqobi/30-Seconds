const formatErrorResponse = (err, requestType) => {
    if (process.env.NODE_ENV !== 'test') {
        console.error(`Error occurred on ${requestType ?? 'request'}:`, {
            message: err.message,
            code: err.code,
            name: err.name,
        });
    }

    const status = err.isConnectionError ? 503 : 500;
    const reason =
        process.env.NODE_ENV !== 'production'
            ? err.message
            : 'An unexpected error occurred. Please try again later.';

    return { status, error: 'Internal Server Error', reason };
};

module.exports = formatErrorResponse;
