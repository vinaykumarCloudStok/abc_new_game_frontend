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
      setLobbies(state, action: PayloadAction<Lobby[]>) {
      state.lobbies = action.payload;
    },
    },
});

export const {
    socketConnected,
    socketDisconnected,setLobbies,
    setInfo,toggleRulesModal,
} = socketSlice.actions;

export default socketSlice.reducer;