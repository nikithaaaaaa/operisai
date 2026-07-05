# CodeSync — P2P Collaborative IDE

A real-time, peer-to-peer collaborative code editor. Share a room code and code together instantly — no accounts, no setup.

## ✨ Features

- **Real-time collaboration** — Yjs CRDT ensures zero-conflict concurrent editing
- **WebRTC P2P** — direct peer-to-peer sync when possible, Socket.io relay fallback
- **Live cursors** — see collaborators' cursors with name labels in real time
- **Multi-file workspace** — create, rename, delete files; each synced via Yjs
- **In-editor chat** — room chat with typing indicators
- **Version history** — take snapshots, preview, and restore previous states
- **AI Assistant** — explain, fix, and generate code via Google Gemini
- **Folder import** — drag a local folder to start a session with existing files
- **10 languages** — JS, TS, Python, Rust, Go, HTML, CSS, JSON, Markdown, SQL

## ⚠️ Known Limitations

- WebRTC P2P is limited to **2 users** — 3+ users automatically use relay mode
- No user authentication — identities are anonymous and session-scoped
- Document state persists across disconnections **only if Redis is configured**

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- (Optional) Redis instance for persistence and version history

### Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd <repo-folder>

# 2. Install server dependencies
cd server && npm install

# 3. Configure server environment
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY

# 4. Install frontend dependencies
cd ../vite-project && npm install
```

### Run (two terminals)

```bash
# Terminal 1 — Backend server (port 3001)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd vite-project && npm run dev
```

Open **http://localhost:5173**

## 🌍 Environment Variables

### `server/.env`

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 3001) |
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |
| `REDIS_URL` | No | Redis connection URL (uses in-memory fallback if omitted) |
| `CLIENT_URL` | No | Frontend origin for CORS (default: http://localhost:5173) |

### `vite-project/.env` (optional)

| Variable | Description |
|---|---|
| `VITE_SOCKET_URL` | Backend URL (default: http://localhost:3001) |

## 🏗️ Architecture

**Frontend:** React 19 + Vite + Monaco Editor + Yjs CRDT + Tailwind CSS v4  
**Backend:** Node.js ESM + Express 5 + Socket.io 4  
**Transport:** WebRTC RTCDataChannel (P2P, 2 users) → Socket.io relay (fallback, N users)  
**AI:** Google Gemini 1.5 Flash proxied through backend  
**Persistence:** Redis (Upstash or local) with in-memory Map fallback for development  

## 🚢 Deployment

**Frontend → Vercel:** `vercel.json` is already configured. Push `vite-project/` and set `VITE_SOCKET_URL` to your Render backend URL.

**Backend → Render:** `render.yaml` is already configured. Set `GEMINI_API_KEY`, `REDIS_URL`, and `CLIENT_URL` (your Vercel URL) in the Render dashboard.
