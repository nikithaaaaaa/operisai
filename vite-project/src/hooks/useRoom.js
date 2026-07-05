import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `http://${window.location.hostname}:3001`;
export let socket = null;

export const useRoom = () => {
  const [roomId, setRoomId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [user, setUser] = useState(() => {
    // Generate a quick mock user
    const colors = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    const names = ['BlueOtter', 'VioletFox', 'NeonPulse', 'CyberPunk', 'SyntaxError'];
    const rnd = Math.floor(Math.random() * 5);
    return {
      id: uuidv4(),
      name: names[rnd] + Math.floor(Math.random() * 100),
      color: colors[rnd]
    };
  });

  const createRoom = useCallback((name) => {
    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    return newCode;
  }, []);

  const joinRoom = useCallback((code) => {
    if (!socket) {
      socket = io(SOCKET_URL, {
        withCredentials: true,
      });
      
      socket.on('connect', () => {
        console.log('[Socket] Connected to server');
        setIsConnected(true);
        socket.emit('room:join', { roomId: code, user });
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('room:users', (users) => {
        setActiveUsers(users);
      });
    }
    setRoomId(code);
  }, [user]);

  const leaveRoom = useCallback(() => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    setRoomId(null);
    setActiveUsers([]);
    setIsConnected(false);
  }, []);

  return {
    roomId,
    user,
    activeUsers,
    isConnected,
    createRoom,
    joinRoom,
    leaveRoom,
  };
};
