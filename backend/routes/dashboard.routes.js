const express = require('express');
const router = express.Router();
const {verifyJWT, authorizeRoles} = require("../middleware/auth.middleware");
const {getRFQStatusBreakdown, getVendorPerformance} = require("../controllers/dashboard.controller");

router.get('/rfq-status', verifyJWT, authorizeRoles('admin', 'manager', 'officer'), getRFQStatusBreakdown);

router.get('/vendor-performance', verifyJWT, authorizeRoles('admin', 'manager', 'officer'), getVendorPerformance);

module.exports = router;

