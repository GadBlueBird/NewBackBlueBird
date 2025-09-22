// src/routes/uploadRoute.js
import express from "express";
import { upload } from "../middleware/multerMemory.js";
import { uploadBufferToCloudinary } from "../middleware/cloudinaryUpload.js";

const router = express.Router();

router.post("/single", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    // خيارات Cloudinary اختياريّة (folder, transformation, public_id, ...)
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "bluebird_uploads",
      resource_type: "auto",
    });

    // result.secure_url يحتوي الرابط النهائي
    return res.status(201).json({ url: result.secure_url, result });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
