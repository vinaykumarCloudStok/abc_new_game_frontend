import React, { useState } from "react";
import styles from "./ActionBar.module.css";

import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store";

import {
  clearBets,
  undoLastBet,
} from "../../store/slices/betSlipSlice";

import { getSocket } from "../../socket/socket";
import { showPopup } from "../../store/slices/popupSlice";

const ActionBar: React.FC = () => {
  const dispatch = useDispatch();

  const [showBets, setShowBets] = useState(false);

  const bets = useSelector(
    (state: RootState) => state.betSlip.bets
  );

  const lobbies = useSelector(
    (state: RootState) => state.socketSlice.lobbies
  );
  const balance = Number(
    useSelector(
      (state: RootState) => state.socketSlice.info.balance
    )
  );
  const selectedLobby = useSelector(
    (state: RootState) => state.socketSlice.selectedLobby
  );

  const activeLobby = lobbies.find(
    (lobby) => lobby.lobby_uuid === selectedLobby
  );

  const totalBets = bets.length;

  const totalAmount = bets.reduce(
    (sum, item) => sum + item.amt,
    0
  );

  const handlePlaceBet = () => {
    if (!activeLobby) return;

    const totalAmount = bets.reduce(
      (sum, item) => sum + item.amt,
      0
    );

    if (totalAmount < 12) {
      dispatch(
        showPopup({ type: "error", message: "Minimum bet is 12" })
      );
      return;
    }

    if (totalAmount > 25000) {
      dispatch(
        showPopup({ type: "error", message: "Maximum bet is 25000" })
      );
      return;
    }

    if (totalAmount > balance) {
      dispatch(
        showPopup({ type: "error", message: "Insufficient Balance" })
      );
      return;
    }

    const payload = {
      lobbyId: activeLobby.lobby_uuid,
      bets: bets.map((bet) => ({
        cat: bet.cat,
        chip: bet.chip,
        amt: bet.amt,
      })),
    };

    console.log("BET PAYLOAD:", payload);

    const socket = getSocket();
    socket?.emit("bet", payload);

    dispatch(clearBets());
    setShowBets(false);
  };

  const handleUndo = () => {
    dispatch(undoLastBet());
  };

  return (
    <div className={styles.bar}>
      {showBets && bets.length > 0 && (
        <div className={styles.betDropdown}>
          <div className={styles.betHeader}>
            <span>Current Bets ({totalBets})</span>

            <button
              className={styles.closeBtn}
              onClick={() => setShowBets(false)}
              aria-label="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className={styles.betList}>
            {bets.map((bet, index) => (
              <div key={index} className={styles.betItem}>
                <div>
                  <p className={styles.betNumber}>{bet.cat}</p>
                  <span className={styles.betChip}>
                    Chip: {bet.chip}
                  </span>
                </div>

                <div className={styles.betAmount}>{bet.amt}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.inner}>
        <div
          className={styles.cartLeft}
          onClick={() => setShowBets((prev) => !prev)}
        >
          <div className={styles.cartIconWrapper}>
            <span
              className={`material-symbols-outlined ${styles.cartIcon}`}
            >
              shopping_cart
            </span>

            {totalBets > 0 && (
              <div className={styles.badge}>{totalBets}</div>
            )}
          </div>

          <div className={styles.cartInfo}>
            <p className={styles.cartLabel}>Totat Ticket Amount</p>
            <p className={styles.cartTotal}>{totalAmount}</p>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.undoBtn}
            onClick={handleUndo}
            disabled={!bets.length}
            aria-label="Undo last bet"
          >
            <span className="material-symbols-outlined">undo</span>
          </button>

          <button
            className={styles.placeBtn}
            onClick={handlePlaceBet}
            disabled={!bets.length}
          >
            Place Bet
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionBar;