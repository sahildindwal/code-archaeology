import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js"
import dns from "dns";

dns.setServers(["1.1.1.1","8.8.8.8"]);
dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`app listening on http://0.0.0.0:${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error", err)
    process.exit(1)
  })