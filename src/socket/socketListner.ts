import type { AppDispatch } from "../store";

import {
  socketConnected,
  socketDisconnected,
  setInfo,
  setLobbies,
} from "../store/slices/socketSlice";

import { createSocket, connectSocket } from "./socket";

// ---------------------------------------------------------------------------
// Main Initializer
// ---------------------------------------------------------------------------
export const initSocketListeners = (
  dispatch: AppDispatch,
  token: string,
  gameId: string
) => {
  const socket = createSocket(token, gameId);

  socket?.removeAllListeners();

  // ---- Connection lifecycle -----------------------------------------------
  socket?.on("connect", () => {
    dispatch(socketConnected());

    if (import.meta.env.DEV) {
      console.log("Socket connected:", socket.id);
    }
  });

  socket?.on("disconnect", (reason) => {
    dispatch(socketDisconnected());

    if (import.meta.env.DEV) {
      console.log("Socket disconnected:", reason);
    }
  });

  socket?.on("connect_error", (err) => {
    if (import.meta.env.DEV) {
      console.error("Socket connect error:", err.message);
    }
  });

  // ----------------------------------------------------------------
  // INFO EVENT
  // ----------------------------------------------------------------
  socket?.on("message", (response) => {
  console.log("SOCKET MESSAGE:", response);

  const { eventName, data } = response;

  switch (eventName) {
    case "info":
      dispatch(setInfo(data));
      break;

    case "lobby":
      dispatch(setLobbies(data));
      break;

    default:
      break;
  }
});

  // ---- Connect -------------------------------------------------------------
  connectSocket();
};