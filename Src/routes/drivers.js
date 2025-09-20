import express from "express";
import path from "path";
import fs from "fs";
import Driver from "../models/Driver.js";
import { fileURLToPath } from "url";
import upload from "../middleware/upload.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// وظيفة مساعدة لتحليل JSON بشكل آمن
const safeParseJSON = (jsonString, defaultValue = undefined) => {
  try {
    return jsonString ? JSON.parse(jsonString) : defaultValue;
  } catch (e) {
    console.error("JSON parse error:", e);
    return defaultValue;
  }
};

// استخدام upload
const cpUpload = upload.fields([
  { name: "personalImage", maxCount: 1 },
  { name: "personalLicense", maxCount: 10 },
  { name: "carLicense", maxCount: 10 },
  { name: "idCard", maxCount: 10 },
  { name: "carImage", maxCount: 10 },
]);

// Create driver
router.post("/", cpUpload, async (req, res) => {
  try {
    const body = req.body;
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    const getFileUrl = (fileArr) => {
      if (!fileArr || !fileArr[0]) return null;
      const rel = path.relative(path.join(__dirname, ".."), fileArr[0].path).replace(/\\/g, "/");
      return `${baseUrl}/${rel}`;
    };

    const getMultiUrls = (fileArr) => {
      if (!fileArr) return [];
      return fileArr.map((f) => {
        const rel = path.relative(path.join(__dirname, ".."), f.path).replace(/\\/g, "/");
        return `${baseUrl}/${rel}`;
      });
    };

    const driverData = {
      name: body.name,
      phone: body.phone,
      governorate: body.governorate,
      area: body.area,
      streetAddress: body.streetAddress,
      accountNumber: body.accountNumber,
      bankName: body.bankName,
      accountHolder: body.accountHolder,
      iban: body.iban,
      carType: body.carType,
      carNumber: body.carNumber || "",
      hasAC: body.hasAC,
      shiftType: body.shiftType,
      licenseExpiryDate: body.licenseExpiryDate,
      isWorking: body.isWorking,
      company: body.company,
      startTime: body.startTime,
      endTime: body.endTime,
      isRented: body.isRented === "true",
      carOwnerName: body.carOwnerName || "",
      carOwnerPhone: body.carOwnerPhone || "",
      route: safeParseJSON(body.route),
      additionalShifts: safeParseJSON(body.additionalShifts, []),
      personalImageUrl: req.files?.personalImage ? getFileUrl(req.files.personalImage) : null,
      personalLicenseUrls: req.files?.personalLicense ? getMultiUrls(req.files.personalLicense) : [],
      carLicenseUrls: req.files?.carLicense ? getMultiUrls(req.files.carLicense) : [],
      idCardUrls: req.files?.idCard ? getMultiUrls(req.files.idCard) : [],
      carImagesUrls: req.files?.carImage ? getMultiUrls(req.files.carImage) : [],
    };

    const driver = new Driver(driverData);
    await driver.save();
    res.status(201).json({ success: true, driver });
  } catch (err) {
    console.error("Error creating driver:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all drivers
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const drivers = await Driver.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, drivers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single driver by id
router.get("/:id", async (req, res) => {
  try {
    const d = await Driver.findById(req.params.id);
    if (!d) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, driver: d });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete driver and files
router.delete("/:id", async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ success: false, message: "السائق غير موجود" });
    }

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    const deleteFile = async (fileUrl) => {
      if (!fileUrl) return;
      try {
        const filePath = fileUrl.replace(baseUrl + "/", "");
        const fullPath = path.join(__dirname, "..", filePath);
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
          console.log(`تم حذف الملف: ${filePath}`);
        }
      } catch (error) {
        console.error(`فشل في حذف الملف: ${fileUrl}`, error);
      }
    };

    await deleteFile(driver.personalImageUrl);
    for (const url of driver.personalLicenseUrls) await deleteFile(url);
    for (const url of driver.carLicenseUrls) await deleteFile(url);
    for (const url of driver.idCardUrls) await deleteFile(url);
    for (const url of driver.carImagesUrls) await deleteFile(url);

    await Driver.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "تم حذف السائق وكل ملفاته بنجاح" });
  } catch (err) {
    console.error("Error deleting driver:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
