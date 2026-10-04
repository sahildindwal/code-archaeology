import { DeliveryVerification } from "../models/delivery.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { Order } from "../models/order.models.js";

// Get Pending Deliveries
const getPendingDeliveries = asyncHandler(async (req, res) => {
  const deliveries = await Delivery.find({
    status: "pending",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, deliveries, "Pending deliveries fetched"));
});

// Verify Delivery Arrival
const verifyDeliveryArrival = asyncHandler(async (req, res) => {
  const { trackingId, otp } = req.body;

  const order = await Order.findOne({
    trackingId,
    deliveryOtp: otp,
  });

  if (!order) {
    throw new ApiError(404, "Invalid tracking ID or OTP");
  }

  order.status = "arrived";

  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Delivery verified successfully"));
});

// Handover Parcel
const handoverParcel = asyncHandler(async (req, res) => {
  const { trackingId } = req.body;

  const delivery = await DeliveryVerification.findOne({ trackingId });

  if (!delivery) {
    throw new ApiError(404, "Delivery not found");
  }

  delivery.status = "collected";

  await delivery.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Parcel handed over successfully"));
});

export { getPendingDeliveries, verifyDeliveryArrival, handoverParcel };
