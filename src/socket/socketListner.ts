import type { AppDispatch } from "../store";

import {
  socketConnected,
  socketDisconnected,
  setInfo,
  setLobbies,
  updateLobby,
  addLobby,
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

  if (!socket) return;

  socket.removeAllListeners();

  // -------------------------------------------------------------------------
  // CONNECTION EVENTS
  // -------------------------------------------------------------------------
  socket.on("connect", () => {
    dispatch(socketConnected());

    if (import.meta.env.DEV) {
      console.log("Socket connected:", socket.id);
    }
  });

  socket.on("disconnect", (reason) => {
    dispatch(socketDisconnected());

    if (import.meta.env.DEV) {
      console.log("Socket disconnected:", reason);
    }
  });

  socket.on("connect_error", (err) => {
    if (import.meta.env.DEV) {
      console.error("Socket connect error:", err.message);
    }
  });

  // -------------------------------------------------------------------------
  // MAIN MESSAGE EVENT
  // -------------------------------------------------------------------------
  socket.on("message", (response) => {
    console.log("SOCKET RESPONSE:", response);

    if (!response) return;

    const { eventName, data } = response;

    switch (eventName) {
      // ---------------------------------------------------------------------
      // INFO
      // ---------------------------------------------------------------------
      case "info":
        dispatch(setInfo(data));
        break;

      // ---------------------------------------------------------------------
      // INITIAL LOBBY LIST
      // ---------------------------------------------------------------------
      case "lobby":
        dispatch(setLobbies(data));
        break;

      // ---------------------------------------------------------------------
      // UPDATE SINGLE LOBBY
      // ---------------------------------------------------------------------
      case "lobby_updated":
        dispatch(updateLobby(data));
        break;

      // ---------------------------------------------------------------------
      // CREATE NEW LOBBY
      // ---------------------------------------------------------------------
      case "lobby_created":
        dispatch(addLobby(data));
        break;

      default:
        console.log("Unhandled socket event:", eventName);
        break;
    }
  });

  // -------------------------------------------------------------------------
  // CONNECT
  // -------------------------------------------------------------------------
  connectSocket();
};