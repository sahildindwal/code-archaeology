import { Router } from "express";

import {
  markDeliveryArrived,
  confirmDeliveryPickup,
} from "../controllers/delivery.controllers.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

import { validate } from "../middlewares/validator.middleware.js";

import { deliveryVerificationValidator } from "../validators/index.js";

const router = Router();

// Mark delivery arrived at campus gate 
router
  .route("/arrived")
  .post(
    verifyJWT,
    deliveryVerificationValidator(),
    validate,
    markDeliveryArrived,
  );

// Confirm student pickup 
router.route("/pickup").post(verifyJWT, confirmDeliveryPickup);

export default router;
