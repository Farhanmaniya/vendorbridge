const express = require('express');
const router = express.Router();
const { login, refreshToken, logout, getMe } = require('../controllers/auth.controller');
const { verifyJWT } = require('../middleware/auth.middleware');

router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.get('/me', verifyJWT, getMe);

module.exports = router;