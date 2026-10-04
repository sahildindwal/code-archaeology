import mongoose, { Schema } from "mongoose";

const tokenSchema = new Schema(
  {
    tokenNumber: {
      type: Number,
      required: true,
      unique: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    assignedOrder: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },

    assignedByGuard: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    assignedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export const Token = mongoose.model("Token", tokenSchema);
