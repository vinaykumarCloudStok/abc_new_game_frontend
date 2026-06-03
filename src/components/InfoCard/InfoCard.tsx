import React, { useEffect, useState, useMemo } from "react";
import styles from "./InfoCard.module.css";
import { toggleRulesModal } from "../../store/slices/socketSlice";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";

const InfoCard: React.FC = () => {
  const dispatch = useAppDispatch();

  const latestResult = useAppSelector(
    (state) => state.socketSlice.latestResult
  );
  const lobbies = useAppSelector((state) => state.socketSlice.lobbies);
  const selectedLobby = useAppSelector(
    (state) => state.socketSlice.selectedLobby
  );

  const digits = latestResult ? Object.values(latestResult.result) : [];

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
  const resultLobbyId = latestResult?.lobby_uuid || null;
  const nextLobbyId = nextDrawLobby?.lobby_uuid || null;

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
            <p className={styles.title}>Draw Result</p>
            <button
              className={styles.howBtn}
              onClick={() => dispatch(toggleRulesModal())}
              aria-label="How to play"
            >
              How to play
            </button>
          </div>
          {resultLobbyId && (
            <span
              className={styles.lobbyId}
              title="Click to copy"
              onClick={() => copyId(resultLobbyId, "result")}
            >
              {copiedKey === "result" ? "Copied!" : resultLobbyId}
            </span>
          )}

          <div className={styles.digits}>
              <div
          
                  className={styles.digitBall}
                 
                >
                  1
                </div>
            {digits.length > 0 ? (
              digits.map((digit, index) => (
                <div
                  key={index}
                  className={styles.digitBall}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  1
                </div>
              ))
            ) : (
              null
            )}
          </div>
        </div>

        {/* ---------------- RIGHT COLUMN (TIMER) ---------------- */}
        {nextDrawLobby && (
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
        )}
      </div>
      {nextLobbyId && (
        <p
          className={styles.nextLobbyId}
          title="Click to copy"
          onClick={() => copyId(nextLobbyId, "next")}
        >
          <span>Lobby Id:</span>
          <span>      {copiedKey === "next" ? "Copied!" : nextLobbyId}</span>
        </p>
      )}
    </section>
  );
};

export default InfoCard;