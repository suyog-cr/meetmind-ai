/**
 * Format a date string for display
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date for input[type="date"]
 */
export function formatDateForInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Truncate text to a given length
 */
export function truncateText(text, maxLength = 150) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Get priority badge CSS class
 */
export function getPriorityClass(priority) {
  switch (priority) {
    case 'HIGH': return 'badge-high';
    case 'MEDIUM': return 'badge-medium';
    case 'LOW': return 'badge-low';
    default: return 'badge-medium';
  }
}

/**
 * Get status badge CSS class
 */
export function getStatusClass(status) {
  switch (status) {
    case 'PENDING': return 'badge-pending';
    case 'IN_PROGRESS': return 'badge-in-progress';
    case 'COMPLETED': return 'badge-completed';
    default: return 'badge-pending';
  }
}

/**
 * Format status for display
 */
export function formatStatus(status) {
  switch (status) {
    case 'IN_PROGRESS': return 'In Progress';
    case 'PENDING': return 'Pending';
    case 'COMPLETED': return 'Completed';
    default: return status;
  }
}
