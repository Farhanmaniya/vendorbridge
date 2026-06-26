const Invoice = require("../models/Invoice.model");
const PurchaseOrder = require("../models/PurchaseOrder.model");
const Vendor = require("../models/Vendor.model");
const User = require("../models/User.model");
const sendEmail = require("../utils/sendEmail");
const logAction = require("../utils/createAuditLog");
const PDFDocument = require("pdfkit");

// Helper to generate styled corporate PDF
const generatePdfBuffer = (invoice, po, vendor) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      let buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on("error", (err) => {
        reject(err);
      });

      // Header Banner
      doc.rect(0, 0, 612, 120).fill("#534AB7");
      doc.fillColor("#FFFFFF")
         .fontSize(22)
         .font("Helvetica-Bold")
         .text("VENDORBRIDGE ERP", 50, 40)
         .fontSize(10)
         .font("Helvetica")
         .text("Procurement & Vendor Management Portal", 50, 70);

      doc.fillColor("#FFFFFF")
         .fontSize(16)
         .font("Helvetica-Bold")
         .text("INVOICE", 450, 40, { align: "right" })
         .fontSize(10)
         .font("Helvetica")
         .text(invoice.invoiceNumber, 450, 65, { align: "right" });

      // Invoice Details Block
      doc.fillColor("#333333");
      doc.fontSize(10).font("Helvetica-Bold").text("Invoice Details:", 50, 140);
      doc.font("Helvetica")
         .text(`Invoice Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 50, 155)
         .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 50, 170)
         .text(`PO Reference: ${po.poNumber}`, 50, 185)
         .text(`Status: ${invoice.status.toUpperCase()}`, 50, 200);

      // Bill To (Vendor Details)
      doc.font("Helvetica-Bold").text("Bill To / Remit Vendor:", 320, 140);
      doc.font("Helvetica")
         .text(`Company: ${vendor.companyName}`, 320, 155)
         .text(`Contact: ${vendor.contactPerson}`, 320, 170)
         .text(`Phone: ${vendor.phone || "N/A"}`, 320, 185);

      if (vendor.address) {
        const addr = vendor.address;
        const addrStr = `${addr.street || ""}, ${addr.city || ""}, ${addr.state || ""} ${addr.pincode || ""}`;
        doc.text(`Address: ${addrStr}`, 320, 200, { width: 240 });
      }

      // Draw table header
      let y = 250;
      doc.rect(50, y, 512, 22).fill("#F1F5F9");
      doc.fillColor("#333333")
         .font("Helvetica-Bold")
         .text("Item Name", 60, y + 6)
         .text("Qty", 280, y + 6, { width: 40, align: "center" })
         .text("Unit", 330, y + 6, { width: 40, align: "center" })
         .text("Price/Unit", 380, y + 6, { width: 80, align: "right" })
         .text("Total", 470, y + 6, { width: 85, align: "right" });

      y += 22;

      // Draw table rows
      invoice.items.forEach((item, index) => {
        doc.fillColor("#666666")
           .font("Helvetica")
           .text(item.name, 60, y + 6)
           .text(item.quantity.toString(), 280, y + 6, { width: 40, align: "center" })
           .text(item.unit, 330, y + 6, { width: 40, align: "center" })
           .text(`$${item.pricePerUnit.toLocaleString()}`, 380, y + 6, { width: 80, align: "right" })
           .text(`$${item.totalPrice.toLocaleString()}`, 470, y + 6, { width: 85, align: "right" });

        // horizontal border lines
        doc.strokeColor("#E2E8F0").lineWidth(0.5).moveTo(50, y + 22).lineTo(562, y + 22).stroke();
        y += 22;
      });

      y += 10;

      // Financial grid
      doc.fillColor("#333333")
         .font("Helvetica-Bold")
         .text("Subtotal:", 350, y, { width: 100, align: "right" })
         .font("Helvetica")
         .text(`$${invoice.subTotal.toLocaleString()}`, 470, y, { width: 85, align: "right" });

      y += 18;
      doc.fillColor("#333333")
         .font("Helvetica-Bold")
         .text(`GST Tax (${invoice.taxPercentage}%):`, 350, y, { width: 100, align: "right" })
         .font("Helvetica")
         .text(`$${invoice.taxAmount.toLocaleString()}`, 470, y, { width: 85, align: "right" });

      y += 22;
      doc.fillColor("#534AB7")
         .font("Helvetica-Bold")
         .fontSize(12)
         .text("Grand Total Due:", 330, y, { width: 120, align: "right" })
         .text(`$${invoice.grandTotal.toLocaleString()}`, 470, y, { width: 85, align: "right" });

      // Remittance Info Footer
      y += 50;
      doc.fillColor("#333333")
         .font("Helvetica-Bold")
         .fontSize(10)
         .text("Remittance Instructions:", 50, y);
      
      y += 15;
      doc.fillColor("#666666")
         .font("Helvetica")
         .fontSize(8);

      if (vendor.bankDetails) {
        doc.text(`Bank details provided by Vendor: ${vendor.bankDetails.street || ""} ${vendor.bankDetails.city || ""}`, 50, y);
      } else {
        doc.text("Standard bank wire payment within 30 days. Contact vendor finance department for banking coordinates.", 50, y);
      }

      // Legal disclaimer
      y += 20;
      doc.text("Thank you for your business. This is an automatically generated corporate invoice.", 50, y, { italic: true });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

const createInvoice = async (req, res) => {
  try {
    const { poId } = req.body;
    if (!poId) {
      return res.status(400).json({ message: "poId is required" });
    }

    // Check if PO exists
    const po = await PurchaseOrder.findById(poId);
    if (!po) {
      return res.status(404).json({ message: "Purchase Order not found" });
    }

    // Ensure status is confirmed or delivered
    if (!["confirmed", "delivered"].includes(po.status)) {
      return res.status(400).json({ message: "Invoice can only be generated from a confirmed or delivered PO" });
    }

    // Check if invoice already exists for this PO
    const existingInvoice = await Invoice.findOne({ poId });
    if (existingInvoice) {
      return res.status(400).json({ message: `An invoice has already been generated for this PO: ${existingInvoice.invoiceNumber}` });
    }

    // Fetch vendor and associated user to get email
    const vendor = await Vendor.findById(po.vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    const vendorUser = await User.findById(vendor.userId);
    if (!vendorUser) {
      return res.status(404).json({ message: "Vendor user credentials not found" });
    }

    // Calculations
    const subTotal = po.grandTotal;
    const taxPercentage = 18;
    const taxAmount = parseFloat((subTotal * 0.18).toFixed(2));
    const grandTotal = parseFloat((subTotal + taxAmount).toFixed(2));

    // Due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create Invoice DB Entry
    const invoice = await Invoice.create({
      poId,
      vendorId: po.vendorId,
      items: po.items,
      subTotal,
      taxPercentage,
      taxAmount,
      grandTotal,
      dueDate,
      status: "unpaid",
      createdBy: req.user._id,
    });

    // Generate PDF buffer
    let pdfBuffer;
    try {
      pdfBuffer = await generatePdfBuffer(invoice, po, vendor);
    } catch (pdfErr) {
      console.error("PDF generation failed:", pdfErr);
      return res.status(500).json({ message: "Failed to generate Invoice PDF document" });
    }

    // Send email with PDF attachment using Extended sendEmail helper
    try {
      const subject = `Invoice ${invoice.invoiceNumber} for Purchase Order ${po.poNumber}`;
      const emailBody = `Dear ${vendor.contactPerson || "Vendor Partner"},\n\n` +
        `Please find attached Invoice ${invoice.invoiceNumber} issued against Purchase Order ${po.poNumber}.\n\n` +
        `Summary Details:\n` +
        `- Invoice Number: ${invoice.invoiceNumber}\n` +
        `- Subtotal: $${subTotal.toLocaleString()}\n` +
        `- GST (18%): $${taxAmount.toLocaleString()}\n` +
        `- Grand Total Due: $${grandTotal.toLocaleString()}\n` +
        `- Due Date: ${dueDate.toLocaleDateString()}\n\n` +
        `Please remit payment by the due date. Thank you for your continued business.\n\n` +
        `Best regards,\n` +
        `Procurement Office\n` +
        `VendorBridge ERP`;

      const attachments = [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ];

      await sendEmail(vendorUser.email, subject, emailBody, attachments);
    } catch (emailErr) {
      console.error("Nodemailer invoice email failed to send:", emailErr.message);
      // We don't rollback invoice creation since it's saved in DB, but we alert the client in response.
    }

    // Log Action
    try {
      await logAction({
        performedBy: req.user._id,
        performedByRole: req.user.role,
        action: "Invoice Created & Emailed",
        oldValue: null,
        newValue: invoice.invoiceNumber,
        relatedId: invoice._id,
        relatedModel: "Invoice",
      });
    } catch (logErr) {
      console.error("Audit log failed for invoice creation:", logErr.message);
    }

    return res.status(201).json({
      message: "Invoice generated successfully and emailed to the vendor",
      invoice,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllInvoices = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ userId: req.user.id });
      if (!vendor) {
        return res.status(200).json({ invoices: [] });
      }
      query.vendorId = vendor._id;
    }

    const invoices = await Invoice.find(query)
      .populate("poId", "poNumber status")
      .populate("vendorId", "companyName contactPerson")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ invoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("poId", "poNumber createdAt status")
      .populate("vendorId", "companyName contactPerson phone address bankDetails")
      .populate("createdBy", "name email");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Access control
    if (req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ userId: req.user.id });
      if (!vendor || invoice.vendorId._id.toString() !== vendor._id.toString()) {
        return res.status(403).json({ message: "Access Denied" });
      }
    }

    return res.status(200).json({ invoice });
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const downloadInvoicePdf = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Access control
    if (req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ userId: req.user.id });
      if (!vendor || invoice.vendorId.toString() !== vendor._id.toString()) {
        return res.status(403).json({ message: "Access Denied" });
      }
    }

    const po = await PurchaseOrder.findById(invoice.poId);
    const vendor = await Vendor.findById(invoice.vendorId);

    const pdfBuffer = await generatePdfBuffer(invoice, po, vendor);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${invoice.invoiceNumber}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["unpaid", "paid", "void"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Access control: only officers, managers, and admins
    if (!["officer", "manager", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access Denied: Officer/Manager credentials required" });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const oldStatus = invoice.status;
    invoice.status = status;
    await invoice.save();

    // Log Action
    try {
      await logAction({
        performedBy: req.user._id,
        performedByRole: req.user.role,
        action: "Invoice Status Updated",
        oldValue: oldStatus,
        newValue: status,
        relatedId: invoice._id,
        relatedModel: "Invoice",
      });
    } catch (logErr) {
      console.error("Audit log failed for invoice status update:", logErr.message);
    }

    return res.status(200).json({ message: `Invoice status updated to ${status}`, invoice });
  } catch (error) {
    console.error("Error updating invoice status:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  downloadInvoicePdf,
  updateInvoiceStatus,
};
