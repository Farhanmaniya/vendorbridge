const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../middleware/auth.middleware");
const {
  getAllPOs,
  getPOById,
  updatePOStatus,
} = require("../controllers/purchaseOrder.controller");

router.get("/", verifyJWT, getAllPOs);
router.get("/:id", verifyJWT, getPOById);
router.patch("/:id/status", verifyJWT, updatePOStatus);

module.exports = router;
