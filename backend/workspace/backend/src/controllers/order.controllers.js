import { Order } from "../models/order.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

// Create Order 
const createOrder = asyncHandler(async (req, res) => {
  const { deliveryService, trackingId, deliveryOtp } = req.body;

  const order = await Order.create({
    student: req.user._id,
    deliveryService,
    trackingId,
    deliveryOtp,
    status: "pending",
  });

  return res
    .status(201)
    .json(new ApiResponse(201, order, "Order created successfully"));
});

// Get Orders of Student 
const getStudentOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    student: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "Orders fetched successfully"));
});

// Get Single Order 
const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order fetched successfully"));
});

// Update Order
const updateOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { deliveryService, trackingId, deliveryOtp, status } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Update fields if provided
  if (deliveryService) order.deliveryService = deliveryService;
  if (trackingId) order.trackingId = trackingId;
  if (deliveryOtp) order.deliveryOtp = deliveryOtp;
  if (status) order.status = status;

  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order updated successfully"));
});

// Cancel Order 
const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // ❌ Only allow cancellation for pending orders
  if (order.status !== "pending") {
    throw new ApiError(
      400,
      `Cannot cancel order with status: ${order.status}. Only pending orders can be cancelled.`
    );
  }

  order.status = "cancelled";
  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order cancelled successfully"));
});

export { createOrder, getStudentOrders, getOrderById, updateOrder, cancelOrder };
