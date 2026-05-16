import React, { useState } from "react";
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

  const [showBets, setShowBets] = useState(false);

  const bets = useSelector(
    (state: RootState) => state.betSlip.bets
  );

  const lobbies = useSelector(
    (state: RootState) => state.socketSlice.lobbies
  );

 const selectedLobby = useSelector(
  (state: RootState) =>
    state.socketSlice.selectedLobby
);

const activeLobby = lobbies.find(
  (lobby) =>
    lobby.lobby_uuid === selectedLobby
);

  const totalBets = bets.length;

  const totalAmount = bets.reduce(
    (sum, item) => sum + item.amt,
    0
  );

  const handlePlaceBet = () => {
    if (!activeLobby) return;

    const payload = 
      {
        lobbyId: activeLobby.lobby_uuid,
        bets: bets.map((bet) => ({
          cat: bet.cat,
          chip: bet.chip,
          amt: bet.amt,
        })),
      } ;

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
  <span>Current Bets</span>

  <button
    className={styles.closeBtn}
    onClick={() => setShowBets(false)}
  >
    <span className="material-symbols-outlined">
      close
    </span>
  </button>
</div>

          <div className={styles.betList}>
            {bets.map((bet, index) => (
              <div
                key={index}
                className={styles.betItem}
              >
                <div>
                  <p className={styles.betNumber}>
                    {bet.cat}
                  </p>

                  <span className={styles.betChip}>
                    Chip: {bet.chip}
                  </span>
                </div>

                <div className={styles.betAmount}>
                  {bet.amt}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.inner}>
        <div
          className={styles.cartLeft}
          onClick={() =>
            setShowBets((prev) => !prev)
          }
        >
          <div className={styles.cartIconWrapper}>
            <span
              className={`material-symbols-outlined ${styles.cartIcon}`}
            >
              shopping_cart
            </span>

            {totalBets > 0 && (
              <div className={styles.badge}>
                {totalBets}
              </div>
            )}
          </div>

          <div className={styles.cartInfo}>
            <p className={styles.cartLabel}>
              Total Bets
            </p>

            <p className={styles.cartTotal}>
              {totalAmount}
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