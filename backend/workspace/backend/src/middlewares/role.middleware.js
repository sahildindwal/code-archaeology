import { ApiError } from "../utils/api-error.js";

// Allow only guards 
const verifyGuard = (req, res, next) => {
  if (req.user.role !== "guard") {
    throw new ApiError(403, "Access denied: Guard only");
  }

  next();
};

// Allow only students 
const verifyStudent = (req, res, next) => {
  if (req.user.role !== "student") {
    throw new ApiError(403, "Access denied: Student only");
  }

  next();
};

// Allow admin 
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied: Admin only");
  }

  next();
};

export { verifyGuard, verifyStudent, verifyAdmin };
