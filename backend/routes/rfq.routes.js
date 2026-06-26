const express = require("express");
const router = express.Router();
const { verifyJWT, authorizeRoles } = require("../middleware/auth.middleware");
const {
  createRFQ,
  updateRFQ,
  updateRFQStatus,
  getAllRFQs,
  getRFQById,
  uploadAttachment,
  deleteAttachment,
} = require("../controllers/rfq.controller");

router.post('/', verifyJWT, authorizeRoles("officer"), createRFQ);
router.get('/', verifyJWT, authorizeRoles("admin", "officer", "manager", "vendor"), getAllRFQs);
router.get('/:id', verifyJWT, getRFQById);
router.patch('/:id/status', verifyJWT, authorizeRoles('manager', 'officer'), updateRFQStatus);
router.put('/:id', verifyJWT, authorizeRoles("officer"), updateRFQ);
router.post('/:id/attachments', verifyJWT, authorizeRoles('officer'), uploadAttachment);
router.delete('/:id/attachments/:attachmentId', verifyJWT, authorizeRoles('officer'), deleteAttachment);

module.exports = router;
