import mongoose, { Schema } from "mongoose";

const deliveryVerificationSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    verifiedByGuard: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    trackingLastFourDigits: {
      type: String,
      required: true,
    },

    otpUsed: {
      type: String,
      required: true,
    },

    verificationStatus: {
      type: String,
      enum: ["verified", "failed"],
      default: "verified",
    },

    verificationTime: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export const DeliveryVerification = mongoose.model(
  "DeliveryVerification",
  deliveryVerificationSchema,
);
