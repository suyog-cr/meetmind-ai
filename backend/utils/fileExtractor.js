const fs = require('fs');
const path = require('path');

/**
 * Extracts text content from uploaded files
 * Supports: TXT, PDF, DOCX
 */

/**
 * Extract text from a TXT file
 */
function extractFromTxt(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content;
}

/**
 * Extract text from a PDF file using pdf-parse
 */
async function extractFromPdf(filePath) {
  const pdfParse = require('pdf-parse');
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

/**
 * Extract text from a DOCX file using mammoth
 */
async function extractFromDocx(filePath) {
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

/**
 * Main extraction function - detects file type and extracts text
 * @param {string} filePath - Path to the uploaded file
 * @param {string} mimeType - MIME type of the file
 * @param {string} originalName - Original filename for extension detection
 * @returns {string} Extracted text content
 */
async function extractTextFromFile(filePath, mimeType, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  let text = '';

  try {
    if (ext === '.txt' || mimeType === 'text/plain') {
      text = extractFromTxt(filePath);
    } else if (ext === '.pdf' || mimeType === 'application/pdf') {
      text = await extractFromPdf(filePath);
    } else if (
      ext === '.docx' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      text = await extractFromDocx(filePath);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  } finally {
    // Always clean up the temporary file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (cleanupError) {
      console.error('Failed to clean up temp file:', cleanupError.message);
    }
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Could not extract text from the file. The file may be empty or corrupted.');
  }

  return text.trim();
}

/**
 * Clean up a file if it exists (used in error cases)
 */
function cleanupFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('File cleanup error:', err.message);
  }
}

module.exports = { extractTextFromFile, cleanupFile };
