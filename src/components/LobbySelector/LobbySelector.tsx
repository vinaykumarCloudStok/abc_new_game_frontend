import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import styles from "./LobbySelector.module.css";

const LobbySelector: React.FC = () => {
  const lobbies = useSelector(
    (state: RootState) => state.socketSlice.lobbies
  );

 const formatTime = (dateString: string) => {
  const date = new Date(dateString);

  const now = new Date();

  const isTomorrow =
    date.getDate() === now.getDate() + 1 &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return isTomorrow ? `Tomorrow ${time}` : time;
};

  return (
    <section className={styles.section}>
      <div className={`${styles.scroll} no-scrollbar`}>
        {lobbies?.map((lobby) => {
          const isClosed = lobby.status === "bet_closed";

          return (
            <button
              key={lobby.lobby_uuid}
              disabled={isClosed}
              className={`
                ${styles.chip}
                ${isClosed ? styles.chipDisabled : styles.chipActive}
              `}
            >
              {formatTime(lobby.result_at)}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default LobbySelector;