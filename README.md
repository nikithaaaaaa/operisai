# OperisAI — Real-Time P2P Collaborative IDE

A browser-based collaborative code editor with built-in AI assistance. 
No installation. No sign-up. Share a link and start coding.

## Features

- Real-time collaborative editing via Yjs CRDT + WebRTC P2P
- Monaco Editor (the engine behind VS Code)
- AI Assistance powered by Google Gemini 2.0 Flash
  - Explain, Fix, Generate, and Review code
  - Inline AI prompt with Ctrl+K
- Multi-file project support via File System Access API
- Persistent room chat with 7-day history (Redis)
- Version history snapshots with collaborative restore
- Remote cursor overlays with user presence
- Zero friction — no account required

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Monaco Editor |
| Sync | Yjs (CRDT), y-monaco, WebRTC |
| AI | Google Gemini 2.0 Flash |
| Backend | Node.js, Express 5, Socket.io |
| Persistence | Redis |
| Deployment | Vercel (frontend), Render (backend) |

## Getting Started

### Prerequisites
- Node.js v18+
- A Google Gemini API key (free at https://aistudio.google.com/apikey)

### Run locally

**Backend:**
```bash
cd server
cp .env.example .env
# Add your GEMINI_API_KEY to .env
npm install
node src/index.js
```

**Frontend:**
```bash
cd vite-project
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Environment Variables

Create `server/.env` based on `server/.env.example`:
PORT=3001
GEMINI_API_KEY=your_key_here
CLIENT_URL=http://localhost:5173
REDIS_URL=          # optional, falls back to in-memory

## Project Structure
├── server/                 # Node.js backend
│   └── src/
│       ├── handlers/       # Socket.io event handlers
│       └── services/       # AI proxy, Redis, Yjs persistence
└── vite-project/           # React frontend
└── src/
├── components/     # UI components (AppShell, AIPanel, etc.)
├── hooks/          # useCollaboration, useFileSystem, useAI...
├── pages/          # LandingPage, SplashPage
└── utils/          # CRDT, transport, theme

## Academic Context

Final Year Project — 6th Semester BCA  
**Student:** Nikitha. T (ENG23CA0051)  
**Guide:** Mr. Ashutosh Kumar  
**Institution:** School of Computer Applications, Dayananda Sagar University  
**Year:** 2025–2026
