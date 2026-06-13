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
  // RESULT TO DISPLAY.
  // Priority: a tapped closed/resulted/history chip (selectedResult) →
  // the live result for the selected lobby → the result persisted on the
  // selected lobby itself. A tapped result is shown regardless of which
  // lobby is the current betting target, so viewing an old draw never
  // depends on changing the selected lobby.
  // -------------------------------------------------------------------
  const displayResult = useMemo<{ a: number; b: number; c: number } | null>(() => {
    if (selectedResult?.result) {
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

  // A chip was tapped and we are still fetching its result from the
  // lobby-history API (no number to show yet).
  const viewingPending =
    !!selectedResult && !selectedResult.result && !!selectedResult.pending;

  // Are we showing a result that the user explicitly opened (vs the
  // current selected lobby's own result)?
  const showingSelected = !!selectedResult?.result;

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

  // When the user has opened a specific draw, the "Drawn" time and the
  // lobby id should reflect THAT draw, not the current betting target.
  const drawnAt = showingSelected
    ? selectedResult?.result_at
    : selectedLobbyData?.result_at;

  const bottomLobbyId = showResult
    ? (showingSelected
        ? selectedResult?.lobby_uuid
        : selectedLobbyData?.lobby_uuid) || null
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
            ) : viewingPending ? (
              <div className={styles.loadingRow}>
                <span className={styles.spinner} />
                <span className={styles.awaitingResult}>
                  Fetching result…
                </span>
              </div>
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
            <span className={styles.resultTime} style={{textTransform:"uppercase"}}>
              {formatResultTime(drawnAt)}
            </span>
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
          </div>
        ) : viewingPending ? null : (
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
            </div>
          )
        )}
      </div>
    
    </section>
  );
};

export default InfoCard;