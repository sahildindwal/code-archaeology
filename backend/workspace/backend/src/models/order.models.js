import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    deliveryService: {
      type: String,
      trim: true, // Amazon, Flipkart, Meesho etc
    },

    trackingId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    deliveryOtp: {
      type: String,
      required: true,
    },

    tokenNumber: {
      type: Schema.Types.ObjectId,
      ref: "Token",
    },

    verifiedByGuard: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["pending", "arrived", "verified", "token_assigned", "collected", "cancelled"],
      default: "pending",
    },

    arrivalDate: {
      type: Date,
    },

    collectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export const Order = mongoose.model("Order", orderSchema);
