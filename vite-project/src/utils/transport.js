// transport.js
class Transport {
  constructor() {
    this.mode = 'relay'; // 'webrtc' | 'relay' | 'disconnected'
    this.dataChannel = null;
    this.socket = null;
    this.roomId = null;
    this.callbacks = [];
  }

  init(socket, roomId) {
    this.socket = socket;
    this.roomId = roomId;
    this.mode = 'relay'; // Start with relay until WebRTC connects
  }

  setWebRTC(channel) {
    this.dataChannel = channel;
    this.mode = 'webrtc';
    
    channel.onmessage = (event) => {
      this.triggerMessage(JSON.parse(event.data));
    };

    channel.onclose = () => {
      console.log('[transport] WebRTC channel closed, falling back to relay');
      this.mode = 'relay';
      this.dataChannel = null;
    };
  }

  send(channelName, data) {
    const payload = { channel: channelName, data };
    
    if (this.mode === 'webrtc' && this.dataChannel?.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(payload));
    } else if (this.socket && this.roomId) {
      // Fallback to socket relay
      this.socket.emit('yjs:update', { update: payload, roomId: this.roomId });
    }
  }

  // Used by Socket fallback to pipe data in
  handleRelayMessage(payload) {
    if (this.mode !== 'webrtc') {
      this.triggerMessage(payload);
    }
  }

  onMessage(callback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  triggerMessage(payload) {
    this.callbacks.forEach(cb => cb(payload));
  }

  getMode() {
    return this.mode;
  }
}

export const transport = new Transport();
