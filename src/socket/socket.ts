import { io, Socket } from "socket.io-client";

const URL = import.meta.env.VITE_APP_BASE_SOCKET_URL

let socket: Socket | null = null;
let currentToken: string | null = null;
let currentGameId: string | null = null;

export const createSocket = (token: string, gameId: string) => {
  const shouldRecreate =
    !socket ||
    currentToken !== token ||
    currentGameId !== gameId;

  if (shouldRecreate) {
    socket?.disconnect();

    currentToken = token;
    currentGameId = gameId;

    socket = io(URL, {
      transports: ["websocket"],
      autoConnect: false,
      query: {
        game_id: gameId,
        token,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }

  return socket;
};

export const connectSocket = () => {
  if (socket && !socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
  currentToken = null;
  currentGameId = null;
};

export const getSocket = () => socket;
