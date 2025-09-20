// مثال مبسّط للـ connection caching
import mongoose from "mongoose";

let cached = global._mongo; 
if (!cached) cached = global._mongo = { conn: null, promise: null };

export default async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, { /* options */ })
      .then((m) => (cached.conn = m));
  }
  return cached.promise;
}
