import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import styles from "./LobbySelector.module.css";

const LobbySelector: React.FC = () => {
  const lobbies = useSelector(
    (state: RootState) => state.socketSlice.lobbies
  );
console.log(lobbies)
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <section className={styles.section}>
      <div className={`${styles.scroll} no-scrollbar`}>
        {lobbies?.map((lobby) => (
          <button
            key={lobby.lobby_uuid}
            className={`${styles.chip} ${styles.chipActive}`}
          >
            {formatTime(lobby.result_at)}
          </button>
        ))}
      </div>
    </section>
  );
};

export default LobbySelector;