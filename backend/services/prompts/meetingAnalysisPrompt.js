/**
 * Meeting Analysis Prompt
 *
 * This prompt instructs Google Gemini to analyze meeting notes and return
 * a structured JSON object with summary, key points, and action items.
 *
 * IMPORTANT RULES FOR THE AI:
 * - Only summarize information actually present in the meeting notes.
 * - Never invent participants, tasks, or deadlines.
 * - Extract only action items explicitly mentioned or clearly implied.
 * - Determine priority only when the text reasonably supports it.
 * - Extract deadlines only when explicitly mentioned.
 * - Return valid JSON only - no Markdown, no code fences.
 */

function getMeetingAnalysisPrompt(meetingText) {
  return `You are an expert meeting analyst. Analyze the following meeting notes and extract structured information.

INSTRUCTIONS:
1. Write a concise factual summary (2-4 sentences) of what was discussed in the meeting.
2. Extract 3-8 key points (important decisions, topics discussed, conclusions reached).
3. Extract all action items (tasks that need to be done).
4. For each action item:
   - task: Clear description of what needs to be done
   - priority: Determine based on language used:
     * HIGH: Words like "urgent", "immediately", "critical", "ASAP", "top priority", "must be done first", "this week" with urgency
     * LOW: Words like "when possible", "eventually", "low priority", "if time permits", "nice to have"
     * MEDIUM: All other tasks or when priority cannot be determined
   - deadline: Extract ONLY if explicitly mentioned (e.g., "by Friday", "deadline October 15", "before Monday")
     * Format as ISO date string (YYYY-MM-DD) if a specific date or day is mentioned
     * Use null if no deadline is mentioned
   - status: Always set to "PENDING" for newly extracted action items

STRICT RULES:
- Return ONLY valid JSON. No markdown. No code fences. No explanation text.
- Never invent information not present in the meeting notes.
- Never invent deadlines. If not mentioned, use null.
- Never invent participants or owners.
- If no action items exist, return an empty array.
- If no key points exist, return an empty array.
- The summary must only reflect what is in the notes.

REQUIRED JSON FORMAT (return exactly this structure):
{
  "summary": "Brief factual summary of the meeting",
  "keyPoints": [
    "Key point 1",
    "Key point 2"
  ],
  "actionItems": [
    {
      "task": "Description of the task",
      "priority": "HIGH",
      "deadline": "2026-10-15",
      "status": "PENDING"
    }
  ]
}

MEETING NOTES TO ANALYZE:
---
${meetingText}
---

Return only the JSON object. Do not include any other text.`;
}

module.exports = { getMeetingAnalysisPrompt };
