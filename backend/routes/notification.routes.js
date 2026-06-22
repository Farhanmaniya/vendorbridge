const express = require("express");
const router = express.Router();
const {
  markAsRead,
  getMyNotifications,
} = require("../controllers/notification.controller");
const { verifyJWT } = require("../middleware/auth.middleware");

router.get('/', verifyJWT, getMyNotifications);
router.patch('/:id/read', verifyJWT, markAsRead);

module.exports = router;