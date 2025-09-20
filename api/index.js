// api/index.js
import serverless from "serverless-http";
import app from "./src/server.js";
import connectDB from "./src/config/db.js";

// نوصّل القاعدة مرة واحدة قبل تشغيل الهاندلر
await connectDB();

export const handler = serverless(app);
