const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const assessmentController = require('../controllers/assessmentController');

// @route   POST api/assessments/sync
// @desc    Sync local assessments to DB
// @access  Private
router.post('/sync', auth, assessmentController.sync);

// @route   GET api/assessments/history
// @desc    Get assessment history (filtered by Role)
// @access  Private
router.get('/history', auth, assessmentController.getHistory);

// @route   DELETE api/assessments/:id
// @desc    Delete an assessment
// @access  Private
router.delete('/:id', auth, assessmentController.deleteAssessment);

module.exports = router;
