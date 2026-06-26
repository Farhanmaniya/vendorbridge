const express = require('express');
const router = express.Router();
const { verifyJWT, authorizeRoles} = require('../middleware/auth.middleware');
const getAuditLogs = require('../controllers/auditLog.controller');

router.get('/', verifyJWT, authorizeRoles('admin'), getAuditLogs);

module.exports = router;

