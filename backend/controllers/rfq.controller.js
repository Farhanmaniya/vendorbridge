const Vendor = require("../models/Vendor.model");
const RFQ = require("../models/RFQ.model");
const User = require("../models/User.model");
const Notification = require("../models/Notification.model");

const validTransitions = {
  draft: {
    allowedNext: "published",
    allowedRoles: ["manager"],
  },
  published: {
    allowedNext: "closed",
    allowedRoles: ["officer"],
  },
  closed: {
    allowedNext: "awarded",
    allowedRoles: ["manager"],
  },
};

// POST / -> officer
const createRFQ = async (req, res) => {
  try {
    const { items, budget, deadline, category, vendors } = req.body;
    const createdBy = req.user._id;

    if (
      !items ||
      !deadline ||
      !category ||
      !vendors ||
      items.length === 0 ||
      vendors.length === 0
    ) {
      return res.status(400).json({ message: "Fields are missing " });
    }

    const createdRFQ = await RFQ.create({
      items: items,
      budget: budget,
      deadline: deadline,
      category: category,
      vendors: vendors,
      createdBy: createdBy,
    });

    return res
      .status(201)
      .json({ message: "RFQ Created Successfully.", createdRFQ });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// GET / -> admin, officer, manager
const getAllRFQs = async (req, res) => {
  try {
    const allRFQs = await RFQ.find()
      .populate("createdBy", " name email")
      .populate(
        "vendors.vendor",
        "userId companyName contactPerson phone address",
      );

    return res.status(200).json({ allRFQs });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// GET /:id -> admin, manager, officer and vendor who invites
const getRFQById = async (req, res) => {
  try {
    // populate createdBy and vendor details for frontend display
    const rfqs = await RFQ.findById(req.params.id)
      .populate("createdBy", " name email")
      .populate(
        "vendors.vendor",
        "userId companyName contactPerson phone address",
      );

    // Validating that RFQ is in database or not
    if (!rfqs) {
      return res.status(404).json({ message: "RFQ not found" });
    }

    // check for vendor roles that allowed to view RFQ or not
    if (req.user.role === "vendor") {
      // this checked vendors is allowed or not
      const isAllowed = rfqs.vendors.some(
        (v) => v.vendor.toString() === req.user._id.toString(),
      );
      if (!isAllowed) {
        return res.status(403).json({ message: "Access Denied" });
      }
    }

    // Successfully fetched to RFQs
    return res.status(200).json({ message: "Fetched Successfully", rfqs });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateRFQStatus = async (req, res) => {
  try {
    const role = req.user.role;
    const id = req.params.id;

    const rfq = await RFQ.findById(id);
    if (!rfq) {
      return res.status(404).json({ message: "RFQ not found" });
    }

    const newStatus = req.body.status;
    const currentStatus = rfq.status;
    if (newStatus === "cancelled") {
      if (!["manager", "officer"].includes(role)) {
        return res.status(403).json({ message: "Access Denied" });
      }
    } else {
      if (validTransitions[currentStatus].allowedNext !== newStatus) {
        return res.status(400).json({ message: "Invalid transition" });
      }
      if (!validTransitions[currentStatus].allowedRoles.includes(role)) {
        return res.status(403).json({ message: "Access Denied" });
      }
    }
    const updatedRFQ = await RFQ.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true },
    );

    if (newStatus === "published") {
      const vendorIds = rfq.vendors.map((v) => v.vendor);
      const vendors = await Vendor.find({ _id: { $in: vendorIds } });

      const notifications = vendors.map((vendor) => ({
        userId: vendor.userId,
        type: "rfq_published",
        message: `RFQ ${rfq.rfqNumber} has been published`,
        relatedId: rfq._id,
        relatedModel: "RFQ",
      }));

      await Notification.insertMany(notifications);
    }
    if (newStatus === "closed") {
      const staff = await User.find({ role: { $in: ["officer", "manager"] } });

      const notifications = staff.map((s) => ({
        userId: s._id,
        type: "rfq_closed",
        message: `RFQ ${rfq.rfqNumber} has been closed`,
        relatedId: rfq._id,
        relatedModel: "RFQ",
      }));

      await Notification.insertMany(notifications);
    }

    if (newStatus === "cancelled") {
      const staff = await User.find({ role: { $in: ["officer", "manager"] } });

      const staffNotifications = staff.map((s) => ({
        userId: s._id,
        type: "rfq_cancelled",
        message: `RFQ ${rfq.rfqNumber} has been cancelled`,
        relatedId: rfq._id,
        relatedModel: "RFQ",
      }));

      await Notification.insertMany(staffNotifications);

      if (currentStatus === "published") {
        const vendorIds = rfq.vendors.map((v) => v.vendor);
        const vendors = await Vendor.find({ _id: { $in: vendorIds } });

        const notificationsVendor = vendors.map((vendor) => ({
          userId: vendor.userId,
          type: "rfq_cancelled",
          message: `RFQ ${rfq.rfqNumber} has been cancelled`,
          relatedId: rfq._id,
          relatedModel: "RFQ",
        }));

        await Notification.insertMany(notificationsVendor);
      }
    }
    return res.status(200).json({ message: "Status changed", updatedRFQ });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateRFQ = async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) {
      return res.status(404).json({ message: "RFQ Not Found" });
    }

    if (rfq.status !== "draft") {
      return res
        .status(400)
        .json({ message: "Status is not draft Not allowed to change" });
    }

    const { items, vendors, budget, deadline, category } = req.body;

    if (deadline) rfq.deadline = deadline;
    if (category) rfq.category = category;
    if (budget) rfq.budget = budget;
    if (items) rfq.items = items;
    if (vendors) rfq.vendors = vendors;

    const updatedRFQ = await rfq.save();

    return res
      .status(200)
      .json({ message: "RFQ updated Successfully", updatedRFQ });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createRFQ,
  getAllRFQs,
  getRFQById,
  updateRFQStatus,
  updateRFQ,
};
