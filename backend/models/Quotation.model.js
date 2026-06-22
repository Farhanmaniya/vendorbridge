const mongoose = require('mongoose');

const itemQuoteSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  pricePerUnit: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
}, {_id: false});

const paymentMilestoneSchema = new mongoose.Schema({
  label: { type: String, required: true },
  percentage: { type: Number, required: true },
}, {_id: false});

const quotationSchema = new mongoose.Schema({
    rfqId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RFQ',
        required: true,
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
    },
    items: [itemQuoteSchema],
    grandTotal: {
        type: Number,
        required: true,
    },
    deliveryDays: {
        type: Number,
    },
    paymentTerms: [paymentMilestoneSchema],
    status: {
        type: String,
        enum: ['submitted', 'reviewed', 'accepted', 'rejected'],
        default: 'submitted',
    }
}, { timestamps: true });


quotationSchema.pre('save', async function() {
    const sum = this.paymentTerms.reduce((acc, val) => acc +val.percentage, 0);
    if (sum !== 100) {
        const error = new Error("Payment terms sum must be 100");
        error.statusCode = 400;
        throw error;
    }
});

const Quotation = mongoose.model("Quotation", quotationSchema);

module.exports = Quotation;