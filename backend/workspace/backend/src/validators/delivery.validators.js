import { body } from "express-validator";

const deliveryVerificationValidator = () => {
  return [
    body("trackingId").trim().notEmpty().withMessage("Tracking ID is required"),

    body("otp").trim().notEmpty().withMessage("OTP is required"),
  ];
};

export { deliveryVerificationValidator };
