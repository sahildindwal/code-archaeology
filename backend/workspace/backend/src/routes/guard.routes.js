import { Router } from "express";
import {
  getPendingDeliveries,
  verifyDeliveryArrival,
  handoverParcel,
} from "../controllers/guard.controllers.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyGuard } from "../middlewares/role.middleware.js";

const router = Router();

router.route("/deliveries").get(verifyJWT, verifyGuard, getPendingDeliveries);

router
  .route("/verify-delivery")
  .post(verifyJWT, verifyGuard, verifyDeliveryArrival);

router.route("/handover").post(verifyJWT, verifyGuard, handoverParcel);

export default router;
