import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { MdLockClock, MdClose } from "react-icons/md";
import styles from "./BetsClosedModal.module.css";

// Betting closes this many ms before the draw (result) time when the
// lobby has no explicit bet_close_at coming from the backend.
const CLOSE_BEFORE_DRAW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Watches the lobby the user is currently betting on and shows a one-time
 * popup the moment betting closes for it (5 minutes before the draw).
 *
 * The popup only fires for a lobby the user was actively viewing while it
 * was still OPEN — tapping an already-closed lobby tab will NOT trigger it.
 */
const BetsClosedModal: React.FC = () => {
  const lobbies = useSelector((s: RootState) => s.socketSlice.lobbies);
  const selectedLobby = useSelector(
    (s: RootState) => s.socketSlice.selectedLobby
  );

  const selectedLobbyData = useMemo(
    () => lobbies.find((l) => l.lobby_uuid === selectedLobby) || null,
    [lobbies, selectedLobby]
  );

  // lobbies we have seen OPEN (so we only alert on a real open -> closed move)
  const seenOpenRef = useRef<Set<string>>(new Set());
  // lobbies we have already shown the popup for (never repeat)
  const shownRef = useRef<Set<string>>(new Set());

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!selectedLobbyData) return;

    const lobby = selectedLobbyData;
    const uuid = lobby.lobby_uuid;

    const closeAtMs = lobby.bet_close_at
      ? new Date(lobby.bet_close_at).getTime()
      : new Date(lobby.result_at).getTime() - CLOSE_BEFORE_DRAW_MS;

    const check = () => {
      const now = Date.now();
      const isOpenNow =
        lobby.status === "betting_open" && now < closeAtMs;

      if (isOpenNow) {
        seenOpenRef.current.add(uuid);
        return;
      }

      const isClosedNow =
        lobby.status === "bet_closed" ||
        lobby.status === "resulted" ||
        now >= closeAtMs;

      if (
        isClosedNow &&
        seenOpenRef.current.has(uuid) &&
        !shownRef.current.has(uuid)
      ) {
        shownRef.current.add(uuid);
        setOpen(true);
      }
    };

    check(); // immediate check on (re)select / lobby update
    const interval = setInterval(check, 1000); // fire exactly when time comes

    return () => clearInterval(interval);
  }, [selectedLobbyData]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Betting closed"
    >
      <div className={styles.backdrop} onClick={() => setOpen(false)} />

      <div className={styles.modal}>
        <button
          className={styles.closeBtn}
          onClick={() => setOpen(false)}
          aria-label="Close"
        >
          <MdClose />
        </button>

        <div className={styles.iconWrap}>
          <MdLockClock className={styles.icon} />
        </div>

        <h2 className={styles.title}>Betting Closed</h2>

        <p className={styles.message}>
          Your bets are now <strong>closed</strong> for this draw. Betting
          shuts <strong>5 minutes</strong> before the result is drawn.
        </p>

        <p className={styles.subMessage}>
          The result will be declared shortly. You can place bets on the next
          open lobby.
        </p>

        <button className={styles.okBtn} onClick={() => setOpen(false)}>
          Got it
        </button>
      </div>
    </div>
  );
};

export default BetsClosedModal;
