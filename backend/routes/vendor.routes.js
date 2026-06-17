const express = require("express");
const router = express.Router();
const { verifyJWT, authorizeRoles } = require("../middleware/auth.middleware");
const {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  updateVendorStatus,
  uploadDocument,
  deleteDocument,
} = require("../controllers/vendor.controller");

// Vendor related Routes
// Post routes
router.post("/", verifyJWT, authorizeRoles("admin"), createVendor);

// Get route to get all vendors as admin
router.get("/", verifyJWT, authorizeRoles("admin"), getAllVendors);

// Get route to get specific vendor based on id as admin or user
router.get("/:id", verifyJWT, authorizeRoles("admin", "vendor"), getVendorById);

// PUT route to update vendors details based on id
router.put("/:id", verifyJWT, authorizeRoles("vendor", "admin"), updateVendor);

// Patch route to change status of vendor as admin only
router.patch(
  "/:id/status",
  verifyJWT,
  authorizeRoles("admin"),
  updateVendorStatus,
);

// Document Related Routes
// POST route to upload document based on id
router.post("/:id/documents", verifyJWT, authorizeRoles("vendor") ,uploadDocument);

// DELETE route to delete the documents base don id
router.delete("/:id/documents/:docId", verifyJWT, authorizeRoles("vendor"), deleteDocument);

module.exports = router;
