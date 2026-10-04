import { Token } from "../models/token.models.js";
import { Order } from "../models/order.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import crypto from "crypto";

// Generate Pickup Token 
const generatePickupToken = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const tokenValue = crypto.randomBytes(3).toString("hex");

  const token = await Token.create({
    order: orderId,
    token: tokenValue,
    expiresAt: Date.now() + 15 * 60 * 1000,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, token, "Pickup token generated"));
});

// Verify Token 
const verifyPickupToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const tokenDoc = await Token.findOne({ token });

  if (!tokenDoc) {
    throw new ApiError(404, "Invalid token");
  }

  if (tokenDoc.expiresAt < Date.now()) {
    throw new ApiError(400, "Token expired");
  }

  tokenDoc.isUsed = true;

  await tokenDoc.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Token verified successfully"));
});

export { generatePickupToken, verifyPickupToken };
