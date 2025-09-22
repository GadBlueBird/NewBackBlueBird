// src/routes/drivers.js
import express from "express";
import path from "path";
import fs from "fs";
import Driver from "../models/Driver.js";
import { fileURLToPath } from "url";
import { upload, handleUploadsAndUploadToCloudinary } from "../middleware/upload.js"; // named imports
import { v2 as cloudinary } from "cloudinary"; // for deletion (optional)
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// helper
const safeParseJSON = (jsonString, defaultValue = undefined) => {
  try {
    return jsonString ? JSON.parse(jsonString) : defaultValue;
  } catch (e) {
    console.error("JSON parse error:", e);
    return defaultValue;
  }
};

const cpUpload = upload.fields([
  { name: "personalImage", maxCount: 1 },
  { name: "personalLicense", maxCount: 10 },
  { name: "carLicense", maxCount: 10 },
  { name: "idCard", maxCount: 10 },
  { name: "carImage", maxCount: 10 },
]);

// POST create driver
router.post("/", cpUpload, async (req, res) => {
  try {
    const body = req.body;
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    const useLocal =
      process.env.NODE_ENV === "development" || process.env.USE_LOCAL_UPLOAD === "true";

    // helpers to build local URLs (unchanged)
    const getFileUrlLocal = (fileArr) => {
      if (!fileArr || !fileArr[0]) return null;
      const rel = path
        .relative(path.join(__dirname, ".."), fileArr[0].path)
        .replace(/\\/g, "/");
      return `${baseUrl}/${rel}`;
    };
    const getMultiUrlsLocal = (fileArr) => {
      if (!fileArr) return [];
      return fileArr.map((f) => {
        const rel = path.relative(path.join(__dirname, ".."), f.path).replace(/\\/g, "/");
        return `${baseUrl}/${rel}`;
      });
    };

    // default values
    let personalImageUrl = null;
    let personalImagePublicId = null;
    let personalLicenseUrls = [];
    let personalLicensePublicIds = [];
    let carLicenseUrls = [];
    let carLicensePublicIds = [];
    let idCardUrls = [];
    let idCardPublicIds = [];
    let carImagesUrls = [];
    let carImagesPublicIds = [];

    if (useLocal) {
      // files were stored on disk
      personalImageUrl = req.files?.personalImage ? getFileUrlLocal(req.files.personalImage) : null;
      personalLicenseUrls = req.files?.personalLicense ? getMultiUrlsLocal(req.files.personalLicense) : [];
      carLicenseUrls = req.files?.carLicense ? getMultiUrlsLocal(req.files.carLicense) : [];
      idCardUrls = req.files?.idCard ? getMultiUrlsLocal(req.files.idCard) : [];
      carImagesUrls = req.files?.carImage ? getMultiUrlsLocal(req.files.carImage) : [];
    } else {
      // production: files are in memory => upload to Cloudinary
      const allFiles = [];
      Object.values(req.files || {}).forEach((arr) => arr.forEach((f) => allFiles.push(f)));

      if (allFiles.length) {
        const results = await handleUploadsAndUploadToCloudinary(allFiles, {
          folder: "bluebird_uploads",
        });
        // results: [{ fieldname, originalname, url, raw }]
        const byField = {};
        results.forEach((r) => {
          if (!byField[r.fieldname]) byField[r.fieldname] = [];
          byField[r.fieldname].push(r);
        });

        if (byField.personalImage && byField.personalImage[0]) {
          personalImageUrl = byField.personalImage[0].url;
          personalImagePublicId = byField.personalImage[0].raw?.public_id || null;
        }
        if (byField.personalLicense) {
          personalLicenseUrls = byField.personalLicense.map((x) => x.url);
          personalLicensePublicIds = byField.personalLicense.map((x) => x.raw?.public_id || null);
        }
        if (byField.carLicense) {
          carLicenseUrls = byField.carLicense.map((x) => x.url);
          carLicensePublicIds = byField.carLicense.map((x) => x.raw?.public_id || null);
        }
        if (byField.idCard) {
          idCardUrls = byField.idCard.map((x) => x.url);
          idCardPublicIds = byField.idCard.map((x) => x.raw?.public_id || null);
        }
        if (byField.carImage) {
          carImagesUrls = byField.carImage.map((x) => x.url);
          carImagesPublicIds = byField.carImage.map((x) => x.raw?.public_id || null);
        }
      }
    }

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

      // urls
      personalImageUrl,
      personalLicenseUrls,
      carLicenseUrls,
      idCardUrls,
      carImagesUrls,

      // optional: store public ids to allow cloud deletion later
      personalImagePublicId,
      personalLicensePublicIds,
      carLicensePublicIds,
      idCardPublicIds,
      carImagesPublicIds,
    };

    const driver = new Driver(driverData);
    await driver.save();
    res.status(201).json({ success: true, driver });
  } catch (err) {
    console.error("Error creating driver:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE route: handle both local & cloud files
router.delete("/:id", async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ success: false, message: "السائق غير موجود" });

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const useLocal = process.env.NODE_ENV === "development" || process.env.USE_LOCAL_UPLOAD === "true";

    const deleteLocalFile = async (fileUrl) => {
      if (!fileUrl) return;
      try {
        const filePath = fileUrl.replace(baseUrl + "/", "");
        const fullPath = path.join(__dirname, "..", filePath);
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
          console.log(`تم حذف الملف محليًا: ${fullPath}`);
        }
      } catch (error) {
        console.error("فشل حذف ملف محلي:", error);
      }
    };

    const deleteCloudFile = async (publicId) => {
      if (!publicId) return;
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
        console.log(`تم حذف الملف من Cloudinary: ${publicId}`);
      } catch (error) {
        console.error("فشل حذف ملف من Cloudinary:", error);
      }
    };

    // delete single and arrays accordingly
    if (useLocal) {
      await deleteLocalFile(driver.personalImageUrl);
      for (const url of driver.personalLicenseUrls || []) await deleteLocalFile(url);
      for (const url of driver.carLicenseUrls || []) await deleteLocalFile(url);
      for (const url of driver.idCardUrls || []) await deleteLocalFile(url);
      for (const url of driver.carImagesUrls || []) await deleteLocalFile(url);
    } else {
      // prefer deleting by public_id if stored
      if (driver.personalImagePublicId) await deleteCloudFile(driver.personalImagePublicId);
      for (const id of driver.personalLicensePublicIds || []) await deleteCloudFile(id);
      for (const id of driver.carLicensePublicIds || []) await deleteCloudFile(id);
      for (const id of driver.idCardPublicIds || []) await deleteCloudFile(id);
      for (const id of driver.carImagesPublicIds || []) await deleteCloudFile(id);
    }

    await Driver.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "تم حذف السائق وكل ملفاته بنجاح" });
  } catch (err) {
    console.error("Error deleting driver:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
