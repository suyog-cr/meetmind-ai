# Algorithm — MeetMind AI

## Overview

MeetMind AI uses a multi-step algorithmic pipeline to convert raw meeting notes into structured, actionable data.

---

## Algorithm 1: Meeting Input Processing

```
INPUT: title, meetingDate, notes (text) OR file (TXT/PDF/DOCX)

STEP 1 — Validate Input
  IF title is empty → return 400 Bad Request
  IF meetingDate is empty → return 400 Bad Request
  IF neither notes nor file provided → return 400 Bad Request

STEP 2 — Extract Text (if file uploaded)
  IF file extension is .txt → read file as UTF-8 string
  IF file extension is .pdf → use pdf-parse library to extract text
  IF file extension is .docx → use mammoth library to extract raw text
  IF extraction fails OR text is empty → return 400 error
  DELETE temporary file from server

STEP 3 — Validate Extracted Text
  IF text length < 10 characters → return 400 error

OUTPUT: meetingText (string)
```

---

## Algorithm 2: AI Analysis Pipeline

```
INPUT: meetingText (string)

STEP 1 — Build Prompt
  Load prompt template from meetingAnalysisPrompt.js
  Inject meetingText into prompt
  Prompt instructs Gemini to return only valid JSON

STEP 2 — Call Gemini API
  Send prompt to Google Gemini 1.5 Flash model
  Receive raw text response
  IF API returns 429 (rate limit) → return 429 to client
  IF API fails → throw error

STEP 3 — Parse Gemini Response
  Remove any accidental markdown code fences (```json ... ```)
  Parse string as JSON
  IF JSON.parse fails → try to extract JSON using regex
  IF still fails → throw "malformed JSON" error

STEP 4 — Validate AI Output
  Check summary is a non-empty string
  Check keyPoints is an array of strings
  Check actionItems is an array of objects
  FOR each actionItem:
    IF priority not in [LOW, MEDIUM, HIGH] → default to MEDIUM
    IF status not in [PENDING, IN_PROGRESS, COMPLETED] → default to PENDING
    IF deadline is present → keep as date string ELSE set to null
  Remove actionItems with empty task field

OUTPUT: { summary, keyPoints, actionItems }
```

---

## Algorithm 3: Priority Determination

The AI determines priority based on language patterns in the meeting text:

```
SCAN meeting text for priority indicators:

HIGH priority keywords:
  "urgent", "urgently", "immediately", "ASAP", "as soon as possible",
  "critical", "top priority", "must be done first", "this week" (with urgency),
  "deadline is tomorrow", "due today"

LOW priority keywords:
  "when possible", "when you can", "eventually", "low priority",
  "if time permits", "nice to have", "no rush", "someday"

DEFAULT → MEDIUM (when no clear signal is found)

RULE: Never invent priority — only use language signals from the text.
```

---

## Algorithm 4: Deadline Extraction

```
SCAN meeting text for explicit deadline mentions:

Patterns recognized:
  "by [day/date]" → e.g., "by Friday", "by October 15"
  "deadline is [date]" → e.g., "deadline is 2026-10-20"
  "before [day/date]" → e.g., "before Monday"
  "due [date]" → e.g., "due next week"
  "submit by [date]"

IF pattern found:
  Convert to ISO date format (YYYY-MM-DD)
  Return as deadline value

IF NO pattern found:
  deadline = null
  Display: "No deadline specified"

RULE: Never invent a deadline. Only return what is explicitly in the text.
```

---

## Algorithm 5: Meeting Storage

```
INPUT: { title, meetingDate, originalText, summary, keyPoints, actionItems }

STEP 1 — Create Mongoose Document
  Validate all fields against Meeting schema
  Validate priority enum values
  Validate status enum values

STEP 2 — Save to MongoDB Atlas
  meeting.save() → persists document

STEP 3 — Return saved document
  Include MongoDB _id for navigation to details page

OUTPUT: Saved Meeting object with _id
```

---

## Algorithm 6: Action Item Update

```
INPUT: meetingId, actionItemId, { priority?, status?, deadline? }

STEP 1 — Validate IDs
  Validate meetingId is valid MongoDB ObjectId
  Validate actionItemId is valid MongoDB ObjectId

STEP 2 — Validate update values
  IF priority provided → must be in [LOW, MEDIUM, HIGH]
  IF status provided → must be in [PENDING, IN_PROGRESS, COMPLETED]
  IF deadline provided → parse as Date; IF null → clear deadline

STEP 3 — MongoDB positional update
  Use MongoDB positional operator ($) to update nested actionItem
  findOneAndUpdate({ _id: meetingId, 'actionItems._id': actionItemId })

STEP 4 — Return updated action item

OUTPUT: Updated ActionItem object
```

---

## Algorithm 7: Search and Filter

```
INPUT: search (string, optional), sort (newest|oldest)

STEP 1 — Build query
  IF search is provided:
    Build regex from search string (case-insensitive)
    Match against: title, summary, originalText ($or query)
  ELSE:
    query = {} (match all)

STEP 2 — Apply sort
  IF sort = "newest" → { meetingDate: -1, createdAt: -1 }
  IF sort = "oldest" → { meetingDate: 1, createdAt: 1 }

STEP 3 — Execute query
  Meeting.find(query).sort(sortOrder)

OUTPUT: Array of matching meetings
```

---

## Algorithm 8: Dashboard Statistics

```
Uses MongoDB Aggregation Pipeline:

STEP 1 — Count total meetings
  Meeting.countDocuments()

STEP 2 — Aggregate action item statistics
  $unwind actionItems array
  $group by null:
    totalActionItems: count all action items
    pendingTasks: count where status = PENDING
    highPriorityTasks: count where priority = HIGH

OUTPUT: { totalMeetings, totalActionItems, pendingTasks, highPriorityTasks }
```
