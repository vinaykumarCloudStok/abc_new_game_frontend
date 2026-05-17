import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { InfoData, Lobby, LobbyResult, SocketState } from "../../types";


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
        // ----------------------------------------------------------------
        // SOCKET
        // ----------------------------------------------------------------
        socketConnected(state) {
            state.connected = true;
        },

        socketDisconnected(state) {
            state.connected = false;
        },

        // ----------------------------------------------------------------
        // INFO EVENT
        // ----------------------------------------------------------------
        setInfo(state, action: PayloadAction<InfoData>) {
            state.info = action.payload;
        },
        toggleRulesModal(state) {
            state.isRulesModalOpen = !state.isRulesModalOpen;
        },
       setLobbies: (
  state,
  action: PayloadAction<Lobby[]>
) => {
  state.lobbies = action.payload;

  // AUTO SELECT OPEN LOBBY
  const openLobby = action.payload.find(
    (lobby) => lobby.status === "betting_open"
  );

  state.selectedLobby = openLobby
    ? openLobby.lobby_uuid
    : action.payload.length > 0
    ? action.payload[0].lobby_uuid
    : null;
},

        // -----------------------------------------------------------------------
        // UPDATE SINGLE LOBBY
        // -----------------------------------------------------------------------
       updateLobby: (
  state,
  action: PayloadAction<
    Partial<Lobby> & { lobby_uuid: string }
  >
) => {
  const updatedLobby = action.payload;

  const index = state.lobbies.findIndex(
    (lobby) =>
      lobby.lobby_uuid === updatedLobby.lobby_uuid
  );

  if (index !== -1) {
    state.lobbies[index] = {
      ...state.lobbies[index],
      ...updatedLobby,
    };
  }

  // CHECK CURRENT SELECTED LOBBY
  const selected = state.lobbies.find(
    (lobby) =>
      lobby.lobby_uuid === state.selectedLobby
  );

  // IF CURRENT SELECTED LOBBY CLOSED
  if (
    selected &&
    ["bet_closed", "resulted", "cancelled"].includes(
      selected.status
    )
  ) {
    const nextOpenLobby = state.lobbies.find(
      (lobby) =>
        lobby.status === "betting_open"
    );

    state.selectedLobby = nextOpenLobby
      ? nextOpenLobby.lobby_uuid
      : null;
  }
},

        // -----------------------------------------------------------------------
        // ADD NEW LOBBY
        // -----------------------------------------------------------------------
        addLobby: (state, action: PayloadAction<Lobby[]>) => {
            const newLobbies = action.payload;

            // prevent duplicate
            const filtered = newLobbies.filter(
                (newLobby) =>
                    !state.lobbies.some(
                        (existing) =>
                            existing.lobby_uuid === newLobby.lobby_uuid
                    )
            );

            state.lobbies = [...filtered, ...state.lobbies];

            // AUTO SELECT NEW OPEN LOBBY
            const latestOpenLobby = filtered.find(
                (lobby) => lobby.status === "betting_open"
            );

            if (latestOpenLobby) {
                state.selectedLobby = latestOpenLobby.lobby_uuid;
            }
        },
        selectLobby: (state, action: PayloadAction<string>) => {
            state.selectedLobby = action.payload;
        },
        setLobbyResult: (
            state,
            action: PayloadAction<LobbyResult>
        ) => {
            state.latestResult = action.payload;
        },
        removeLobby: (state, action: PayloadAction<string>) => {
            state.lobbies = state.lobbies.filter(
                (lobby) => lobby.lobby_uuid !== action.payload
            );

            if (state.selectedLobby === action.payload) {
                const openLobby = state.lobbies.find(
                    (lobby) => lobby.status === "betting_open"
                );

                state.selectedLobby = openLobby
                    ? openLobby.lobby_uuid
                    : state.lobbies.length > 0
                        ? state.lobbies[0].lobby_uuid
                        : null;
            }
        },

        clearLatestResult: (state) => {
            state.latestResult = null;
        },
    },
});

export const {
    socketConnected, updateLobby, addLobby,
    socketDisconnected, setLobbies, setLobbyResult,
    setInfo, toggleRulesModal, selectLobby, removeLobby,
    clearLatestResult,
} = socketSlice.actions;

export default socketSlice.reducer;