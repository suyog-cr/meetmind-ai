# Flowchart — MeetMind AI

## Main Application Flow

```
User Opens MeetMind AI
        │
        ▼
   [Dashboard Page]
   - Load stats from /api/meetings/stats
   - Load recent meetings from /api/meetings
        │
        ├──── Click "New Meeting" ──────────────────────────────────┐
        │                                                            │
        ├──── Click "Meeting History" ──► [History Page]            │
        │     - Load all meetings                                    │
        │     - Search / Sort                                        │
        │     - Click "View Details" ──► [Meeting Details Page]     │
        │     - Click "Delete" ──► Confirm Dialog ──► Delete        │
        │                                                            ▼
        │                                              [New Meeting Page]
        │                                                            │
        │                                     ┌──────────────────────┤
        │                                     │                      │
        │                              [Text Input]          [File Upload]
        │                               Enter notes         Select TXT/PDF/DOCX
        │                                     │                      │
        │                                     └──────────────────────┘
        │                                                 │
        │                                    Click "Generate AI Analysis"
        │                                                 │
        │                                                 ▼
        │                                      [Frontend Validation]
        │                                   Title? Date? Notes/File?
        │                                         │         │
        │                                       FAIL       PASS
        │                                         │         │
        │                               Show Error Msg      │
        │                                                    ▼
        │                              POST /api/meetings/analyze
        │                              (multipart/form-data)
        │                                                    │
        │                                                    ▼
        │                                       [Backend: Validate]
        │                                       Check required fields
        │                                                    │
        │                                                    ▼
        │                                     [Backend: Extract Text]
        │                               TXT → read as string
        │                               PDF → pdf-parse
        │                               DOCX → mammoth
        │                               Delete temp file
        │                                                    │
        │                                                    ▼
        │                                    [Backend: Gemini API]
        │                                    Build prompt with meeting text
        │                                    Call Gemini 1.5 Flash
        │                                    Parse JSON response
        │                                    Validate AI output
        │                                                    │
        │                                          ┌─────────┴────────┐
        │                                         FAIL              PASS
        │                                          │                  │
        │                                   Return 500          [Save to MongoDB]
        │                                                             │
        │                                                             ▼
        │                                                    Return saved meeting
        │                                                             │
        └─────────────────────────────────────────────────────────────
                                                                      │
                                                                      ▼
                                                     Navigate to [Meeting Details Page]
                                                              │
                                                    ┌─────────┴──────────┐
                                                    │                    │
                                             Display:              User Actions:
                                             - Title & Date        - Edit action item
                                             - AI Summary          - Change priority
                                             - Key Points          - Change status
                                             - Action Items        - Change deadline
                                                    │                    │
                                                    │             PATCH /api/meetings/
                                                    │             :meetingId/action-items/
                                                    │             :actionItemId
                                                    │                    │
                                                    │             Update MongoDB
                                                    │             Return updated item
                                                    │
                                                 Delete Meeting
                                                    │
                                              Confirm Dialog
                                                    │
                                         DELETE /api/meetings/:id
                                                    │
                                           Navigate to History
```

---

## AI Analysis Flow (Detailed)

```
Meeting Text
     │
     ▼
Build Gemini Prompt
(inject meeting text into template)
     │
     ▼
POST to Gemini 1.5 Flash API
(server-side only — API key never sent to frontend)
     │
     ├── Rate Limit (429) ──► Return friendly error to user
     │
     ├── API Error ──────────► Return 500 error
     │
     ▼
Receive raw text response
     │
     ▼
Strip markdown code fences (if present)
     │
     ▼
JSON.parse(responseText)
     │
     ├── Parse fails ──► Try regex extraction ──► fails ──► Error
     │
     ▼
Validate structure:
  - summary: string ✓
  - keyPoints: string[] ✓
  - actionItems: object[] ✓
     │
     ▼
For each action item:
  - priority in [LOW, MEDIUM, HIGH]? → else MEDIUM
  - status in [PENDING, IN_PROGRESS, COMPLETED]? → else PENDING
  - deadline present? → keep | else null
  - task is non-empty? → keep | else discard
     │
     ▼
Return validated { summary, keyPoints, actionItems }
```

---

## File Upload Flow

```
User selects file
     │
     ▼
Frontend validation:
  - Extension: .txt, .pdf, .docx? → else reject
  - Size ≤ 10MB? → else reject
  - Size > 0? → else reject
     │
     ▼
FormData with file
     │
     ▼
Multer (backend middleware):
  - Check MIME type and extension → else 415
  - Check size ≤ 10MB → else 413
  - Save to /uploads/ temporarily
     │
     ▼
fileExtractor.js:
  .txt → fs.readFileSync(utf8)
  .pdf → pdf-parse(buffer)
  .docx → mammoth.extractRawText
     │
     ├── Extraction fails → 400 error
     │
     ▼
fs.unlinkSync(filePath) ← always delete temp file
     │
     ▼
Validate: text.length > 0? → else 400 error
     │
     ▼
Pass text to Gemini pipeline
```

---

## Data Architecture

```
Browser (React)
      │ HTTPS requests (Axios)
      │ VITE_API_URL env variable
      ▼
Express.js (Node.js)
      │
      ├── Gemini API (server-side only)
      │   API key in process.env.GEMINI_API_KEY
      │   Never sent to browser
      │
      └── MongoDB Atlas (Mongoose)
          Meeting collection:
          {
            title, meetingDate, originalText,
            summary, keyPoints,
            actionItems: [
              { task, priority, deadline, status }
            ],
            createdAt, updatedAt
          }
```
