import {
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import type {
  InfoData,
  Lobby,
  LobbyResult,
  SocketState,
} from "../../types";

const initialState: SocketState = {
  connected: false,
  loading: true,

  info: {
    user_id: "",
    operator_id: "",
    balance: "0.00",
  },

  isRulesModalOpen: false,

  lobbies: [],

  selectedLobby: null,

  latestResult: null,
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

      if (keepCurrentLobby) {
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

      // IMPORTANT:
      // DO NOT change active when bet_closed
      // ONLY change when resulted/cancelled
      if (
        selectedLobbyData &&
        [
          "resulted",
          "cancelled",
        ].includes(
          selectedLobbyData.status
        )
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
        !currentLobby ||
        [
          "resulted",
          "cancelled",
        ].includes(currentLobby.status)
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
  },
});

export const {
  socketConnected,
  socketDisconnected,

  setInfo,

  toggleRulesModal,

  setLobbies,
  updateLobby,
  addLobby,
  removeLobby,

  selectLobby,

  setLobbyResult,
  clearLatestResult,
} = socketSlice.actions;

export default socketSlice.reducer;