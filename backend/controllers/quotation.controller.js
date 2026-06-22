const mongoose = require("mongoose");
const Quotation = require("../models/Quotation.model");
const Vendor = require("../models/Vendor.model");
const RFQ = require("../models/RFQ.model");
const Notification = require("../models/Notification.model");

const validTransitions = {
  submitted: { allowedNext: ["reviewed"], allowedRoles: ["officer"] },
  reviewed: {
    allowedNext: ["accepted", "rejected"],
    allowedRoles: ["manager"],
  },
};

const createOrUpdateQuotation = async (req, res) => {
  try {
    const { rfqId, items, deliveryDays, paymentTerms } = req.body;

    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor Not Found" });
    }

    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      return res.status(404).json({ message: "RFQ Not Found" });
    }

    if (rfq.status !== "published") {
      return res.status(400).json({ message: "RFQ is not accessible anymore" });
    }

    const isValid = rfq.vendors.some(
      (v) =>
        v.vendor.toString() === vendor._id.toString() && v.status === "invited",
    );
    if (!isValid) {
      return res.status(403).json({ message: "Access denied" });
    }

    const newItems = items.map((reqItem) => {
      const matchedItem = rfq.items.find(
        (item) => item._id.toString() === reqItem.itemId.toString(),
      );

      if (!matchedItem) {
        throw new Error("Invalid itemId - does not belong to this RFQ");
      }

      const totalPrice = reqItem.pricePerUnit * matchedItem.quantity;

      return {
        itemId: reqItem.itemId,
        pricePerUnit: reqItem.pricePerUnit,
        totalPrice: totalPrice,
      };
    });

    const grandTotal = newItems.reduce((acc, item) => acc + item.totalPrice, 0);

    const existing = await Quotation.findOne({ rfqId, vendorId: vendor._id });

    const quotationData = {
      items: newItems,
      deliveryDays: deliveryDays,
      paymentTerms: paymentTerms,
      grandTotal: grandTotal,
      rfqId: rfqId,
      vendorId: vendor._id,
    };

    if (existing) {
      const updatedQuotation = await Quotation.findByIdAndUpdate(
        existing._id,
        quotationData,
        { new: true },
      );
      return res
        .status(200)
        .json({ message: "Quotation updated Successfully", updatedQuotation });
    } else {
      const createdQuotation = await Quotation.create(quotationData);
      return res.status(201).json({
        message: "Quotation Created Successfully",
        createdQuotation,
      });
    }
  } catch (error) {
    const message = error.statusCode ? error.message : "Internal Server Error";
    return res.status(error.statusCode || 500).json({ message });
  }
};

const getQuotationById = async (req, res) => {
  try {
    const id = req.params.id;

    const quotation = await Quotation.findById(id)
      .populate("rfqId", "rfqNumber budget deadline status category createdBy")
      .populate("vendorId", "companyName contactPerson");
    if (!quotation) {
      return res.status(404).json({ message: "Quotation Not Found" });
    }

    if (req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ userId: req.user._id });
      if (!vendor) {
        return res.status(404).json({ message: "Vendor Not Found" });
      }
      if (quotation.vendorId._id.toString() !== vendor._id.toString()) {
        return res.status(403).json({ message: "Access Denied" });
      }
    }

    return res
      .status(200)
      .json({ message: "Quotation Fetched Successfully", quotation });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getQuotationsByRFQ = async (req, res) => {
  try {
    const rfqId = req.params.rfqId;
    const quotations = await Quotation.find({ rfqId: rfqId })
      .populate("rfqId", "budget status category createdBy")
      .populate("vendorId", "companyName contactPerson");

    if (quotations.length === 0) {
      return res.status(404).json({ message: "Quotation Not Found" });
    }

    return res
      .status(200)
      .json({ message: "Quotation Fetched Successfully", quotations });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateQuotationStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const newStatus = req.body.status;

    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation Not Found" });
    }

    const transition = validTransitions[quotation.status];
    if (!transition) {
      return res.status(400).json({ message: "No Further transition Allowed" });
    }

    if (!transition.allowedNext.includes(newStatus)) {
      return res.status(400).json({ message: "Invalid Transition" });
    }

    if (!transition.allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access Denied" });
    }

    if (newStatus === "accepted") {
      // fetch the other (losing) quotations for this RFQ
      const rejectedQuotations = await Quotation.find({
        rfqId: quotation.rfqId,
        _id: { $ne: id },
      });

      // get Vendor docs for losing vendors (to access their userId)
      const vendorIds = rejectedQuotations.map((q) => q.vendorId);
      const vendors = await Vendor.find({ _id: { $in: vendorIds } });

      // get Vendor doc for the winning vendor (to access their userId)
      const winningVendor = await Vendor.findById(quotation.vendorId);

      // update RFQ status, capture result so we can use rfqNumber in messages
      const updatedRFQ = await RFQ.findByIdAndUpdate(
        quotation.rfqId,
        { status: "awarded" },
        { new: true },
      );

      // build rejected notifications, matching each quotation to its vendor
      const notificationsRejected = rejectedQuotations.map((q) => {
        const matchedVendor = vendors.find(
          (v) => v._id.toString() === q.vendorId.toString(),
        );
        return {
          userId: matchedVendor.userId,
          type: "quotation_rejected",
          message: `Your quotation for RFQ ${updatedRFQ.rfqNumber} has been rejected`,
          relatedId: q._id,
          relatedModel: "Quotation",
        };
      });

      // build the single accepted notification
      const notificationAccepted = {
        userId: winningVendor.userId,
        type: "quotation_accepted",
        message: `Your quotation for RFQ ${updatedRFQ.rfqNumber} has been accepted`,
        relatedId: quotation._id,
        relatedModel: "Quotation",
      };

      // actually reject the other quotations in the database
      await Quotation.updateMany(
        { rfqId: quotation.rfqId, _id: { $ne: id } },
        { status: "rejected" },
      );

      // save this quotation as accepted
      quotation.status = "accepted";
      await quotation.save();

      // send all notifications in one call
      await Notification.insertMany([
        notificationAccepted,
        ...notificationsRejected,
      ]);

      return res
        .status(200)
        .json({ message: "Successfully Completed", quotation });
    } else {
      quotation.status = newStatus;
      await quotation.save();
      return res
        .status(200)
        .json({ message: "Successfully Completed", quotation });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createOrUpdateQuotation,
  getQuotationById,
  getQuotationsByRFQ,
  updateQuotationStatus,
};
