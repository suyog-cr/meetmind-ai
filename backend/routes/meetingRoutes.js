const express = require('express');
const router = express.Router();
const { upload, handleMulterError } = require('../middleware/upload');
const {
  analyzeMeetingHandler,
  getAllMeetings,
  getMeetingStats,
  getMeetingById,
  deleteMeeting,
  updateActionItem,
} = require('../controllers/meetingController');

// GET /api/meetings/stats - Dashboard statistics (must come before /:id)
router.get('/stats', getMeetingStats);

// POST /api/meetings/analyze - Create and analyze a meeting
router.post('/analyze', upload.single('file'), handleMulterError, analyzeMeetingHandler);

// GET /api/meetings - Get all meetings (with optional search/sort)
router.get('/', getAllMeetings);

// GET /api/meetings/:id - Get single meeting
router.get('/:id', getMeetingById);

// DELETE /api/meetings/:id - Delete a meeting
router.delete('/:id', deleteMeeting);

// PATCH /api/meetings/:meetingId/action-items/:actionItemId - Update action item
router.patch('/:meetingId/action-items/:actionItemId', updateActionItem);

module.exports = router;
