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
  // sort by result_at ascending
  const sortedLobbies = [...action.payload].sort(
    (a, b) =>
      new Date(a.result_at).getTime() -
      new Date(b.result_at).getTime()
  );

  state.lobbies = sortedLobbies;

  // only visible active lobbies
  const availableLobbies =
    sortedLobbies.filter(
      (lobby) =>
        ![
          "bet_closed",
          "resulted",
          "cancelled",
        ].includes(lobby.status)
    );

  // select earliest betting_open lobby
  const firstOpenLobby =
    availableLobbies.find(
      (lobby) =>
        lobby.status === "betting_open"
    );

  state.selectedLobby = firstOpenLobby
    ? firstOpenLobby.lobby_uuid
    : null;

  // update localStorage
  if (firstOpenLobby) {
    localStorage.setItem(
      "selectedLobby",
      firstOpenLobby.lobby_uuid
    );
  }
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

  const selectedLobbyData = state.lobbies.find(
    (lobby) =>
      lobby.lobby_uuid === state.selectedLobby
  );

  if (
    selectedLobbyData &&
    ["bet_closed", "resulted", "cancelled"].includes(
      selectedLobbyData.status
    )
  ) {
    const nextOpenLobby = state.lobbies.find(
      (lobby) => lobby.status === "betting_open"
    );

    state.selectedLobby = nextOpenLobby
      ? nextOpenLobby.lobby_uuid
      : null;

    // IMPORTANT
    if (nextOpenLobby) {
      localStorage.setItem(
        "selectedLobby",
        nextOpenLobby.lobby_uuid
      );
    }
  }
},

        // -----------------------------------------------------------------------
        // ADD NEW LOBBY
        // -----------------------------------------------------------------------
addLobby: (
  state,
  action: PayloadAction<Lobby[]>
) => {
  const newLobbies = action.payload;

  // prevent duplicates
  const filtered = newLobbies.filter(
    (newLobby) =>
      !state.lobbies.some(
        (existing) =>
          existing.lobby_uuid ===
          newLobby.lobby_uuid
      )
  );

  // merge lobbies
  state.lobbies = [
    ...state.lobbies,
    ...filtered,
  ];

  // sort by result_at time
  state.lobbies.sort(
    (a, b) =>
      new Date(a.result_at).getTime() -
      new Date(b.result_at).getTime()
  );

  // KEEP current selected lobby active
  const currentLobby = state.lobbies.find(
    (lobby) =>
      lobby.lobby_uuid === state.selectedLobby
  );

  // only change if current selected invalid
  if (
    !currentLobby ||
    ["bet_closed", "resulted", "cancelled"].includes(
      currentLobby.status
    )
  ) {
    const nextOpenLobby = state.lobbies.find(
      (lobby) =>
        lobby.status === "betting_open"
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