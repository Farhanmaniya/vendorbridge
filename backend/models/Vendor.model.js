const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
);

const bankDetailsSchema = new mongoose.Schema(
  {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String, default: "India" },
  },
  { _id: false },
);

const addressSchema = new mongoose.Schema(
  {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String, default: "India" },
  },
  {
    _id: false,
  },
);

const vendorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  companyName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  contactPerson: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: addressSchema,
  gstin: {
    type: String,
    uppercase: true,
    trim: true,
    index: true,
  },
  panNumber: {
    type: String,
    uppercase: true,
    trim: true,
    index: true,
  },
  category: {
    type: String,
    enum: ['IT', 'Office Supplies', 'Logistics', 'Manufacturing', 'Services', 'Other'],
    trim: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive", "blacklisted"],
    default: "active",
  },
  bankDetails: bankDetailsSchema,
  documents: [documentSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
},
    { timestamps: true}
);

const Vendor = mongoose.Schema("Vendor", vendorSchema);
module.exports = Vendor;