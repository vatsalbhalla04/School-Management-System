function TryCatch(passedFun) { // higher Order Function
  return async (req, res, next) => {
    try {
      await passedFun(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}
function errorMiddleware(err, req, res, next) {
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: `Duplicate entry for field(s): ${err.meta?.target?.join(", ")}`,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    message,
  });
}


export { TryCatch, errorMiddleware };
