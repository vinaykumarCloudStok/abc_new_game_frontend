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
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    return isTomorrow ? `Tomorrow ${time}` : time;
  };

  // Remove closed lobbies
  const filteredLobbies = (lobbies || []).filter(
    (lobby) => lobby.status !== "bet_closed"
  );

  const now = new Date();

  const sortedLobbies = [...filteredLobbies].sort((a, b) => {
    const aDate = new Date(a.result_at);
    const bDate = new Date(b.result_at);

    const aIsToday =
      aDate.getDate() === now.getDate() &&
      aDate.getMonth() === now.getMonth() &&
      aDate.getFullYear() === now.getFullYear();

    const bIsToday =
      bDate.getDate() === now.getDate() &&
      bDate.getMonth() === now.getMonth() &&
      bDate.getFullYear() === now.getFullYear();

    // Today first
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;

    // Then sort by time
    return aDate.getTime() - bDate.getTime();
  });

  return (
    <section className={styles.section}>
      <div className={`${styles.scroll} no-scrollbar`}>
        {sortedLobbies.map((lobby) => {
          const isOpen = lobby.status === "betting_open";
          const isResulted = lobby.status === "resulted";
          const lobbyDate = new Date(lobby.result_at);
          const isToday =
            lobbyDate.getDate() === new Date().getDate() &&
            lobbyDate.getMonth() === new Date().getMonth() &&
            lobbyDate.getFullYear() === new Date().getFullYear();

          const isActive =
            isToday && selectedLobby === lobby.lobby_uuid;

          return (
            <button
              key={lobby.lobby_uuid}
              disabled={isResulted}
              onClick={() => dispatch(selectLobby(lobby.lobby_uuid))}
              className={`
                ${styles.chip}
                ${isActive
                  ? styles.chipSelected
                  : styles.chipActive
                }
              `}
            >
              <span>{formatTime(lobby.result_at)}</span>

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