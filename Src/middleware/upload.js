import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// الجذر الموحد للرفع
const UPLOAD_ROOT = path.join(__dirname, "../uploads");

// إنشاء الفولدر الأساسي والفروع
const ensureFolder = (folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
};

["personal", "licenses", "id_cards", "car_images", "others"].forEach((d) =>
  ensureFolder(path.join(UPLOAD_ROOT, d))
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "others";

    if (file.fieldname === "personalImage") {
      folder = "personal";
    } else if (file.fieldname === "personalLicense" || file.fieldname === "carLicense") {
      folder = "licenses";
    } else if (file.fieldname === "idCard") {
      folder = "id_cards";
    } else if (file.fieldname === "carImage") {
      folder = "car_images";
    }

    cb(null, path.join(UPLOAD_ROOT, folder));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// السماح بحد أقصى 40 ملف إجمالي
const upload = multer({
  storage,
  limits: {
    fileCount: 40,
  },
});

export default upload;