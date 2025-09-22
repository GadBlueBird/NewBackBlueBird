// src/api/index.js  (local dev server)
import dotenv from "dotenv";
dotenv.config();

import app from "../app.js"; // ملف يعيد الـ express app
import connectDB from "../config/db.js";

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection error:", err);
    process.exit(1);
  });
