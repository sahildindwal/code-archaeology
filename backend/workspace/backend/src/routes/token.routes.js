import { Router } from "express";

import {
  generatePickupToken,
  verifyPickupToken,
} from "../controllers/token.controllers.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";

import { tokenValidator } from "../validators/index.js";

const router = Router();

// Generate pickup token for order 
router
  .route("/generate")
  .post(verifyJWT, tokenValidator(), validate, generatePickupToken);

// Verify token at gate 
router.route("/verify").post(verifyJWT, verifyPickupToken);

export default router;
