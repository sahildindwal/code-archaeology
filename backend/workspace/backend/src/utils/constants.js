// ==============================
// User Roles
// ==============================

export const UserRolesEnum = {
  ADMIN: "admin",
  GUARD: "guard",
  STUDENT: "student",
};

export const AvailableUserRoles = Object.values(UserRolesEnum);

// ==============================
// Order Status
// ==============================

export const OrderStatusEnum = {
  PENDING: "pending", // Order created by student
  ARRIVED: "arrived", // Parcel reached campus gate
  VERIFIED: "verified", // Guard verified OTP
  DELIVERED: "delivered", // Parcel handed to student
  CANCELLED: "cancelled",
};

export const AvailableOrderStatuses = Object.values(OrderStatusEnum);

// ==============================
// Token Status
// ==============================

export const TokenStatusEnum = {
  AVAILABLE: "available",
  ASSIGNED: "assigned",
  USED: "used",
};

export const AvailableTokenStatuses = Object.values(TokenStatusEnum);

// ==============================
// Delivery Verification Status
// ==============================

export const VerificationStatusEnum = {
  NOT_VERIFIED: "not_verified",
  OTP_VERIFIED: "otp_verified",
  FAILED: "failed",
};

export const AvailableVerificationStatuses = Object.values(
  VerificationStatusEnum,
);
