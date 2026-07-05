# claude.md

## Project Overview
This project is a real-time P2P collaborative code editor built for Gen Z developers with a modern dark-mode aesthetic. It solves the problem of frictionless collaborative coding by allowing users to instantly share a room URL and jump into coding together without complex setups. Target users are developers doing remote pair programming, technical interviews, or hackathons.

## Architecture Summary
- **Frontend**: React (Vite) + Monaco Editor + Tailwind + Yjs
- **Backend**: Node.js + Express + Socket.io
- **Transport**: WebRTC (primary data channel) + Socket.io (fallback relay)
- **State**: Redis (Upstash) for room metadata, active users, and version snapshots
- **AI**: Anthropic Claude API proxied through the backend `/api/ai` endpoint

## Concurrency Algorithm Decision
**Algorithm Chosen: CRDT (Yjs)**
I have chosen Yjs because it provides robust, production-ready support for P2P synchronization and integrates seamlessly with Monaco Editor (`y-monaco`) and WebRTC (`y-webrtc`). Writing a custom Operational Transformation (OT) algorithm from scratch to handle all text synchronization edge cases reliably is a massive undertaking, whereas Yjs is mathematically proven to handle high-concurrency offline/online sync smoothly.

**Key files implementing it**:
- `/client/src/utils/crdt.js` (Yjs setup and provider configurations)
- `/client/src/hooks/useCollaboration.js` (Binding Yjs to Monaco inside React)

## Existing UI Components (DO NOT MODIFY)
All components exist in `/client/src/components/`.

1. **`LandingPage.jsx`**
   - **Props expected**: `onJoinRoom(code)`, `onCreateRoom(name)`
   - **State**: Manages `roomName` and `roomCode` internally.
2. **`Toolbar.jsx`**
   - **Props expected**: `roomCode`, `connectionStatus` ('webrtc' | 'relay' | 'disconnected'), `onOpenVersionHistory()`
   - **State**: `copied`, `selectedLang`, `isLangDropdownOpen`
3. **`AppShell.jsx`**
   - **Props expected**: Configured to hold route/logic wrapper if updated, but currently mounts everything. Needs to mock Editor and pass context.
   - **State**: Panel visibility (`isAIPanelOpen`, `isChatPanelOpen`, `isHistoryModalOpen`).
4. **`AIPanel.jsx`**
   - **Props expected**: `isOpen`, `onClose`
   - **State**: Manages `activeTab`, `isLoading`, `response`, `inputText` with mocked setTimeout. We need to replace mock delays with the `useAI()` hook.
5. **`ChatPanel.jsx`**
   - **Props expected**: `isOpen`, `onClose`
   - **State**: Manages `messages`, `inputValue`, `isTyping`. Needs to be wired to `useChat()`.
6. **`CursorOverlay.jsx`**
   - **Props expected**: `children` (the editor text)
   - **State**: Manages purely visual mocked cursor movements. Needs to be replaced with `useCursors()`.
7. **`VersionHistoryModal.jsx`**
   - **Props expected**: `isOpen`, `onClose`
   - **State**: Currently manages `selectedVersion`. Needs to trigger restore callbacks using `useVersionHistory()`.

## Folder Structure
```
/claude.md                        # Architecture documentation and rules
/client/src/
  components/                     # ALL UI COMPONENTS (READ ONLY)
    AIPanel.jsx
    AppShell.jsx
    ChatPanel.jsx
    CursorOverlay.jsx
    Editor.jsx
    LandingPage.jsx
    Toolbar.jsx
    VersionHistoryModal.jsx
  hooks/                          # React hooks for state and network logic
    useAI.js                      
    useChat.js
    useCollaboration.js
    useCursors.js
    useRoom.js
    useVersionHistory.js
    useWebRTC.js
  utils/                          # Core protocol / transport utilities
    crdt.js                       # Yjs logic
    roomUtils.js                  # Room string generation
    transport.js                  # Transport abstraction (WebRTC <-> Socket.io)
  App.jsx                         # Main wire-up
  main.jsx                        # Entry
/server/src/
  index.js                        # Express and Socket.io setup
  handlers/
    chatHandler.js
    historyHandler.js
    roomHandler.js
    signalingHandler.js
  services/
    aiProxy.js
    redis.js
```

## Key Conventions
- **Hooks**: named `use[Feature].js`
- **Transport Abstraction**: `transport.js` exposes exactly `send(data)`, `onMessage(callback)`, `getMode()`. Fallback is handled transparently inside it.
- **Socket Events**: 
  - `room:join`, `room:leave`, `room:create`
  - `rtc:offer`, `rtc:answer`, `rtc:ice`
  - `chat:message`, `chat:typing`
- **Redis Keys**:
  - `room:{roomId}:meta`
  - `room:{roomId}:history`

## Environment Variables
**Client (`/client/.env`)**:
- `VITE_SOCKET_URL`: URL of the Node backend (e.g. `http://localhost:3001` or Render URL)
- `VITE_APP_URL`: Frontend URL for copying room links

**Server (`/server/.env`)**:
- `PORT`: 3001
- `REDIS_URL`: Upstash connection URL
- `REDIS_TOKEN`: Upstash token
- `ANTHROPIC_API_KEY`: API Key for Claude API
- `CLIENT_URL`: Permitted CORS origin

## Development Commands
- **Client**: `cd vite-project && npm run dev`
- **Server**: `cd server && npm run dev`

## Feature Checklist
- [ ] Room creation and shareable URL
- [ ] Real-time collaborative editing (zero conflicts)
- [ ] WebRTC P2P with Socket.io signaling and fallback
- [ ] Live cursors with user labels and colors
- [ ] In-editor chat panel
- [ ] Syntax language selector (synced across peers)
- [ ] Edit history and version restore (CRUD)
- [ ] AI agent panel (explain, fix, generate)
- [ ] All logic wired into existing UI — no UI changes made
- [x] Deployed to Vercel + Render (Configurations ready)

## Known Limitations & Future Improvements
- "WebRTC fails behind symmetric NAT (handled by fallback)"

## Decision Log
- **2026-03-11**: Selected Y.js as the CRDT for real-time conflict resolution because of its WebRTC connector, `y-monaco` binding, and robustness.

## Agent Instructions
Any AI agent reading this file must:
1. Read this file at the start of every new session
2. Read all existing UI components before writing any logic
3. Never modify .jsx files or globals.css unless fixing a broken prop/handler
4. Never expose ANTHROPIC_API_KEY in client-side code
5. Follow Socket.io event naming convention defined above
6. Update Feature Checklist when a feature is complete
7. Log architectural decisions under a ## Decision Log section with date
