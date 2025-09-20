// api/index.js
import serverless from "serverless-http";
import app from "../Src/Server.js";
import connectDB from "../Src/config/db.js";

// نوصّل القاعدة مرة واحدة قبل تشغيل الهاندلر
await connectDB();

export const handler = serverless(app);
