import { useState, useEffect, useRef } from 'react';
import { socket } from './useRoom';
import { transport } from '../utils/transport';

/**
 * useWebRTC — attempts to upgrade the connection from Socket.io relay to a
 * direct WebRTC P2P data channel. Falls back to relay automatically if ICE
 * negotiation fails within 5 seconds.
 *
 * FIX-3: Listeners are now always registered regardless of user count so the
 * cleanup function always has a matching set of listeners to remove. This
 * prevents dangling listeners when the >2-user early-return path fires.
 */
export const useWebRTC = (roomId, activeUsers, user) => {
  const [connectionMode, setConnectionMode] = useState('connecting');
  const peerRef = useRef(null);

  useEffect(() => {
    if (!socket || !roomId) {
      setConnectionMode('connecting');
      return;
    }

    transport.init(socket, roomId);
    setConnectionMode('relay');

    // ── Always define handlers so cleanup can always remove them ─────────────
    const handleOffer = async ({ offer, sender }) => {
      if (!peerRef.current) await setupPeerConnection(sender, false);
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socket.emit('rtc:answer', { answer, target: sender, roomId });
    };

    const handleAnswer = async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIce = async ({ candidate }) => {
      if (peerRef.current && peerRef.current.remoteDescription) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('[WebRTC] Error adding ICE candidate', e);
        }
      }
    };

    // Relay pipe: forward socket Yjs messages into the transport
    const handleYjsUpdate = ({ update }) => {
      transport.handleRelayMessage(update);
    };

    // Always register — ensures cleanup always has these to remove
    socket.on('rtc:offer',   handleOffer);
    socket.on('rtc:answer',  handleAnswer);
    socket.on('rtc:ice',     handleIce);
    socket.on('yjs:update',  handleYjsUpdate);

    // ── P2P setup: only for exactly 2 users ───────────────────────────────
    if (activeUsers.length > 2) {
      console.info('[WebRTC] >2 users detected — staying on relay mode');
      // Fall through to the cleanup return without attempting P2P
    } else {
      const setupPeerConnection = async (targetId, isInitiator) => {
        const peer = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        peerRef.current = peer;

        if (isInitiator) {
          const channel = peer.createDataChannel('sync');
          channel.onopen = () => {
            console.log('[transport] mode: webrtc');
            transport.setWebRTC(channel);
            setConnectionMode('webrtc');
          };
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit('rtc:offer', { offer, target: targetId, roomId });
        } else {
          peer.ondatachannel = (event) => {
            const channel = event.channel;
            channel.onopen = () => {
              console.log('[transport] mode: webrtc');
              transport.setWebRTC(channel);
              setConnectionMode('webrtc');
            };
          };
        }

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('rtc:ice', { candidate: event.candidate, target: targetId, roomId });
          }
        };

        // Relay fallback: if ICE hasn't connected within 5s, stay on relay
        setTimeout(() => {
          if (
            peer.iceConnectionState !== 'connected' &&
            peer.iceConnectionState !== 'completed'
          ) {
            console.log('[transport] mode: relay (WebRTC timeout)');
            setConnectionMode('relay');
          }
        }, 5000);
      };

      // Initiate P2P when we are the second user to join
      if (activeUsers.length === 2 && activeUsers[1]?.id === user?.id) {
        setupPeerConnection(activeUsers[0].socketId || activeUsers[0].id, true);
      }
    }

    // ── Cleanup always runs and always removes exactly the listeners registered above
    return () => {
      socket.off('rtc:offer',  handleOffer);
      socket.off('rtc:answer', handleAnswer);
      socket.off('rtc:ice',    handleIce);
      socket.off('yjs:update', handleYjsUpdate);
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
    };
  }, [roomId, activeUsers.length, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { connectionMode };
};
