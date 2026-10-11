# MeetMind AI

> **Turn meetings into clear actions.**

A full-stack AI-powered web application that converts meeting notes into structured summaries, key points, and trackable action items using Google Gemini AI.

---

## Project Information

- **Project Number:** 18
- **Project Title:** AI Meeting Notes & Action Tracker
- **Feature Set:** C
- **Student:** [Your Name]
- **Course:** [Your Course]

---

## Features

- **Text/File Meeting Input** — Paste notes manually or upload TXT, PDF, or DOCX files
- **AI Summary & Key Points** — Google Gemini generates concise summaries and important points
- **Action Item Extraction** — AI identifies tasks from meeting notes
- **Priority & Deadline Tracking** — Priority (HIGH/MEDIUM/LOW) and deadlines extracted by AI
- **Meeting History** — All meetings stored in MongoDB Atlas with search and sort
- **Update Action Items** — Change priority, status, and deadline with persistence
- **Delete Meetings** — With confirmation dialog
- **Responsive Design** — Works on mobile, tablet, and desktop

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4, React Router v6, Axios, Lucide React |
| Backend | Node.js, Express.js, REST API, Multer, dotenv, CORS |
| Database | MongoDB Atlas, Mongoose |
| AI | Google Gemini 1.5 Flash API |
| File Parsing | pdf-parse (PDF), Mammoth (DOCX) |
| Deployment | Vercel (Frontend), Render (Backend), MongoDB Atlas (Database) |

---

## AI Tools Used

- **Google Gemini 1.5 Flash** — For meeting analysis, summary generation, key point extraction, and action item extraction
- **GitHub Copilot** — For development assistance

---

## Important AI Prompt

The AI prompt is stored in: `backend/services/prompts/meetingAnalysisPrompt.js`

The prompt instructs Gemini to:
1. Summarize only what is present in the meeting notes
2. Extract 3-8 key points (decisions, topics, conclusions)
3. Extract action items with task, priority, deadline, and status
4. Determine priority based on urgency language in the notes
5. Extract deadlines only when explicitly mentioned
6. Return valid JSON only (no markdown, no code fences)
7. Never hallucinate or invent information

**Priority Logic:**
- `HIGH` — Urgent language: "immediately", "ASAP", "critical", "top priority"
- `LOW` — Low urgency: "when possible", "eventually", "if time permits"
- `MEDIUM` — Default when priority cannot be determined

**Deadline Logic:**
- Extracted only when explicitly stated: "by Friday", "deadline October 15"
- Returns `null` if not mentioned — never invented

---

## Project Structure

```
meetmind-ai/
├── frontend/
│   ├── src/
│   │   ├── api/axios.js           # Axios instance (VITE_API_URL)
│   │   ├── components/            # Reusable UI components
│   │   ├── hooks/useToast.js      # Toast notification hook
│   │   ├── layouts/Layout.jsx     # App shell with navbar
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Dashboard with stats
│   │   │   ├── NewMeeting.jsx     # Create meeting + file upload
│   │   │   ├── MeetingDetails.jsx # View + edit action items
│   │   │   └── MeetingHistory.jsx # Search + browse meetings
│   │   ├── utils/formatters.js    # Date/text utilities
│   │   ├── App.jsx                # Router setup
│   │   └── main.jsx               # Entry point
│   ├── .env.example
│   ├── vite.config.js
│   └── vercel.json
│
├── backend/
│   ├── controllers/meetingController.js   # Route handlers
│   ├── routes/meetingRoutes.js            # Express routes
│   ├── models/Meeting.js                  # Mongoose schema
│   ├── services/
│   │   ├── geminiService.js               # Gemini API integration
│   │   └── prompts/meetingAnalysisPrompt.js  # AI prompt
│   ├── middleware/
│   │   ├── upload.js              # Multer file upload config
│   │   └── errorHandler.js        # Centralized error handler
│   ├── utils/fileExtractor.js     # TXT/PDF/DOCX text extraction
│   ├── server.js                  # Express app + MongoDB connection
│   ├── .env.example
│   └── render.yaml
│
├── README.md
├── ALGORITHM.md
├── FLOWCHART.md
└── .gitignore
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/meetings/analyze` | Create + analyze meeting (multipart/form-data) |
| `GET` | `/api/meetings` | Get all meetings (supports `?search=` and `?sort=newest\|oldest`) |
| `GET` | `/api/meetings/stats` | Get dashboard statistics |
| `GET` | `/api/meetings/:id` | Get single meeting |
| `DELETE` | `/api/meetings/:id` | Delete a meeting |
| `PATCH` | `/api/meetings/:meetingId/action-items/:actionItemId` | Update action item |

---

## Instructions to Run the Project

### Prerequisites

- Node.js >= 18
- MongoDB Atlas account (free tier works)
- Google Gemini API key (free at [Google AI Studio](https://aistudio.google.com/))

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd meetmind-ai
```

### 2. Setup Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY and MONGODB_URI
npm install
npm start
```

### 3. Setup Frontend

```bash
cd frontend
cp .env.example .env
# .env already contains: VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

### 4. Open the App

Visit: `http://localhost:5173`

---

## Environment Variables

### Backend (`backend/.env`)

```
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/meetmind
PORT=5000
CLIENT_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```
VITE_API_URL=http://localhost:5000/api
```

---

## Deployment

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`

### Backend (Render)
1. Connect GitHub repo to Render
2. Set root directory to `backend`
3. Add environment variables: `GEMINI_API_KEY`, `MONGODB_URI`, `CLIENT_URL`

---

## Security

- Gemini API key is **never** exposed to the frontend
- All AI requests are made server-side only
- File type and size validation on both frontend and backend
- CORS restricts requests to allowed origins
- No secrets committed to the repository

---

## Screenshots

### Dashboard
![Dashboard](screenshots/DashBoard.png)

### New Meeting
![New Meeting](screenshots/New%20Meeting.png)

### AI Analysis Result
![AI Analysis Result](screenshots/Example%20AI%20meeting.png)

### All Meetings
![All Meetings](screenshots/All%20meetings.png)

### Pending Tasks
![Pending Tasks](screenshots/Pending%20Tasks.png)

### High Priority Action Items
![High Priority](screenshots/High%20Priority.png)

---

## License

MIT
