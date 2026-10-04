import { ApiError } from "../utils/api-error.js";

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    error = new ApiError(
      err.statusCode || 500,
      err.message || "Internal Server Error",
      err.errors || [],
      err.stack,
    );
  }

  const response = {
    success: false,
    message: error.message,
    errors: error.errors,
  };

  if (process.env.NODE_ENV === "development") {
    response.stack = error.stack;
  }

  return res.status(error.statusCode).json(response);
};

export { errorHandler };
