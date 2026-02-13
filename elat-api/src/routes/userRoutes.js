const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const userController = require('../controllers/userController');

// @route   GET api/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/', [auth, role(['SUPER_ADMIN'])], userController.getUsers);

// @route   POST api/users
// @desc    Create a user
// @access  Private (Admin)
router.post('/', [auth, role(['SUPER_ADMIN'])], userController.createUser);

// @route   POST api/users/import
// @desc    Import users from CSV/JSON
// @access  Private (Admin)
router.post('/import', [auth, role(['SUPER_ADMIN'])], userController.importUsers);

// @route   PUT api/users/:id
// @desc    Update a user
// @access  Private (Admin)
router.put('/:id', [auth, role(['SUPER_ADMIN'])], userController.updateUser);

// @route   DELETE api/users/:id
// @desc    Delete a user
// @access  Private (Admin)
router.delete('/:id', [auth, role(['SUPER_ADMIN'])], userController.deleteUser);

module.exports = router;
