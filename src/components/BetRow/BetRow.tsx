// BetRow.tsx
import React, { useMemo, useState } from "react";
import styles from "./BetRow.module.css";
import type { BetOption } from "../../types";

import { useDispatch, useSelector } from "react-redux";
import { addBet } from "../../store/slices/betSlipSlice";
import type { RootState } from "../../store";

const BetRow: React.FC<BetOption> = ({
  label,
  pricePerTicket,
  digits,
  cat,
}) => {
  const dispatch = useDispatch();

  const [qty, setQty] = useState(0);

  // input value for A/B/C/AB/ABC
  const [inputValue, setInputValue] = useState("");

  // ----------------------------------------------------------------
  // GET SELECTED LOBBY
  // ----------------------------------------------------------------
  const { lobbies, selectedLobby } = useSelector(
    (state: RootState) => state.socketSlice
  );

  const currentLobby = useMemo(() => {
    return lobbies.find(
      (item) => item.lobby_uuid === selectedLobby
    );
  }, [lobbies, selectedLobby]);

  // ----------------------------------------------------------------
  // DISABLE CONDITION
  // ----------------------------------------------------------------
const isBetDisabled =
  !currentLobby || 
  currentLobby?.status === "bet_closed" ||currentLobby?.status==="cancelled"||
  currentLobby?.status === "resulted"
  const handleIncrease = () => {
    if (isBetDisabled) return;

    setQty((prev) => prev + 1);
  };

const handleDecrease = () => {
  if (isBetDisabled) return;

  setQty((prev) => (prev > 0 ? prev - 1 : 0));
};

const handleAdd = () => {
  if (isBetDisabled) return;

  if (!qty) return;

  // generate backend chip format
  // Single  -> 1:A
  // Double  -> 1:A-2:B
  // Triple  -> 1:A-2:B-3:C
  const chipValue = digits
    .map((digit, index) => `${index + 1}:${digit}`)
    .join("-");

  dispatch(
    addBet({
      id: crypto.randomUUID(),
      cat,
      chip: chipValue,
      qty,
      amt: qty * pricePerTicket,
      label,
    })
  );

  setQty(0);
  setInputValue("");
};

  return (
    <div
      className={`${styles.card} ${
        isBetDisabled ? styles.disabledCard : ""
      }`}
    >
      {/* TOP */}
      <div className={styles.topRow}>
        <div className={styles.leftInfo}>
          <div className={styles.badgeGroup}>
            {digits.map((digit) => (
              <div key={digit} className={styles.badge}>
                {digit}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.guessBox}>
          {digits.map((digit, index) => (
            <input
              key={digit}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={inputValue[index] || ""}
              placeholder={digit}
              className={styles.guessInput}
              disabled={isBetDisabled}
              onChange={(e) => {
                if (isBetDisabled) return;

                // only allow 0-9
                const value = e.target.value.replace(
                  /[^0-9]/g,
                  ""
                );

                const updated = inputValue.split("");

                updated[index] = value;

                const finalValue = updated.join("");

                setInputValue(finalValue);

                // when typing starts -> default qty 1
                if (
                  finalValue.replace(/\s/g, "").length > 0
                ) {
                  setQty((prev) =>
                    prev === 0 ? 1 : prev
                  );
                } else {
                  setQty(0);
                }
              }}
            />
          ))}
        </div>
      </div>

      <div className={styles.actionSection}>
        <div className={styles.stepper}>
          <button
            className={styles.stepBtn}
            onClick={handleDecrease}
            disabled={qty <= 1 || isBetDisabled}
          >
            -
          </button>

          <input
            className={styles.qtyInput}
            readOnly
            value={qty}
            disabled={isBetDisabled}
          />

          <button
            className={styles.stepBtn}
            onClick={handleIncrease}
            disabled={isBetDisabled}
          >
            +
          </button>
        </div>

        <button
          className={styles.addBtn}
          onClick={handleAdd}
          disabled={isBetDisabled}
        >
          {isBetDisabled ? "BET CLOSED" : "ADD"}
        </button>
      </div>
    </div>
  );
};

export default BetRow;