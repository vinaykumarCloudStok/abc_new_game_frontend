import React, { useEffect, useState, useMemo } from "react";
import styles from "./InfoCard.module.css";
import { toggleRulesModal } from "../../store/slices/socketSlice";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { safeParse } from "../../types";

const InfoCard: React.FC = () => {
  const dispatch = useAppDispatch();

  const latestResult = useAppSelector(
    (state) => state.socketSlice.latestResult
  );
  const selectedResult = useAppSelector(
    (state) => state.socketSlice.selectedResult
  );
  const lobbies = useAppSelector((state) => state.socketSlice.lobbies);
  const selectedLobby = useAppSelector(
    (state) => state.socketSlice.selectedLobby
  );

  const selectedLobbyData = useMemo(
    () => lobbies.find((l) => l.lobby_uuid === selectedLobby) || null,
    [lobbies, selectedLobby]
  );

  // -------------------------------------------------------------------
  // RESULT TO DISPLAY for the selected lobby.
  // Priority: a tapped resulted tab → the live result → the result the
  // backend persisted on the lobby itself. Shown while a lobby is
  // resulted (e.g. the 5-minute sticky window after a draw).
  // -------------------------------------------------------------------
  const displayResult = useMemo<{ a: number; b: number; c: number } | null>(() => {
    if (
      selectedResult?.lobby_uuid === selectedLobby &&
      selectedResult?.result
    ) {
      return selectedResult.result;
    }
    if (latestResult?.lobby_uuid === selectedLobby && latestResult?.result) {
      return latestResult.result;
    }
    const parsed = safeParse(selectedLobbyData?.result);
    if (parsed && !Array.isArray(parsed) && parsed.a !== undefined) {
      return parsed as { a: number; b: number; c: number };
    }
    return null;
  }, [selectedResult, latestResult, selectedLobby, selectedLobbyData]);

  const showResult = !!displayResult;
  const resultBalls = displayResult
    ? [displayResult.a, displayResult.b, displayResult.c]
    : [];

  const formatResultTime = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  // -------------------------------------------------------------------
  // NEXT DRAW LOBBY  (logic unchanged)
  // -------------------------------------------------------------------
  const nextDrawLobby = useMemo(() => {
    if (!lobbies || lobbies.length === 0) return null;

    const selected = lobbies.find((l) => l.lobby_uuid === selectedLobby);
    if (
      selected &&
      new Date(selected.result_at).getTime() > Date.now() &&
      (selected.status === "betting_open" || selected.status === "bet_closed")
    ) {
      return selected;
    }

    const upcoming = lobbies
      .filter(
        (l) =>
          (l.status === "betting_open" || l.status === "bet_closed") &&
          new Date(l.result_at).getTime() > Date.now()
      )
      .sort(
        (a, b) =>
          new Date(a.result_at).getTime() - new Date(b.result_at).getTime()
      );

    return upcoming[0] || null;
  }, [lobbies, selectedLobby]);

  // -------------------------------------------------------------------
  // LIVE COUNTDOWN — TICKS EVERY SECOND  (logic unchanged)
  // -------------------------------------------------------------------
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!nextDrawLobby) {
      setTimeLeft(0);
      return;
    }

    const target = new Date(nextDrawLobby.result_at).getTime();

    const update = () => {
      const diff = Math.max(0, target - Date.now());
      setTimeLeft(diff);
    };

    update(); // immediate first tick
    const interval = setInterval(update, 1000); // 1s ticks

    return () => clearInterval(interval);
  }, [nextDrawLobby]);

  // -------------------------------------------------------------------
  // FORMAT MM:SS or HH:MM:SS  (logic unchanged)
  // -------------------------------------------------------------------
  const formatCountdown = (ms: number) => {
    if (ms <= 0) return "00:00";

    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");

    return hours > 0
      ? `${pad(hours)}:${pad(mins)}:${pad(secs)}`
      : `${pad(mins)}:${pad(secs)}`;
  };

  // Add urgency class when under 60s
  const isUrgent = timeLeft > 0 && timeLeft <= 60_000;

  // Full lobby ids (no truncation)
  // const resultLobbyId = latestResult?.lobby_uuid || null;
  const bottomLobbyId = showResult
    ? selectedLobbyData?.lobby_uuid || null
    : nextDrawLobby?.lobby_uuid || null;

  // -------------------------------------------------------------------
  // COPY TO CLIPBOARD  (UI helper, no business logic)
  // -------------------------------------------------------------------
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyId = (id: string, key: string) => {
    try {
      navigator.clipboard?.writeText(id);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1200);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <section className={styles.card}>
      <div className={styles.grid}>
        {/* ---------------- LEFT COLUMN ---------------- */}
        <div className={styles.leftCol}>
          <div className={styles.titleLine}>
            <button
              className={styles.howBtn}
              onClick={() => dispatch(toggleRulesModal())}
              aria-label="How to play"
            >
              How to play
            </button>
          </div>
          {/* {resultLobbyId && (
            <span
              className={styles.lobbyId}
              title="Click to copy"
              onClick={() => copyId(resultLobbyId, "result")}
            >
              {copiedKey === "result" ? "Copied!" : resultLobbyId}
            </span>
          )} */}

          {showResult && (
            <span className={styles.resultLabel}>Result</span>
          )}

          <div className={styles.digits}>
            {showResult ? (
              resultBalls.map((digit, index) => (
                <div
                  key={index}
                  className={styles.digitBall}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  {digit}
                </div>
              ))
            ) : (
              <span className={styles.awaitingResult}>
                Awaiting result…
              </span>
            )}
          </div>
        </div>

        {/* ---------------- RIGHT COLUMN ---------------- */}
        {showResult ? (
          <div className={styles.rightCol}>
            <span className={styles.timeLabel}>Drawn</span>
            <span className={styles.resultTime}>
              {formatResultTime(selectedLobbyData?.result_at)}
            </span>
          </div>
        ) : (
          nextDrawLobby && (
            <div className={styles.rightCol}>
              <span className={styles.timeLabel}>Next Draw</span>

              <div
                className={`${styles.flipClock} ${isUrgent ? styles.flipUrgent : ""
                  }`}
              >
                {formatCountdown(timeLeft)
                  .split("")
                  .map((ch, i) =>
                    ch === ":" ? (
                      <span key={i} className={styles.colon}>
                        :
                      </span>
                    ) : (
                      <span key={i} className={styles.flipDigit}>
                        {ch}
                      </span>
                    )
                  )}
              </div>
            </div>
          )
        )}
      </div>
      {bottomLobbyId && (
        <p
          className={styles.nextLobbyId}
          title="Click to copy"
          onClick={() => copyId(bottomLobbyId, "next")}
        >
          <span>Lobby Id:</span>
          <span>      {copiedKey === "next" ? "Copied!" : bottomLobbyId}</span>
        </p>
      )}
    </section>
  );
};

export default InfoCard;