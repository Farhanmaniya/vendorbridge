const mongoose = require("mongoose");

const poItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  pricePerUnit: { type: Number, required: true },
  totalPrice: { type: Number, required: true }
}, { _id: false });

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      unique: true,
    },
    rfqId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RFQ",
      required: true,
    },
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    items: [poItemSchema],
    grandTotal: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "sent", "confirmed", "delivered"],
      default: "draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

purchaseOrderSchema.pre("save", async function () {
  if (!this.isNew) return;
  const count = await mongoose.model("PurchaseOrder").countDocuments();
  this.poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;
});

const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
module.exports = PurchaseOrder;
