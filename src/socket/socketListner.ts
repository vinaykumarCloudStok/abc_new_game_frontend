import type { AppDispatch } from "../store";
import { showPopup } from "../store/slices/popupSlice";

import {
  socketConnected,
  socketDisconnected,
  setInfo,
  setLobbies,
  updateLobby,
  addLobby,
  setLobbyResult,
  removeLobby,
  clearLatestResult,
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
    case "settlement":
      dispatch(
        showPopup({
          type: data.totalWinAmount > 0 ? "success" : "error",
          message: `${data.message} Bet: ₹${data.totalBetAmount} | Win: ₹${data.totalWinAmount}`,
        })
      );
      break;
      // ---------------------------------------------------------------------
      // UPDATE SINGLE LOBBY
      // ---------------------------------------------------------------------
     case "lobby_updated":
  dispatch(updateLobby(data));

  // SHOW ROLLBACK POPUP
  if (data.status === "cancelled") {
    dispatch(
      showPopup({
        type: "error",
        message: "Lobby cancelled. Your bets have been rolled back.",
      })
    );
  }

  break;
      case "lobby_result":
        dispatch(setLobbyResult(data));

        // mark lobby resulted
        dispatch(
          updateLobby({
            lobby_uuid: data.lobby_uuid,
            status: "resulted",
          })
        );

        // remove after 2 sec
        setTimeout(() => {
          dispatch(removeLobby(data.lobby_uuid));
          dispatch(clearLatestResult());
        }, 7000);

        break;
      // ---------------------------------------------------------------------
      // CREATE NEW LOBBY
      // ---------------------------------------------------------------------
      case "lobby_created":
        dispatch(addLobby(data));
        break;
      case "bet":
        dispatch(
          showPopup({
            type: "success",
            message: data.message,
          })
        );
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