import React, { useEffect, useMemo, useState } from "react";
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

  // today's resulted lobbies pushed via the `lobby_history` socket event
  const lobbyHistory = useSelector(
    (state: RootState) => state.socketSlice.lobbyHistory
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
  //
  // We ALSO fold in the resulted lobbies delivered by the backend's
  // `lobby_history` event. Any history lobby not already present in the
  // live list becomes a "resulted" chip the user can tap to view its
  // result. We intentionally do NOT embed its result on the synthetic
  // lobby, so a tap goes through `viewLobbyResult` and calls the
  // lobby-history API (the cached result is used as a safe fallback).
  // ----------------------------------------------------------------
  const filteredLobbies = useMemo(() => {
    const liveIds = new Set((lobbies || []).map((l) => l.lobby_uuid));

    const historyChips: Lobby[] = (lobbyHistory || [])
      .filter((h) => h?.lobby_uuid && !liveIds.has(h.lobby_uuid))
      .map((h) => ({
        lobby_uuid: h.lobby_uuid,
        result_at: h.result_at,
        bet_close_at: h.result_at,
        status: "resulted",
        // keep null so a tap triggers the lobby-history API call
        result: null,
      }));

    return [...(lobbies || []), ...historyChips]
      .filter((lobby) => !["cancelled"].includes(lobby.status))
      .sort(
        (a, b) =>
          new Date(a.result_at).getTime() - new Date(b.result_at).getTime()
      );
  }, [lobbies, lobbyHistory]);

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

    // cached result for this lobby from the `lobby_history` socket payload
    const cached = lobbyHistory.find(
      (h) => h.lobby_uuid === lobby.lobby_uuid
    )?.result ?? null;

    try {
      setFetchingLobby(lobby.lobby_uuid);

      const res = await axios.get(
        `${import.meta.env.VITE_APP_BASE_SOCKET_URL}/lobby-history?user_id=${info.user_id}&operator_id=${info.operator_id}`
      );

      const data: LobbyHistoryItem[] = res?.data?.data || [];
      const match = data.find(
        (item) => item.lobby_uuid === lobby.lobby_uuid
      );

      const result = match?.result ?? cached;

      dispatch(
        setSelectedResult({
          lobby_uuid: lobby.lobby_uuid,
          result,
          result_at: match?.result_at ?? lobby.result_at,
          pending: !result,
        })
      );
    } catch (err) {
      console.log(err);
      dispatch(
        setSelectedResult({
          lobby_uuid: lobby.lobby_uuid,
          result: cached,
          result_at: lobby.result_at,
          pending: !cached,
        })
      );
    } finally {
      setFetchingLobby(null);
    }
  };

  // True while the user is viewing a RESULTED chip's result. In that case
  // the open/selected lobby chip should drop its active highlight so only
  // the tapped resulted chip looks active.
  const viewingResulted = useMemo(() => {
    if (!viewingLobby) return false;
    const l = filteredLobbies.find((x) => x.lobby_uuid === viewingLobby);
    return l?.status === "resulted";
  }, [viewingLobby, filteredLobbies]);

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
                    ? isViewing
                      ? styles.chipResulted
                      : styles.chipActive
                    : isActive && !viewingResulted
                    ? styles.chipSelected
                    : styles.chipActive
                }
                ${isViewing && isClosed ? styles.chipViewing : ""}
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
