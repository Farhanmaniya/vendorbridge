const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../middleware/auth.middleware");
const {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  downloadInvoicePdf,
  updateInvoiceStatus,
} = require("../controllers/invoice.controller");

router.post("/", verifyJWT, createInvoice);
router.get("/", verifyJWT, getAllInvoices);
router.get("/:id", verifyJWT, getInvoiceById);
router.get("/:id/pdf", verifyJWT, downloadInvoicePdf);
router.patch("/:id/status", verifyJWT, updateInvoiceStatus);

module.exports = router;
