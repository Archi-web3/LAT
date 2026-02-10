const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const configController = require('../controllers/configController');

// @route   GET api/config
// @desc    Get app configuration
// @access  Public (or Private depending on needs, made public for initial loading)
// Making it public for now to ease loading for all users, or restrict to auth if sensitive. 
// Ideally assessments need this, so Authenticated Users.
router.get('/', configController.getConfig);

// @route   POST api/config
// @desc    Save app configuration
// @access  Private (Admin only)
router.post('/', [auth, role(['SUPER_ADMIN'])], configController.saveConfig);

module.exports = router;
