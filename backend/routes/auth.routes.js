const express = require('express');
const router = express.Router();
const { login, refreshToken, logout, getMe, changePassword, registerVendor, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { verifyJWT } = require('../middleware/auth.middleware');

router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.get('/me', verifyJWT, getMe);
router.patch('/change-password', verifyJWT, changePassword);

router.post('/signup', registerVendor);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;