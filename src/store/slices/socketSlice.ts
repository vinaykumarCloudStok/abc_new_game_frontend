import {
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import type {
  InfoData,
  Lobby,
  LobbyHistoryItem,
  LobbyResult,
  SelectedResult,
  SocketState,
} from "../../types";

const initialState: SocketState = {
  connected: false,
  loading: true,

  info: {
    user_id: "",
    operator_id: "",
    balance: "0.00",
    isAgent: 0,
  },

  isRulesModalOpen: false,

  lobbies: [],

  // today's resulted lobbies (from the `lobby_history` socket event)
  lobbyHistory: [],

  selectedLobby: null,

  latestResult: null,

  // result the user opened by tapping a closed/resulted lobby tab
  selectedResult: null,

  // a freshly-resulted lobby kept on screen for a short window
  stickyResultLobby: null,
};

// True while the currently-selected lobby is a just-resulted lobby that is
// still inside its "keep on screen" window AND still present in the list.
// While this holds, auto-switch logic must NOT move away from it.
const STICKY_RESULT_MS = 5 * 60 * 1000; // 5 minutes

const isStickyHeld = (state: SocketState): boolean => {
  const s = state.stickyResultLobby;
  if (!s) return false;
  if (s.lobby_uuid !== state.selectedLobby) return false;
  if (Date.now() >= s.until) return false;
  return state.lobbies.some((l) => l.lobby_uuid === s.lobby_uuid);
};

const socketSlice = createSlice({
  name: "socket",

  initialState,

  reducers: {
    // ------------------------------------------------------------
    // SOCKET
    // ------------------------------------------------------------
    socketConnected(state) {
      state.connected = true;
    },

    socketDisconnected(state) {
      state.connected = false;
    },

    // ------------------------------------------------------------
    // INFO
    // ------------------------------------------------------------
    setInfo(
      state,
      action: PayloadAction<InfoData>
    ) {
      state.info = action.payload;
    },

    toggleRulesModal(state) {
      state.isRulesModalOpen =
        !state.isRulesModalOpen;
    },

    // ------------------------------------------------------------
    // SET LOBBIES
    // ------------------------------------------------------------
    setLobbies: (
      state,
      action: PayloadAction<Lobby[]>
    ) => {
      // sort by result_at ASC
      const sortedLobbies = [
        ...action.payload,
      ].sort(
        (a, b) =>
          new Date(a.result_at).getTime() -
          new Date(b.result_at).getTime()
      );

      state.lobbies = sortedLobbies;

      // check current selected lobby
      const currentLobby =
        sortedLobbies.find(
          (lobby) =>
            lobby.lobby_uuid ===
            state.selectedLobby
        );

      // KEEP selected lobby if:
      // betting_open OR bet_closed
      const keepCurrentLobby =
        currentLobby &&
        ![
          "resulted",
          "cancelled",
        ].includes(currentLobby.status);

      // Keep a freshly-resulted lobby on screen during its sticky window.
      if (keepCurrentLobby || isStickyHeld(state)) {
        return;
      }

      // try localStorage
      const savedLobby =
        localStorage.getItem(
          "selectedLobby"
        );

      const savedLobbyExists =
        sortedLobbies.find(
          (lobby) =>
            lobby.lobby_uuid ===
            savedLobby &&
            ![
              "resulted",
              "cancelled",
            ].includes(lobby.status)
        );

      if (savedLobbyExists) {
        state.selectedLobby =
          savedLobbyExists.lobby_uuid;

        return;
      }

      // select first betting_open
      const firstOpenLobby =
        sortedLobbies.find(
          (lobby) =>
            lobby.status ===
            "betting_open"
        );

      state.selectedLobby =
        firstOpenLobby
          ? firstOpenLobby.lobby_uuid
          : null;

      if (firstOpenLobby) {
        localStorage.setItem(
          "selectedLobby",
          firstOpenLobby.lobby_uuid
        );
      }
    },

    // ------------------------------------------------------------
    // LOBBY HISTORY (today's resulted lobbies, pushed on connect via
    // the `lobby_history` socket event). Stored so the lobby strip can
    // render them as resulted chips and so a tap can show their result.
    // ------------------------------------------------------------
    setLobbyHistory: (
      state,
      action: PayloadAction<LobbyHistoryItem[]>
    ) => {
      const incoming = Array.isArray(action.payload)
        ? action.payload
        : [];

      // de-dupe by lobby_uuid (keep the latest entry for a uuid)
      const map = new Map<string, LobbyHistoryItem>();
      for (const item of incoming) {
        if (item?.lobby_uuid) map.set(item.lobby_uuid, item);
      }

      // newest first
      state.lobbyHistory = Array.from(map.values()).sort(
        (a, b) =>
          new Date(b.result_at).getTime() -
          new Date(a.result_at).getTime()
      );
    },

    // ------------------------------------------------------------
    // UPDATE SINGLE LOBBY
    // ------------------------------------------------------------
    updateLobby: (
      state,
      action: PayloadAction<
        Partial<Lobby> & {
          lobby_uuid: string;
        }
      >
    ) => {
      const updatedLobby =
        action.payload;

      const index =
        state.lobbies.findIndex(
          (lobby) =>
            lobby.lobby_uuid ===
            updatedLobby.lobby_uuid
        );

      // update lobby
      if (index !== -1) {
        state.lobbies[index] = {
          ...state.lobbies[index],
          ...updatedLobby,
        };
      }

      // re-sort
      state.lobbies.sort(
        (a, b) =>
          new Date(a.result_at).getTime() -
          new Date(b.result_at).getTime()
      );

      const selectedLobbyData =
        state.lobbies.find(
          (lobby) =>
            lobby.lobby_uuid ===
            state.selectedLobby
        );

      // When the SELECTED lobby has just resulted, keep it on screen for a
      // short window (so the user can see the drawn result in the InfoCard)
      // instead of instantly jumping to the next lobby. The switch happens
      // later via expireStickyResult (5 min) or when the backend removes it.
      if (
        selectedLobbyData &&
        selectedLobbyData.lobby_uuid === updatedLobby.lobby_uuid &&
        updatedLobby.status === "resulted"
      ) {
        state.stickyResultLobby = {
          lobby_uuid: selectedLobbyData.lobby_uuid,
          until: Date.now() + STICKY_RESULT_MS,
        };
        return; // do NOT auto-switch yet
      }

      // IMPORTANT:
      // DO NOT change active when bet_closed
      // ONLY change when resulted/cancelled (and not while a result is held)
      if (
        selectedLobbyData &&
        [
          "resulted",
          "cancelled",
        ].includes(
          selectedLobbyData.status
        ) &&
        !isStickyHeld(state)
      ) {
        const nextOpenLobby =
          state.lobbies.find(
            (lobby) =>
              lobby.status ===
              "betting_open"
          );

        state.selectedLobby =
          nextOpenLobby
            ? nextOpenLobby.lobby_uuid
            : null;

        if (nextOpenLobby) {
          localStorage.setItem(
            "selectedLobby",
            nextOpenLobby.lobby_uuid
          );
        }
      }
    },

    // ------------------------------------------------------------
    // ADD NEW LOBBY
    // ------------------------------------------------------------
    addLobby: (
      state,
      action: PayloadAction<Lobby[]>
    ) => {
      const newLobbies =
        action.payload;

      // remove duplicates
      const filtered =
        newLobbies.filter(
          (newLobby) =>
            !state.lobbies.some(
              (existing) =>
                existing.lobby_uuid ===
                newLobby.lobby_uuid
            )
        );

      // merge
      state.lobbies = [
        ...state.lobbies,
        ...filtered,
      ];

      // sort
      state.lobbies.sort(
        (a, b) =>
          new Date(a.result_at).getTime() -
          new Date(b.result_at).getTime()
      );

      // keep current selected lobby
      const currentLobby =
        state.lobbies.find(
          (lobby) =>
            lobby.lobby_uuid ===
            state.selectedLobby
        );

      // only change if current lobby invalid
      if (
        (!currentLobby ||
          [
            "resulted",
            "cancelled",
          ].includes(currentLobby.status)) &&
        !isStickyHeld(state)
      ) {
        const nextOpenLobby =
          state.lobbies.find(
            (lobby) =>
              lobby.status ===
              "betting_open"
          );

        state.selectedLobby =
          nextOpenLobby
            ? nextOpenLobby.lobby_uuid
            : null;

        if (nextOpenLobby) {
          localStorage.setItem(
            "selectedLobby",
            nextOpenLobby.lobby_uuid
          );
        }
      }
    },

    // ------------------------------------------------------------
    // SELECT LOBBY
    // ------------------------------------------------------------
    selectLobby: (
      state,
      action: PayloadAction<string>
    ) => {
      state.selectedLobby =
        action.payload;
    },

    // ------------------------------------------------------------
    // RESULT
    // ------------------------------------------------------------
    setLobbyResult: (
      state,
      action: PayloadAction<LobbyResult>
    ) => {
      state.latestResult =
        action.payload;
    },

    clearLatestResult: (state) => {
      state.latestResult = null;
    },

    // ------------------------------------------------------------
    // SELECTED RESULT (tap a closed / resulted lobby tab to view
    // its drawn number inside the InfoCard)
    // ------------------------------------------------------------
    setSelectedResult: (
      state,
      action: PayloadAction<SelectedResult>
    ) => {
      state.selectedResult = action.payload;
    },

    clearSelectedResult: (state) => {
      state.selectedResult = null;
    },

    // ------------------------------------------------------------
    // REMOVE LOBBY
    // ------------------------------------------------------------
    removeLobby: (
      state,
      action: PayloadAction<string>
    ) => {
      state.lobbies =
        state.lobbies.filter(
          (lobby) =>
            lobby.lobby_uuid !==
            action.payload
        );

      // backend removed this lobby → drop any sticky hold on it
      if (
        state.stickyResultLobby?.lobby_uuid === action.payload
      ) {
        state.stickyResultLobby = null;
      }

      // if selected removed
      if (
        state.selectedLobby ===
        action.payload
      ) {
        const nextOpenLobby =
          state.lobbies.find(
            (lobby) =>
              lobby.status ===
              "betting_open"
          );

        state.selectedLobby =
          nextOpenLobby
            ? nextOpenLobby.lobby_uuid
            : state.lobbies.length > 0
              ? state.lobbies[0]
                .lobby_uuid
              : null;

        if (nextOpenLobby) {
          localStorage.setItem(
            "selectedLobby",
            nextOpenLobby.lobby_uuid
          );
        }
      }
    },

    // ------------------------------------------------------------
    // EXPIRE STICKY RESULT
    // Called ~5 min after a lobby resulted. Releases the hold and, if
    // we are still sitting on that resulted lobby, advances to the next
    // open one. Safe to call for an already-replaced sticky (no-op).
    // ------------------------------------------------------------
    expireStickyResult: (
      state,
      action: PayloadAction<string | undefined>
    ) => {
      const uuid = action.payload;

      // If a newer result replaced this one, ignore this stale timer.
      if (
        uuid &&
        state.stickyResultLobby &&
        state.stickyResultLobby.lobby_uuid !== uuid
      ) {
        return;
      }

      state.stickyResultLobby = null;

      const current = state.lobbies.find(
        (lobby) => lobby.lobby_uuid === state.selectedLobby
      );

      // only advance if we are still on a resulted/cancelled/removed lobby
      if (
        !current ||
        ["resulted", "cancelled"].includes(current.status)
      ) {
        const nextOpenLobby = state.lobbies.find(
          (lobby) => lobby.status === "betting_open"
        );

        state.selectedLobby = nextOpenLobby
          ? nextOpenLobby.lobby_uuid
          : null;

        if (nextOpenLobby) {
          localStorage.setItem(
            "selectedLobby",
            nextOpenLobby.lobby_uuid
          );
        }
      }
    },
  },
});

export const {
  socketConnected,
  socketDisconnected,

  setInfo,

  toggleRulesModal,

  setLobbies,
  setLobbyHistory,
  updateLobby,
  addLobby,
  removeLobby,

  selectLobby,

  setLobbyResult,
  clearLatestResult,
  setSelectedResult,
  clearSelectedResult,
  expireStickyResult,
} = socketSlice.actions;

export default socketSlice.reducer;