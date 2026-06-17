const Vendor = require("../models/Vendor.model");
const User = require("../models/User.model");

const createVendor = async (req, res) => {
  try {
    const {
      email,
      companyName,
      contactPerson,
      phone,
      gstin,
      panNumber,
      category,
    } = req.body;

    // Checking required fields is present
    if (!email || !companyName) {
      return res
        .status(400)
        .json({ message: "Email and Company Name is required" });
    }

    // checking duplicate companyname in database
    const companyNameDB = await Vendor.findOne({ companyName });
    if (companyNameDB) {
      return res.status(409).json({ message: "Company Name is already used" });
    }

    // Fetching user from User schema
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Checks for user is not already registered with another company.
    const existingVendor = await Vendor.findOne({ userId: user._id });
    if (existingVendor) {
      return res.status(409).json({ message: "Vendor already registered" });
    }

    const vendor = await Vendor.create({
      companyName,
      contactPerson,
      phone,
      gstin,
      panNumber,
      category,
      userId: user._id,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message: "Vendor created Successfully",
      vendor: vendor,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server error" });
  }
};

const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find()
      .populate("userId", "name email role isActive")
      .populate("createdBy", "name email");

    return res.status(200).json(vendors);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getVendorById = async (req, res) => {
  try {
    // Extract id from req.params
    const id = req.params.id;

    // findById
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found." });
    }

    // check role and access of vendor
    if (req.user.role !== "admin") {
      if (req.user._id.toString() !== vendor.userId.toString()) {
        return res.status(403).json({ message: "Access Not allowed" });
      }
    }

    const vendorDetails = await Vendor.findById(id)
      .populate("userId", "name email isActive")
      .populate("createdBy", "name email");

    return res.status(200).json({
      vendorDetails,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateVendor = async (req, res) => {
  try {
    const allowedFields = [
      "contactPerson",
      "phone",
      "address",
      "bankDetails",
      "gstin",
      "panNumber",
      "category",
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const id = req.params.id;
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (req.user.role !== "admin") {
      if (req.user._id.toString() !== vendor.userId.toString()) {
        return res.status(403).json({ message: "Access Not Allowed" });
      }
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate("userId", "name email")
      .populate("createdBy", "name email");

    return res.status(200).json({ updatedVendor });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error." });
  }
};

const updateVendorStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied" });
    }

    const id = req.params.id;
    const status = req.body.status;

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: "user not found" });
    }

    const updatedStatus = await Vendor.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    return res
      .status(200)
      .json({ message: "Status changed successfully", updatedStatus });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const uploadDocument = async (req, res) => {
  try {
    const id = req.params.id;
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(400).json({ message: "Vendor not found" });
    }

    const { label, url } = req.body;
    if (!label || !url) {
      return res.status(404).json({ message: "Url or Label is missing" });
    }

    const newDoc = { label: label, url: url };
    const updatedDocument = await Vendor.findByIdAndUpdate(
      id,
      { $push: { documents: newDoc } },
      { new: true },
    );

    return res
      .status(201)
      .json({ message: "document Uploaded successfully", updatedDocument });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteDocument = async (req, res) => {
  try {
    // Get Value from params
    const id = req.params.id;
    const docId = req.params.docId;

    // Fetching Vendor from Database based on id
    const vendor = await Vendor.findById(id);

    // if vendor not found in database -> 404
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // check authorization of current vendor is same vendor that to modification to document
    if (req.user._id.toString() !== vendor.userId.toString()) {
      return res.status(403).json({ message: "Access Denied" });
    }

    // to pull (delete) the document from database
    const deletedDocument = await Vendor.findByIdAndUpdate(
      id,
      { $pull: { documents: { _id: docId } } },
      { new: true },
    );

    // return success message and deleted document
    return res
      .status(200)
      .json({ message: "Document Deleted Successfully", deletedDocument });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  updateVendorStatus,
  uploadDocument,
  deleteDocument,
};
