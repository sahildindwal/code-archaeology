import { body } from "express-validator";

const tokenValidator = () => {
  return [body("orderId").notEmpty().withMessage("Order ID is required")];
};

export { tokenValidator };
