export const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const parseRoomFromUrl = () => {
  const path = window.location.pathname;
  if (path.startsWith('/room/')) {
    return path.split('/')[2].toUpperCase();
  }
  return null;
};
