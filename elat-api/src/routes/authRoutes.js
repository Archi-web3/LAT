const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public (should be Admin only later)
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.login);

// @route   GET api/auth/reset-admin-force
// @desc    Force reset admin
// @access  Public (Protected by key)
router.get('/reset-admin-force', authController.resetAdmin);

module.exports = router;
