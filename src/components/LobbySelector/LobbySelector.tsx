import React from "react";
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
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    return isTomorrow ? `Tomorrow ${time}` : time;
  };

  // betting_open lobbies first
  const sortedLobbies = [...(lobbies || [])].sort((a, b) => {
    if (
      a.status === "betting_open" &&
      b.status !== "betting_open"
    ) {
      return -1;
    }

    if (
      a.status !== "betting_open" &&
      b.status === "betting_open"
    ) {
      return 1;
    }

    return 0;
  });

  return (
    <section className={styles.section}>
      <div className={`${styles.scroll} no-scrollbar`}>
        {sortedLobbies.map((lobby) => {
          const isClosed =
            lobby.status === "bet_closed";

          const isOpen =
            lobby.status === "betting_open";
const isResulted = lobby.status === "resulted";
          const isActive =
            selectedLobby === lobby.lobby_uuid;

          return (
            <button
              key={lobby.lobby_uuid}
           disabled={isClosed || isResulted}
              onClick={() =>
                dispatch(
                  selectLobby(lobby.lobby_uuid)
                )
              }
              className={`
                ${styles.chip}
                ${
                  isClosed
                    ? styles.chipDisabled
                    : isActive
                    ? styles.chipSelected
                    : styles.chipActive
                }
              `}
            >
              <span>
                {formatTime(lobby.result_at)}
              </span>

              {isClosed && (
                <span className={styles.closedBadge}>
                  CLOSED
                </span>
              )}

              {isOpen && (
                <span className={styles.openBadge}>
                  Open
                </span>
              )}
              {isResulted && (
  <span className={styles.resultBadge}>
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