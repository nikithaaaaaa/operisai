import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AppShell from './components/AppShell';
import ErrorBoundary from './components/ErrorBoundary';
import SplashPage from './pages/SplashPage';
import { useRoom } from './hooks/useRoom';
import { generateRoomCode } from './utils/roomUtils';
import { setInitialFiles } from './hooks/useFileSystem';

function RoomWrapper() {
  const { roomId } = useParams();
  const { user, joinRoom, leaveRoom, activeUsers, isConnected } = useRoom();

  useEffect(() => {
    if (roomId) {
      joinRoom(roomId);
    }
    return () => leaveRoom();
  }, [roomId, joinRoom, leaveRoom]);

  // TASK-Q6: Show a proper loading state instead of a blank screen
  if (!user || !isConnected) {
    return (
      <div className="w-full h-screen bg-[var(--color-editor-base)] flex flex-col items-center justify-center gap-4">
        <div
          className="w-10 h-10 rounded-full border-2 border-[var(--color-editor-border)] border-t-[var(--color-accent-primary)]"
          style={{ animation: 'spin 0.8s linear infinite' }}
        />
        <p className="text-[var(--color-text-secondary)] text-sm">Joining room...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppShell roomCode={roomId} user={user} activeUsers={activeUsers} />
    </ErrorBoundary>
  );
}

function Home() {
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    navigate(`/room/${code}`);
  };

  const handleJoinRoom = (code) => {
    if (code) navigate(`/room/${code}`);
  };

  // TASK-M3: Use sessionStorage to hand off imported files — avoids the
  // dynamic import() double-module-instance issue. setInitialFiles writes to
  // sessionStorage; useFileSystem reads and clears it on mount.
  const handleOpenFolder = (files) => {
    setInitialFiles(files);
    const code = generateRoomCode();
    navigate(`/room/${code}`);
  };

  return <LandingPage onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} onOpenFolder={handleOpenFolder} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<SplashPage />} />
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<RoomWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
