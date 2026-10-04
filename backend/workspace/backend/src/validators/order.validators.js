import { body } from "express-validator";

const orderValidator = () => {
  return [
    body("deliveryService")
      .trim()
      .notEmpty()
      .withMessage("Delivery service is required"),

    body("trackingId").trim().notEmpty().withMessage("Tracking ID is required"),

    body("deliveryOtp")
      .trim()
      .notEmpty()
      .withMessage("Delivery OTP is required"),
  ];
};

export { orderValidator };
