/**
 * Centralized error handling middleware
 * Handles all errors thrown throughout the application
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      success: false,
      message: 'Invalid meeting ID format',
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry detected',
    });
  }

  // Custom status codes
  const statusCode = err.statusCode || 500;

  // Don't expose internal errors in production
  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error. Please try again.'
      : err.message || 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = errorHandler;
