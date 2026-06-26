const PurchaseOrder = require("../models/PurchaseOrder.model");
const Vendor = require("../models/Vendor.model");

const getAllPOs = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ userId: req.user.id });
      if (!vendor) {
        return res.status(200).json({ purchaseOrders: [] });
      }
      query.vendorId = vendor._id;
    }

    const purchaseOrders = await PurchaseOrder.find(query)
      .populate("rfqId", "rfqNumber category")
      .populate("vendorId", "companyName contactPerson")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ purchaseOrders });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getPOById = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate("rfqId", "rfqNumber category deadline")
      .populate("vendorId", "companyName contactPerson phone address bankDetails")
      .populate("createdBy", "name email");

    if (!po) {
      return res.status(404).json({ message: "Purchase Order not found" });
    }

    // Access control
    if (req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ userId: req.user.id });
      if (!vendor || po.vendorId._id.toString() !== vendor._id.toString()) {
        return res.status(403).json({ message: "Access Denied" });
      }
    }

    return res.status(200).json({ po });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updatePOStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) {
      return res.status(404).json({ message: "Purchase Order not found" });
    }

    const currentStatus = po.status;
    const role = req.user.role;

    // Validate state transition rules
    let valid = false;
    if (currentStatus === "draft" && status === "sent" && ["officer", "admin"].includes(role)) {
      valid = true;
    } else if (currentStatus === "sent" && status === "confirmed" && role === "vendor") {
      // Ensure vendor belongs to the PO
      const vendor = await Vendor.findOne({ userId: req.user.id });
      if (vendor && po.vendorId.toString() === vendor._id.toString()) {
        valid = true;
      }
    } else if (currentStatus === "confirmed" && status === "delivered" && ["officer", "admin"].includes(role)) {
      valid = true;
    }

    if (!valid) {
      return res.status(400).json({ message: "Invalid status transition or role permissions" });
    }

    po.status = status;
    await po.save();

    return res.status(200).json({ message: `Purchase Order updated to ${status}`, po });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getAllPOs,
  getPOById,
  updatePOStatus,
};
