const User = require("../models/User.model");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const logAction = require('../utils/createAuditLog');

const createUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!["officer", "manager", "vendor"].includes(role)) {
      return res.status(400).json({ message: "This Role is not Allowed" });
    }

    const isExisting = await User.findOne({ email: email });
    if (isExisting) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const tempPassword = crypto.randomBytes(8).toString("hex");
    const user = await User.create({
      name: name,
      email: email,
      role: role,
      password: tempPassword,
      mustChangePassword: true,
    });

    await sendEmail(
      user.email,
      "Welcome to VendorBridge",
      `Your temporary password is: ${tempPassword}. Please change it after logging in.`,
    );
    return res.status(201).json({ message: "User Created Successfully", user });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ["officer", "manager"] } });

    return res.status(200).json({ staff });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getUserById = async (req, res) => {
  try {
    const id = req.params.id;

    const user = await User.findById(id);
    if (!user || !["officer", "manager"].includes(user.role)) {
      return res.status(404).json({ message: "User Not Found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const id = req.params.id;
    const newRole = req.body.role;

    if (!["officer", "manager"].includes(newRole)) {
      return res.status(400).json({ message: "The Role is Not Allowed" });
    }

    const user = await User.findById(id);
    if (!user || !["officer", "manager"].includes(user.role)) {
      return res.status(404).json({ message: "User Not Found" });
    }
    const oldUserValue = user.role;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role: newRole },
      { new: true },
    );

    try {
      await logAction({
        performedBy: req.user._id,
        performedByRole: req.user.role,
        action: "User Role Changed",
        oldValue: oldUserValue,
        newValue: updatedUser.role,
        relatedId: user._id,
        relatedModel: 'User',
      });
    } catch (logError) {
      console.error('AuditLog Failed', logError.message);
    }
    return res.status(200).json({ updatedUser });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);

    if (!user || !["officer", "manager", "vendor"].includes(user.role)) {
      return res.status(404).json({ message: "User Not Found" });
    }
    const oldStatus = user.isActive == true ? 'Active' : 'InActive'

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isActive: !user.isActive },
      { new: true },
    );

    try {
      await logAction({
        performedBy: req.user._id,
        performedByRole: req.user.role,
        action: "User Status Changed",
        oldValue: oldStatus,
        newValue: updatedUser.isActive == true ? 'Active' : 'InActive',
        relatedId: user._id,
        relatedModel: 'User',
      });
    } catch (logError) {
      console.error('AuditLog Failed', logError.message);
    }
    return res.status(200).json({ updatedUser });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
};
