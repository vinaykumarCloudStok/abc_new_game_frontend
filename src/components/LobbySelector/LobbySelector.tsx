import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import type { RootState } from "../../store";

import styles from "./LobbySelector.module.css";
import {
  selectLobby,
  setSelectedResult,
  clearSelectedResult,
} from "../../store/slices/socketSlice";
import { safeParse, type Lobby, type LobbyHistoryItem } from "../../types";

const LobbySelector: React.FC = () => {
  const dispatch = useDispatch();

  const lobbies = useSelector(
    (state: RootState) => state.socketSlice.lobbies
  );

  const selectedLobby = useSelector(
    (state: RootState) => state.socketSlice.selectedLobby
  );

  const info = useSelector(
    (state: RootState) => state.socketSlice.info
  );

  // latest result (read-only) — used to show result for a resulted lobby
  const latestResult = useSelector(
    (state: RootState) => state.socketSlice.latestResult
  );

  // a just-resulted lobby kept on screen for a short window
  const stickyResultLobby = useSelector(
    (state: RootState) => state.socketSlice.stickyResultLobby
  );

  // which closed/resulted tab is currently being viewed (UI highlight only)
  const [viewingLobby, setViewingLobby] = useState<string | null>(null);
  const [fetchingLobby, setFetchingLobby] = useState<string | null>(null);

  useEffect(() => {
    if (!lobbies?.length) return;

    // Keep a freshly-resulted lobby on screen during its sticky window.
    if (
      stickyResultLobby &&
      stickyResultLobby.lobby_uuid === selectedLobby &&
      Date.now() < stickyResultLobby.until &&
      lobbies.some((l) => l.lobby_uuid === stickyResultLobby.lobby_uuid)
    ) {
      return;
    }

    const savedLobby = localStorage.getItem("selectedLobby");

    // KEEP bet_closed active — remove only cancelled from "available"
    const availableLobbies = lobbies.filter(
      (lobby) => !["cancelled"].includes(lobby.status)
    );

    // current selected lobby
    const currentLobby = lobbies.find(
      (lobby) => lobby.lobby_uuid === selectedLobby
    );

    // KEEP selected if betting_open OR bet_closed
    if (
      currentLobby &&
      !["resulted", "cancelled"].includes(currentLobby.status)
    ) {
      return;
    }

    // restore saved lobby
    const validSavedLobby = availableLobbies.find(
      (lobby) =>
        lobby.lobby_uuid === savedLobby &&
        !["resulted", "cancelled"].includes(lobby.status)
    );

    if (validSavedLobby) {
      dispatch(selectLobby(validSavedLobby.lobby_uuid));
      return;
    }

    // select next betting_open
    const nextOpenLobby = availableLobbies.find(
      (lobby) => lobby.status === "betting_open"
    );

    if (nextOpenLobby) {
      dispatch(selectLobby(nextOpenLobby.lobby_uuid));
      localStorage.setItem("selectedLobby", nextOpenLobby.lobby_uuid);
    }
  }, [lobbies, selectedLobby, dispatch, stickyResultLobby]);

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(new Date(dateString));
  };

  // ----------------------------------------------------------------
  // TAB VISIBILITY
  // Keep "betting_open" (Open), "bet_closed" (Closed) AND "resulted"
  // tabs on the strip. A closed tab is NOT removed once the draw is
  // declared — it stays so the user can tap it to re-view the drawn
  // number inside the InfoCard. Only "cancelled" lobbies are hidden.
  // ----------------------------------------------------------------
  const filteredLobbies = (lobbies || [])
    .filter((lobby) => !["cancelled"].includes(lobby.status))
    .sort(
      (a, b) =>
        new Date(a.result_at).getTime() - new Date(b.result_at).getTime()
    );

  const handleSelectLobby = (lobbyUuid: string) => {
    localStorage.setItem("selectedLobby", lobbyUuid);
    dispatch(selectLobby(lobbyUuid));
  };

  // ----------------------------------------------------------------
  // LOCAL RESULT LOOKUP (no network) — prefers latestResult, then the
  // lobby's own result field.
  // ----------------------------------------------------------------
  const getLocalResult = (
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
    if (parsed && !Array.isArray(parsed) && parsed.a !== undefined) {
      return parsed;
    }
    return null;
  };

  // ----------------------------------------------------------------
  // VIEW A CLOSED / RESULTED LOBBY → push its drawn number into the
  // InfoCard. Tries local data first, then falls back to the
  // lobby-history API.
  // ----------------------------------------------------------------
  const viewLobbyResult = async (lobby: Lobby) => {
    setViewingLobby(lobby.lobby_uuid);

    // 1) instant local result if we already have it
    const local = getLocalResult(lobby);
    if (local) {
      dispatch(
        setSelectedResult({
          lobby_uuid: lobby.lobby_uuid,
          result: local,
          result_at: lobby.result_at,
        })
      );
      return;
    }

    // 2) show a pending state immediately, then fetch from API
    dispatch(
      setSelectedResult({
        lobby_uuid: lobby.lobby_uuid,
        result: null,
        result_at: lobby.result_at,
        pending: true,
      })
    );

    if (!info.user_id || !info.operator_id) return;

    try {
      setFetchingLobby(lobby.lobby_uuid);

      const res = await axios.get(
        `${import.meta.env.VITE_APP_BASE_SOCKET_URL}/lobby-history?user_id=${info.user_id}&operator_id=${info.operator_id}`
      );

      const data: LobbyHistoryItem[] = res?.data?.data || [];
      const match = data.find(
        (item) => item.lobby_uuid === lobby.lobby_uuid
      );

      dispatch(
        setSelectedResult({
          lobby_uuid: lobby.lobby_uuid,
          result: match?.result ?? null,
          result_at: match?.result_at ?? lobby.result_at,
          pending: !match?.result,
        })
      );
    } catch (err) {
      console.log(err);
      dispatch(
        setSelectedResult({
          lobby_uuid: lobby.lobby_uuid,
          result: null,
          result_at: lobby.result_at,
          pending: true,
        })
      );
    } finally {
      setFetchingLobby(null);
    }
  };

  return (
    <section className={styles.section}>
      <div className={`${styles.scroll} no-scrollbar`}>
        {filteredLobbies.map((lobby) => {
          const isOpen = lobby.status === "betting_open";
          const isClosed = lobby.status === "bet_closed";
          const isResulted = lobby.status === "resulted";

          const isActive = selectedLobby === lobby.lobby_uuid;
          const isViewing = viewingLobby === lobby.lobby_uuid;

          return (
            <button
              key={lobby.lobby_uuid}
              onClick={() => {
                // CLOSED or RESULTED → fetch + show the drawn number
                // inside the InfoCard (does not change betting target).
                if (isResulted || isClosed) {
                  viewLobbyResult(lobby);
                  if (isClosed) handleSelectLobby(lobby.lobby_uuid);
                  return;
                }

                // betting_open → normal selection + clear any opened result
                dispatch(clearSelectedResult());
                setViewingLobby(null);
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
                ${isViewing ? styles.chipViewing : ""}
              `}
            >
              <span >{formatTime(lobby.result_at)}</span>

              {isOpen && <span className={styles.openBadge}>Open</span>}

              {isClosed && (
                <span className={styles.closedBadge}>
                  {fetchingLobby === lobby.lobby_uuid ? "…" : "Closed"}
                </span>
              )}

              {isResulted && (
                <span className={styles.resultBadge}>
                  {fetchingLobby === lobby.lobby_uuid ? "…" : "Result"}
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
