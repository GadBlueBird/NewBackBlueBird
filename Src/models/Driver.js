import mongoose from "mongoose";

const HostSchema = new mongoose.Schema({
  id: String,
  name: String,
  phone: String,
  isSupervisor: Boolean
});

const WaypointSchema = new mongoose.Schema({
  id: String,
  name: String,
  arrivalTime: String,
  hosts: [HostSchema]
});

const RouteSchema = new mongoose.Schema({
  startPoint: String,
  endPoint: String,
  waypoints: [WaypointSchema]
});

const ShiftSchema = new mongoose.Schema({
  company: String,
  startTime: String,
  endTime: String,
  route: RouteSchema
});

const DriverSchema = new mongoose.Schema({
  name: String,
  phone: String,
  governorate: String,
  area: String,
  streetAddress: String,
  accountNumber: String,
  bankName: String,
  accountHolder: String,
  iban: String,
  carType: String,
  carNumber: String,
  hasAC: String,
  shiftType: String,
  licenseExpiryDate: String,
  isWorking: String,
  company: String,
  startTime: String,
  endTime: String,
  isRented: Boolean,
  carOwnerName: String,
  carOwnerPhone: String,
  route: RouteSchema,
  additionalShifts: [ShiftSchema],

  // ملفات (نخزن مسارات الرفع)
  personalImageUrl: String,
  personalLicenseUrls: [String], // تغيير إلى مصفوفة
  carLicenseUrls: [String],      // تغيير إلى مصفوفة
  idCardUrls: [String],          // تغيير إلى مصفوفة
  carImagesUrls: [String],
}, { timestamps: true });

export default mongoose.model("Driver", DriverSchema);