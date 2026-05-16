// ActionBar.tsx
import React from "react";
import styles from "./ActionBar.module.css";

import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store";

import {
  clearBets,
  undoLastBet,
} from "../../store/slices/betSlipSlice";

import { getSocket } from "../../socket/socket";

const ActionBar: React.FC = () => {
  const dispatch = useDispatch();

  const bets = useSelector(
    (state: RootState) => state.betSlip.bets
  );

  const lobbies = useSelector(
    (state: RootState) => state.socketSlice.lobbies
  );

  const activeLobby = lobbies?.[0];

  const totalBets = bets.length;

  const totalAmount = bets.reduce(
    (sum, item) => sum + item.amt,
    0
  );

  const handlePlaceBet = () => {
    if (!activeLobby) return;

    const payload = [
      "bet",
      {
        lobbyId: activeLobby.lobby_uuid,
        bets: bets.map((bet) => ({
          cat: bet.cat,
          chip: bet.chip,
          amt: bet.amt,
        })),
      },
    ];

    console.log("BET PAYLOAD:", payload);

    const socket = getSocket();

    socket?.emit("message", payload);

    dispatch(clearBets());
  };

  const handleUndo = () => {
    dispatch(undoLastBet());
  };

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.cartLeft}>
          <div className={styles.cartIconWrapper}>
            <span
              className={`material-symbols-outlined ${styles.cartIcon}`}
            >
              shopping_cart
            </span>

            {totalBets}
          </div>

          <div className={styles.cartInfo}>
            <p className={styles.cartLabel}>
              Total Bets: {totalBets}
            </p>

            <p className={styles.cartTotal}>
              ₹ {totalAmount}
            </p>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.undoBtn}
            onClick={handleUndo}
            disabled={!bets.length}
          >
            Undo
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