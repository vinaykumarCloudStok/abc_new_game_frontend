import type { AppDispatch } from "../store";
import { showPopup } from "../store/slices/popupSlice";

import {
  socketConnected,
  socketDisconnected,
  setInfo,
  setLobbies,
  setLobbyHistory,
  updateLobby,
  addLobby,
  setLobbyResult,
  clearLatestResult,
  expireStickyResult,
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
      case "lobby_history":
        // Store in Redux so the lobby strip can render resulted chips...
        dispatch(setLobbyHistory(data));
        // ...and keep the window event so the Game History tab still works.
        window.dispatchEvent(
          new CustomEvent("lobbyHistory", { detail: data })
        );
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

        // A lobby moving OUT of the open state (closed / resulted / cancelled)
        // means its pending bets are no longer "open". Refresh the bet history
        // so the Open Bets tab immediately drops them.
        if (
          ["bet_closed", "resulted", "cancelled"].includes(data.status)
        ) {
          window.dispatchEvent(new Event("refreshBetHistory"));
        }

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

        // mark lobby resulted AND persist the drawn numbers on the lobby
        // itself, so the InfoCard can keep showing the result even after
        // the short-lived live banner (latestResult) is cleared.
        dispatch(
          updateLobby({
            lobby_uuid: data.lobby_uuid,
            status: "resulted",
            result: data.result ? JSON.stringify(data.result) : null,
          })
        );

        // Clear only the auto live-banner after a short while.
        // We DO NOT remove the lobby tab any more — a closed/resulted
        // tab stays on the strip so the user can tap it later to
        // re-view the drawn number inside the InfoCard.
        setTimeout(() => {
          dispatch(clearLatestResult());
        }, 20000);

        // Keep the just-resulted lobby selected for ~5 minutes so the
        // result stays visible, then advance to the next open lobby
        // (unless the backend already removed it).
        setTimeout(() => {
          dispatch(expireStickyResult(data.lobby_uuid));
        }, 5 * 60 * 1000);

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

        // refresh bet tab after 2 sec
        setTimeout(() => {
          window.dispatchEvent(new Event("refreshBetHistory"));
        }, 2000);

        break;
      default:
        console.log("Unhandled socket event:", eventName);
        break;
    }
  });
// -------------------------------------------------------------------------
// BET ERROR
// -------------------------------------------------------------------------
socket.on("betError", (message) => {
  dispatch(
    showPopup({
      type: "error",
      message: typeof message === "string" ? message : "Invalid Bet",
    })
  );
});
  // -------------------------------------------------------------------------
  // CONNECT
  // -------------------------------------------------------------------------
  connectSocket();
};