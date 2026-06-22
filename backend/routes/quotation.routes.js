const express = require("express");
const router = express.Router();
const { verifyJWT, authorizeRoles } = require("../middleware/auth.middleware");
const {
  getQuotationById,
  getQuotationsByRFQ,
  updateQuotationStatus,
  createOrUpdateQuotation,
} = require("../controllers/quotation.controller");

router.post('/', verifyJWT, authorizeRoles('vendor'), createOrUpdateQuotation);
router.get('/rfq/:rfqId', verifyJWT, authorizeRoles('officer', 'manager'), getQuotationsByRFQ);
router.get('/:id', verifyJWT, authorizeRoles('officer', 'manager', 'vendor'), getQuotationById);
router.patch('/:id/status', verifyJWT, authorizeRoles('officer', 'manager'), updateQuotationStatus);

module.exports = router;