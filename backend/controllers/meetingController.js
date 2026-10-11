const mongoose = require('mongoose');
const Meeting = require('../models/Meeting');
const { analyzeMeeting } = require('../services/geminiService');
const { extractTextFromFile, cleanupFile } = require('../utils/fileExtractor');

/**
 * POST /api/meetings/analyze
 * Create a new meeting with AI analysis
 */
async function analyzeMeetingHandler(req, res, next) {
  const uploadedFilePath = req.file ? req.file.path : null;

  try {
    const { title, meetingDate, notes } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      cleanupFile(uploadedFilePath);
      return res.status(400).json({ success: false, message: 'Meeting title is required.' });
    }

    if (!meetingDate) {
      cleanupFile(uploadedFilePath);
      return res.status(400).json({ success: false, message: 'Meeting date is required.' });
    }

    // Validate that either notes or file is provided
    if (!notes && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide meeting notes as text or upload a file.',
      });
    }

    // Extract text from file or use notes
    let meetingText;
    if (req.file) {
      try {
        meetingText = await extractTextFromFile(req.file.path, req.file.mimetype, req.file.originalname);
      } catch (extractError) {
        return res.status(400).json({
          success: false,
          message: extractError.message || 'Failed to extract text from file.',
        });
      }
    } else {
      meetingText = notes.trim();
    }

    if (!meetingText || meetingText.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Meeting notes are too short. Please provide more detailed notes.',
      });
    }

    // Send to Gemini for analysis
    let aiResult;
    try {
      aiResult = await analyzeMeeting(meetingText);
    } catch (aiError) {
      const statusCode = aiError.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: aiError.message || 'AI analysis failed. Please try again.',
      });
    }

    // Save meeting to MongoDB
    const meeting = new Meeting({
      title: title.trim(),
      meetingDate: new Date(meetingDate),
      originalText: meetingText,
      summary: aiResult.summary,
      keyPoints: aiResult.keyPoints,
      actionItems: aiResult.actionItems,
    });

    const savedMeeting = await meeting.save();

    return res.status(201).json({
      success: true,
      message: 'Meeting analyzed and saved successfully.',
      data: savedMeeting,
    });
  } catch (error) {
    cleanupFile(uploadedFilePath);
    next(error);
  }
}

/**
 * GET /api/meetings
 * Get all meetings with optional search and sort
 */
async function getAllMeetings(req, res, next) {
  try {
    const { search, sort } = req.query;

    let query = {};

    // Search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query = {
        $or: [
          { title: searchRegex },
          { summary: searchRegex },
          { originalText: searchRegex },
        ],
      };
    }

    // Sort order
    const sortOrder = sort === 'oldest' ? { meetingDate: 1, createdAt: 1 } : { meetingDate: -1, createdAt: -1 };

    const meetings = await Meeting.find(query)
      .sort(sortOrder)
      .select('title meetingDate summary keyPoints actionItems createdAt');

    return res.json({
      success: true,
      count: meetings.length,
      data: meetings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/meetings/stats
 * Get dashboard statistics
 */
async function getMeetingStats(req, res, next) {
  try {
    const totalMeetings = await Meeting.countDocuments();

    const pipeline = await Meeting.aggregate([
      { $unwind: { path: '$actionItems', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          totalActionItems: {
            $sum: { $cond: [{ $ifNull: ['$actionItems', false] }, 1, 0] },
          },
          pendingTasks: {
            $sum: {
              $cond: [{ $eq: ['$actionItems.status', 'PENDING'] }, 1, 0],
            },
          },
          highPriorityTasks: {
            $sum: {
              $cond: [{ $eq: ['$actionItems.priority', 'HIGH'] }, 1, 0],
            },
          },
        },
      },
    ]);

    const stats = pipeline[0] || {
      totalActionItems: 0,
      pendingTasks: 0,
      highPriorityTasks: 0,
    };

    return res.json({
      success: true,
      data: {
        totalMeetings,
        totalActionItems: stats.totalActionItems,
        pendingTasks: stats.pendingTasks,
        highPriorityTasks: stats.highPriorityTasks,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/meetings/:id
 * Get a single meeting by ID
 */
async function getMeetingById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid meeting ID.' });
    }

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    return res.json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/meetings/:id
 * Delete a meeting
 */
async function deleteMeeting(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid meeting ID.' });
    }

    const meeting = await Meeting.findByIdAndDelete(id);

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    return res.json({ success: true, message: 'Meeting deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/meetings/:meetingId/action-items/:actionItemId
 * Update a specific action item's priority, deadline, or status
 */
async function updateActionItem(req, res, next) {
  try {
    const { meetingId, actionItemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({ success: false, message: 'Invalid meeting ID.' });
    }

    if (!mongoose.Types.ObjectId.isValid(actionItemId)) {
      return res.status(400).json({ success: false, message: 'Invalid action item ID.' });
    }

    const { priority, deadline, status } = req.body;

    // Validate updates
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority. Must be LOW, MEDIUM, or HIGH.',
      });
    }

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be PENDING, IN_PROGRESS, or COMPLETED.',
      });
    }

    // Build update object
    const updateFields = {};
    if (priority) updateFields['actionItems.$.priority'] = priority;
    if (status) updateFields['actionItems.$.status'] = status;
    if (deadline !== undefined) {
      updateFields['actionItems.$.deadline'] = deadline ? new Date(deadline) : null;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update.' });
    }

    const meeting = await Meeting.findOneAndUpdate(
      { _id: meetingId, 'actionItems._id': actionItemId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting or action item not found.' });
    }

    const updatedItem = meeting.actionItems.id(actionItemId);

    return res.json({
      success: true,
      message: 'Action item updated successfully.',
      data: updatedItem,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  analyzeMeetingHandler,
  getAllMeetings,
  getMeetingStats,
  getMeetingById,
  deleteMeeting,
  updateActionItem,
};
