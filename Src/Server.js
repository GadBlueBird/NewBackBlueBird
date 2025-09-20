// src/server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import driversRouter from "./routes/drivers.js";
import commentRoutes from "./routes/commentRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files statically (if you pre-build them)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/drivers", driversRouter);
app.use("/api/comments", commentRoutes);

// *** لا تضع app.listen هنا في سيرفرلس ***
export default app;
