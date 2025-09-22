// src/middleware/upload.js
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { uploadBufferToCloudinary } from "./cloudinaryUpload.js"; // تأكد من المسار
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// local uploads root (dev only)
const UPLOAD_ROOT = path.join(__dirname, "../uploads");
const ensureFolder = (folder) => {
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
};
["personal", "licenses", "id_cards", "car_images", "others"].forEach((d) =>
  ensureFolder(path.join(UPLOAD_ROOT, d))
);

// diskStorage (dev only)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "others";
    if (file.fieldname === "personalImage") folder = "personal";
    else if (file.fieldname === "personalLicense" || file.fieldname === "carLicense") folder = "licenses";
    else if (file.fieldname === "idCard") folder = "id_cards";
    else if (file.fieldname === "carImage") folder = "car_images";

    cb(null, path.join(UPLOAD_ROOT, folder));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// memoryStorage (production)
const memoryStorage = multer.memoryStorage();

// Choose storage depending on env
const useLocal = process.env.NODE_ENV === "development" || process.env.USE_LOCAL_UPLOAD === "true";
const uploadMiddleware = multer({
  storage: useLocal ? diskStorage : memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB لكل ملف (غيّر حسب حاجتك)
    files: 40, // حد إجمالي
  },
});

// Export middleware + helper to push to cloud if memory mode
export { uploadMiddleware as upload };

// Helper: in case of memory mode, upload buffers to Cloudinary and return map of results
export async function handleUploadsAndUploadToCloudinary(filesArray, options = {}) {
  // filesArray: مصفوفة من ملفات multer (ex: req.files['personalImage'] أو flatten req.files)
  // نُسَيِّس النتيجة لواجهة مبسطة: [{ fieldname, originalname, url, result }]
  const files = Array.isArray(filesArray) ? filesArray : [];
  const results = await Promise.all(
    files.map(async (file) => {
      if (!file || !file.buffer) return null;
      const res = await uploadBufferToCloudinary(file.buffer, {
        folder: options.folder || "bluebird_uploads",
        resource_type: "auto",
      });
      return {
        fieldname: file.fieldname,
        originalname: file.originalname,
        url: res.secure_url,
        raw: res,
      };
    })
  );
  return results.filter(Boolean);
}
