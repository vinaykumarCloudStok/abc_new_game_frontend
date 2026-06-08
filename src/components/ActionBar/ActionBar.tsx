import React, { useState } from "react";
import styles from "./ActionBar.module.css";

import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store";

import {
  clearBets,
  removeBet,
} from "../../store/slices/betSlipSlice";

import { getSocket } from "../../socket/socket";
import { showPopup } from "../../store/slices/popupSlice";
import { parseChip } from "../../types";

const ActionBar: React.FC = () => {
  const dispatch = useDispatch();

  const [showBets, setShowBets] = useState(false);

  const bets = useSelector(
    (state: RootState) => state.betSlip.bets
  );
const info = useSelector(
  (state: RootState) => state.socketSlice.info
);

const isAgent = Number(info?.isAgent) === 1;

const MIN_BET_AMOUNT = isAgent ? 10 : 12;
const MAX_BET_AMOUNT = 25000;
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

  if (totalAmount < MIN_BET_AMOUNT) {
    dispatch(
      showPopup({
        type: "error",
        message: `Minimum bet is ₹${MIN_BET_AMOUNT}`,
      })
    );
    return;
  }

  if (totalAmount > MAX_BET_AMOUNT) {
    dispatch(
      showPopup({
        type: "error",
        message: `Maximum bet is ₹${MAX_BET_AMOUNT}`,
      })
    );
    return;
  }

  if (totalAmount > balance) {
    dispatch(
      showPopup({
        type: "error",
        message: "Insufficient Balance",
      })
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

  // ----------------------------------------------------------------
  // DELETE A SINGLE BET (one by one)
  // ----------------------------------------------------------------
  const handleDeleteBet = (id: string) => {
    dispatch(removeBet(id));
  };

  const handleClearAll = () => {
    dispatch(clearBets());
    setShowBets(false);
  };

  // letter -> accent color (matches BetRow badge colors)
  const letterColor = (letter: string) => {
    switch (letter.toUpperCase()) {
      case "A":
        return "#e23b3b";
      case "B":
        return "#f59a12";
      case "C":
        return "#2f7fe0";
      default:
        return "var(--color-primary)";
    }
  };

  return (
    <div className={styles.bar}>
      {showBets && bets.length > 0 && (
        <div className={styles.betDropdown}>
          <div className={styles.betHeader}>
            <span className={styles.betHeaderTitle}>
              Current Bets
              <span className={styles.betCountPill}>{totalBets}</span>
            </span>

            <div className={styles.betHeaderActions}>
              <button
                className={styles.clearAllBtn}
                onClick={handleClearAll}
              >
                Clear all
              </button>

              <button
                className={styles.closeBtn}
                onClick={() => setShowBets(false)}
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div className={styles.betList}>
            {bets.map((bet) => {
              const parts = parseChip(bet.chip);

              return (
                <div key={bet.id} className={styles.betItem}>
                  <div className={styles.betItemLeft}>
                    <div className={styles.chipChips}>
                      {parts.map((part, i) => (
                        <span
                          key={`${bet.id}-${i}`}
                          className={styles.chipChip}
                          style={{
                            borderColor: letterColor(part.letter),
                            color: letterColor(part.letter),
                          }}
                        >
                          <b className={styles.chipLetter}>
                            {part.letter}
                          </b>
                          <span className={styles.chipNumber}>
                            {part.number || "-"}
                          </span>
                        </span>
                      ))}
                    </div>

                    <span className={styles.betMeta}>
                      {bet.label} • Qty {bet.qty}
                    </span>
                  </div>

                  <div className={styles.betItemRight}>
                    <div className={styles.betAmount}>₹{bet.amt}</div>

                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteBet(bet.id)}
                      aria-label="Delete bet"
                      title="Remove this bet"
                    >
                      <span className="material-symbols-outlined">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.betFooter}>
            <span>Total ({totalBets})</span>
            <span className={styles.betFooterTotal}>₹{totalAmount}</span>
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
