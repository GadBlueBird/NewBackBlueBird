// src/middleware/multerMemory.js
import multer from "multer";

const memoryStorage = multer.memoryStorage();

export const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // مثلاً حد 5MB لكل ملف — غيّره حسب حاجتك
    files: 10, // حد لعدد الملفات
  },
});
