const AuditLog = require("../models/AuditLog.model");

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("performedBy", "name email role")
      .populate("relatedId")
      .sort({ createdAt: -1 });

    return res.status(200).json({ logs });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = getAuditLogs;
