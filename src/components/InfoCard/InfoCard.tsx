import React, { useEffect, useState, useMemo } from "react";
import styles from "./InfoCard.module.css";
import { toggleRulesModal } from "../../store/slices/socketSlice";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { BiInfoCircle } from "react-icons/bi";
import { FiClock } from "react-icons/fi";

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
  // NEXT DRAW LOBBY
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
  // LIVE COUNTDOWN — TICKS EVERY SECOND
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
  // FORMAT MM:SS or HH:MM:SS
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

  const shortUuid = (uuid?: string) => (uuid ? uuid.slice(0, 16) : "—");

  // Add urgency class when under 60s
  const isUrgent = timeLeft > 0 && timeLeft <= 60_000;

  return (
    <section className={styles.card}>
      <div className={styles.glow} />

      {/* LEFT COLUMN */}
      <div className={styles.leftCol}>
        <p className={styles.label}>Draw Result</p>

        <div className={styles.flexRoundId}>
          <span className={styles.lobbyIdText}>Lobby:</span>
          <span className={styles.lobbyId}>
            {latestResult?.lobby_uuid
              ? `${latestResult.lobby_uuid.slice(0, 8)}...${latestResult.lobby_uuid.slice(-4)}`
              : shortUuid(nextDrawLobby?.lobby_uuid)}
          </span>
        </div>

        <div className={styles.digits}>
          {digits.length > 0 ? (
            digits.map((digit, index) => (
              <div
                key={index}
                className={styles.digitBall}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {digit}
              </div>
            ))
          ) : (
            <div className={styles.digitsPlaceholder}>
              Awaiting next result
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN — TIMER */}
      {nextDrawLobby && (
        <div className={styles.rightCol}>
          <div
            className={`${styles.timerPill} ${
              isUrgent ? styles.timerPillUrgent : ""
            }`}
          >
            <div className={styles.timerHeader}>
              <FiClock className={styles.timerIcon} />
              <span className={styles.timerLabel}>Next Draw</span>
            </div>
            <p
              className={`${styles.timerValue} ${
                isUrgent ? styles.timerValueUrgent : ""
              }`}
            >
              {formatCountdown(timeLeft)}
            </p>
           
          </div>
        </div>
      )}

      {/* HELP BUTTON */}
      <button
        className={styles.helpBtn}
        onClick={() => dispatch(toggleRulesModal())}
        aria-label="Open rules"
      >
        <BiInfoCircle className="icons" />
      </button>
    </section>
  );
};

export default InfoCard;