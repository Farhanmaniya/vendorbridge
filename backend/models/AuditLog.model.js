const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    performedByRole: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
    oldValue: {
        type: String,
    },
    newValue: {
        type: String,
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'relatedModel',
        required: true,
    },
    relatedModel: {
        type: String,
        enum: ['RFQ', 'Quotation', 'Vendor', 'User'],
        required: true,
    }
}, { timestamps: true});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;