const { GoogleGenAI } = require('@google/genai');
const { getMeetingAnalysisPrompt } = require('./prompts/meetingAnalysisPrompt');

/**
 * Analyzes meeting text using Google Gemini API.
 * Uses the new @google/genai SDK which supports AQ. auth keys.
 *
 * @param {string} meetingText - The raw meeting notes text
 * @returns {Object} Structured analysis: { summary, keyPoints, actionItems }
 */
async function analyzeMeeting(meetingText) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Add GEMINI_API_KEY to your .env file.');
  }

  if (!meetingText || meetingText.trim().length === 0) {
    throw new Error('Meeting text is empty.');
  }

  // Initialize using the new SDK — supports both AIzaSy and AQ. key formats
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = getMeetingAnalysisPrompt(meetingText.trim());

  let responseText;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    responseText = response.text;
  } catch (error) {
    const msg = error.message || '';

    // Rate limit
    if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
      const rateLimitError = new Error('AI service rate limit reached. Please wait a moment and try again.');
      rateLimitError.statusCode = 429;
      throw rateLimitError;
    }

    // Auth error — key misconfigured or wrong format
    if (msg.includes('401') || msg.toLowerCase().includes('unauthenticated') || msg.toLowerCase().includes('api key')) {
      const authError = new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY in the .env file.');
      authError.statusCode = 401;
      throw authError;
    }

    throw new Error(`Gemini API error: ${msg}`);
  }

  return parseGeminiResponse(responseText);
}

/**
 * Parses and validates the raw JSON string from Gemini.
 * Handles cases where Gemini wraps output in markdown code fences.
 */
function parseGeminiResponse(rawText) {
  let cleanText = (rawText || '').trim();

  // Strip markdown code fences if present (``` or ```json)
  cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleanText);
  } catch (e) {
    // Try to find a JSON object within the text
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e2) {
        throw new Error('AI returned malformed JSON. Please try again.');
      }
    } else {
      throw new Error('AI returned an unexpected response format. Please try again.');
    }
  }

  // Ensure required fields exist
  if (typeof parsed.summary !== 'string' || !parsed.summary.trim()) {
    parsed.summary = 'Summary not available.';
  }
  if (!Array.isArray(parsed.keyPoints)) {
    parsed.keyPoints = [];
  }
  if (!Array.isArray(parsed.actionItems)) {
    parsed.actionItems = [];
  }

  const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
  const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

  // Validate and sanitize action items
  parsed.actionItems = parsed.actionItems
    .filter((item) => item && typeof item.task === 'string' && item.task.trim().length > 0)
    .map((item) => ({
      task: item.task.trim(),
      priority: validPriorities.includes(item.priority) ? item.priority : 'MEDIUM',
      deadline: item.deadline && item.deadline !== 'null' ? item.deadline : null,
      status: validStatuses.includes(item.status) ? item.status : 'PENDING',
    }));

  // Sanitize key points
  parsed.keyPoints = parsed.keyPoints
    .filter((kp) => typeof kp === 'string' && kp.trim().length > 0)
    .map((kp) => kp.trim());

  return {
    summary: parsed.summary.trim(),
    keyPoints: parsed.keyPoints,
    actionItems: parsed.actionItems,
  };
}

module.exports = { analyzeMeeting };
