import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { InfoData, Lobby, SocketState } from "../../types";


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
     setLobbies: (state, action: PayloadAction<Lobby[]>) => {
  state.lobbies = action.payload;

  // auto select first lobby
  if (
    action.payload.length > 0 &&
    !state.selectedLobby
  ) {
    state.selectedLobby =
      action.payload[0].lobby_uuid;
  }
},

    // -----------------------------------------------------------------------
    // UPDATE SINGLE LOBBY
    // -----------------------------------------------------------------------
  updateLobby: (state, action: PayloadAction<Lobby>) => {
  const updatedLobby = action.payload;

  const index = state.lobbies.findIndex(
    (lobby) => lobby.lobby_uuid === updatedLobby.lobby_uuid
  );

  if (index !== -1) {
    state.lobbies[index] = {
      ...state.lobbies[index],
      ...updatedLobby,
    };
  } else {
    state.lobbies.unshift(updatedLobby);
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
    },
    selectLobby: (state, action: PayloadAction<string>) => {
  state.selectedLobby = action.payload;
},
    },
});

export const {
    socketConnected,updateLobby,addLobby,
    socketDisconnected, setLobbies,
    setInfo, toggleRulesModal,selectLobby,
} = socketSlice.actions;

export default socketSlice.reducer;