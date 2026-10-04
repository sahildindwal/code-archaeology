import { DeliveryVerification } from "../models/delivery.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

// Mark Delivery Arrived
const markDeliveryArrived = asyncHandler(async (req, res) => {
  const { trackingId } = req.body;

  const delivery = await Delivery.create({
    trackingId,
    status: "arrived",
  });

  return res
    .status(201)
    .json(new ApiResponse(201, delivery, "Delivery marked as arrived"));
});

// Confirm Pickup
const confirmDeliveryPickup = asyncHandler(async (req, res) => {
  const { trackingId } = req.body;

  const delivery = await DeliveryVerification.findOne({ trackingId });

  if (!delivery) {
    throw new ApiError(404, "Delivery not found");
  }

  delivery.status = "picked";

  await delivery.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Delivery picked successfully"));
});

export { markDeliveryArrived, confirmDeliveryPickup };
