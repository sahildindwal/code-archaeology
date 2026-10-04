import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//Basic configuration
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());


// cors configurations
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// import the routes

import healthcheckRouter from "./routes/healthcheck.routes.js";

import authRouter from "./routes/auth.routes.js";
import orderRoutes from "./routes/order.routes.js";
import guardRoutes from "./routes/guard.routes.js";
import tokenRoutes from "./routes/token.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";

import { errorHandler } from "./middlewares/error.middleware.js";




app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/guard", guardRoutes);
app.use("/api/v1/token", tokenRoutes);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/delivery", deliveryRoutes);
app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("Welcome to basecampy!!");
});

// Error-handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: message,
  });
});


export default app;
