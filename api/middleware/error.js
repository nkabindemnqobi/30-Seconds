const errorHandler = (error, req, res, next) => {
    console.error(error)
    res.status(error.status || 500).json({
        message: error.message,
        status: error.status || 500,
      });
};

const notFound = (req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
}

module.exports = {
    errorHandler,
    notFound
}