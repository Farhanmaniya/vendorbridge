const express = require("express");
const router = express.Router();
const { verifyJWT, authorizeRoles } = require("../middleware/auth.middleware");
const {
    createUser,
    getAllUsers,
    getUserById, 
    updateUserRole,
    toggleUserStatus,
} = require('../controllers/user.controller');

router.post('/', verifyJWT, authorizeRoles('admin'), createUser);
router.get('/', verifyJWT, authorizeRoles('admin'), getAllUsers);
router.get('/:id', verifyJWT, authorizeRoles('admin'), getUserById);
router.patch('/:id/role', verifyJWT, authorizeRoles('admin'), updateUserRole);
router.patch('/:id/status', verifyJWT, authorizeRoles('admin'), toggleUserStatus);

module.exports = router;