const AuditLog = require("../models/AuditLog.model");

const logAction = async ({
  performedBy,
  performedByRole,
  action,
  oldValue,
  newValue,
  relatedId,
  relatedModel,
}) => {
  await AuditLog.create({
    performedBy,
    performedByRole,
    action,
    oldValue,
    newValue,
    relatedId,
    relatedModel,
  });
};

module.exports = logAction;
