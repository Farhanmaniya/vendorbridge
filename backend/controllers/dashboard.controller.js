const mongoose = require("mongoose");
const RFQ = require("../models/RFQ.model");
const Quotation = require("../models/Quotation.model");

const getRFQStatusBreakdown = async (req, res) => {
  try {
    const statusCounts = {
      draft: 0,
      published: 0,
      closed: 0,
      awarded: 0,
      cancelled: 0,
    };

    const result = await RFQ.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    result.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    return res.status(200).json({ statusCounts });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getVendorPerformance = async (req, res) => {
  try {
    const vendorProfile = await Quotation.aggregate([
      {
        $group: {
          _id: "$vendorId",
          totalQuotation: { $sum: 1 },
          acceptedCount: {
            $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "vendors",
          localField: "_id",
          foreignField: "_id",
          as: "vendorInfo",
          pipeline: [
            { $project: { companyName: 1, contactPerson: 1 } }
          ]
        },
      },
      {
        $unwind: "$vendorInfo",
      },
    ]);

    return res.status(200).json({ vendorProfile });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { getRFQStatusBreakdown, getVendorPerformance };
