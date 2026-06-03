import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store";

import styles from "./LobbySelector.module.css";
import { selectLobby } from "../../store/slices/socketSlice";
import { safeParse, type Lobby } from "../../types";

const LobbySelector: React.FC = () => {
  const dispatch = useDispatch();

  const lobbies = useSelector(
    (state: RootState) => state.socketSlice.lobbies
  );

  const selectedLobby = useSelector(
    (state: RootState) => state.socketSlice.selectedLobby
  );

  // latest result (read-only) — used to show result for a resulted lobby
  const latestResult = useSelector(
    (state: RootState) => state.socketSlice.latestResult
  );

  // which resulted lobby's result is currently being viewed (UI only)
  const [viewLobby, setViewLobby] = useState<Lobby | null>(null);

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

  // ----------------------------------------------------------------
  // RESULT FOR A SPECIFIC LOBBY (read-only, no logic change)
  // Prefers latestResult, falls back to the lobby's own result field
  // ----------------------------------------------------------------
  const getLobbyResult = (
    lobby: Lobby
  ): { a: number; b: number; c: number } | null => {
    if (
      latestResult &&
      latestResult.lobby_uuid === lobby.lobby_uuid &&
      latestResult.result
    ) {
      return latestResult.result;
    }

    const parsed = safeParse(lobby.result);

    if (
      parsed &&
      !Array.isArray(parsed) &&
      parsed.a !== undefined
    ) {
      return parsed;
    }

    return null;
  };

  const viewedResult = useMemo(
    () => (viewLobby ? getLobbyResult(viewLobby) : null),
    [viewLobby, latestResult]
  );

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
              onClick={() => {
                // RESULTED → open result view (does not change betting selection)
                if (isResulted) {
                  setViewLobby(lobby);
                  return;
                }

                handleSelectLobby(lobby.lobby_uuid);
              }}
              className={`
                ${styles.chip}
                ${
                  isResulted
                    ? styles.chipResulted
                    : isActive
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

      {/* ============================================================ */}
      {/* RESULT VIEW — lobby wise (UI only)                           */}
      {/* ============================================================ */}
      {viewLobby && (
        <div
          className={styles.resultOverlay}
          onClick={() => setViewLobby(null)}
        >
          <div
            className={styles.resultCard}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.resultClose}
              onClick={() => setViewLobby(null)}
              aria-label="Close result"
            >
              ✕
            </button>

            <p className={styles.resultTitle}>Lobby Result</p>

            <p className={styles.resultLobbyId}>
              {viewLobby.lobby_uuid.slice(0, 8)}…
              {viewLobby.lobby_uuid.slice(-4)}
            </p>

            <p className={styles.resultTime}>
              {formatTime(viewLobby.result_at)}
            </p>

            {viewedResult ? (
              <div className={styles.resultBalls}>
                {(["a", "b", "c"] as const).map((key) => (
                  <div key={key} className={styles.ballGroup}>
                    <span className={styles.ballLabel}>
                      {key.toUpperCase()}
                    </span>
                    <span className={styles.ball}>
                      {viewedResult[key]}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.resultPending}>
                Result will appear shortly…
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default LobbySelector;
