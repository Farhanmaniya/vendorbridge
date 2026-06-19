const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
});

const vendorStatusSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
  },
  status: {
    type: String,
    enum: ["invited", "submitted", "declined"],
    default: "invited",
  },
});

const rfqSchema = new mongoose.Schema({
  rfqNumber: {
    type: String,
    unique: true,
  },

  budget: {
    type: Number,
  },

  deadline: {
    type: Date,
    required: true,
  },

  status: {
    type: String,
    enum: ["draft", "published", "closed", "awarded", "cancelled"],
    default: "draft",
  },

  category: {
    type: String,
    enum: [
      "IT",
      "Office Supplies",
      "Logistics",
      "Manufacturing",
      "Services",
      "Other",
    ],
    trim: true,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  vendors: [vendorStatusSchema],
  items: [itemSchema],
}, {
    timestamps: true,
});

rfqSchema.pre('save', async function() {
    if(!this.isNew) return;
    const totalDoc = await RFQ.countDocuments() + 1;
    this.rfqNumber = `RFQ-${new Date().getFullYear()}-${String(totalDoc).padStart(3, '0')}`;
});

const RFQ = mongoose.model("RFQ", rfqSchema);
module.exports = RFQ;