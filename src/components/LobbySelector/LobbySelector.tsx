import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store";

import styles from "./LobbySelector.module.css";
import { selectLobby } from "../../store/slices/socketSlice";

const LobbySelector: React.FC = () => {
  const dispatch = useDispatch();

  const lobbies = useSelector(
    (state: RootState) => state.socketSlice.lobbies
  );

  const selectedLobby = useSelector(
    (state: RootState) => state.socketSlice.selectedLobby
  );

useEffect(() => {
  if (!lobbies?.length) return;

  const savedLobby =
    localStorage.getItem("selectedLobby");

  // KEEP bet_closed active
  // remove only resulted/cancelled
  const availableLobbies = lobbies.filter(
    (lobby) =>
      !["resulted", "cancelled"].includes(
        lobby.status
      )
  );

  // current selected lobby
  const currentLobby = lobbies.find(
    (lobby) =>
      lobby.lobby_uuid === selectedLobby
  );

  // KEEP selected if betting_open OR bet_closed
  if (
    currentLobby &&
    !["resulted", "cancelled"].includes(
      currentLobby.status
    )
  ) {
    return;
  }

  // restore saved lobby
  const validSavedLobby =
    availableLobbies.find(
      (lobby) =>
        lobby.lobby_uuid === savedLobby
    );

  if (validSavedLobby) {
    dispatch(
      selectLobby(
        validSavedLobby.lobby_uuid
      )
    );

    return;
  }

  // select next betting_open
  const nextOpenLobby =
    availableLobbies.find(
      (lobby) =>
        lobby.status === "betting_open"
    );

  if (nextOpenLobby) {
    dispatch(
      selectLobby(
        nextOpenLobby.lobby_uuid
      )
    );

    localStorage.setItem(
      "selectedLobby",
      nextOpenLobby.lobby_uuid
    );
  }
}, [lobbies, selectedLobby, dispatch]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);

    const now = new Date();

    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    const isTomorrow =
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear();

    const time = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    return isTomorrow
      ? `Tomorrow ${time}`
      : time;
  };

  // Remove bet_closed when any lobby becomes resulted
  const hasResultedLobby = (lobbies || []).some(
    (lobby) => lobby.status === "resulted"
  );

const filteredLobbies = (lobbies || [])
  .filter((lobby) => {
    if (
      hasResultedLobby &&
      lobby.status === "bet_closed"
    ) {
      return false;
    }

    return true;
  })
  .sort(
    (a, b) =>
      new Date(a.result_at).getTime() -
      new Date(b.result_at).getTime()
  );
  const handleSelectLobby = (
    lobbyUuid: string
  ) => {
    localStorage.setItem(
      "selectedLobby",
      lobbyUuid
    );

    dispatch(selectLobby(lobbyUuid));
  };

  return (
    <section className={styles.section}>
      <div className={`${styles.scroll} no-scrollbar`}>
        {filteredLobbies.map((lobby) => {
          const isOpen =
            lobby.status === "betting_open";

          const isClosed =
            lobby.status === "bet_closed";

          const isResulted =
            lobby.status === "resulted";

          const isActive =
            selectedLobby === lobby.lobby_uuid;

          return (
            <button
              key={lobby.lobby_uuid}
              disabled={isResulted}
              onClick={() =>
                handleSelectLobby(
                  lobby.lobby_uuid
                )
              }
              className={`
                ${styles.chip}
                ${
                  isActive
                    ? styles.chipSelected
                    : styles.chipActive
                }
              `}
            >
              <span>
                {formatTime(lobby.result_at)}
              </span>

              {isOpen && (
                <span
                  className={styles.openBadge}
                >
                  Open
                </span>
              )}

              {isClosed && (
                <span
                  className={styles.closedBadge}
                >
                  Closed
                </span>
              )}

              {isResulted && (
                <span
                  className={styles.resultBadge}
                >
                  Resulted
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default LobbySelector;