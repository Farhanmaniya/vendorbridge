const express = require("express");
const router = express.Router();
const { verifyJWT, authorizeRoles } = require("../middleware/auth.middleware");
const {
  createRFQ,
  updateRFQ,
  updateRFQStatus,
  getAllRFQs,
  getRFQById,
} = require("../controllers/rfq.controller");

router.post('/', verifyJWT, authorizeRoles("officer"), createRFQ);
router.get('/', verifyJWT, authorizeRoles("admin", "officer", "manager"), getAllRFQs);
router.get('/:id', verifyJWT, getRFQById);
router.patch('/:id/status', verifyJWT, authorizeRoles('manager', 'officer'), updateRFQStatus);
router.put('/:id', verifyJWT, authorizeRoles("officer"), updateRFQ);

module.exports = router;
