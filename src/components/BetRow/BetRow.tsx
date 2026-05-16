// BetRow.tsx
import React, { useState } from "react";
import styles from "./BetRow.module.css";
import type { BetOption } from "../../types";

import { useDispatch } from "react-redux";
import { addBet } from "../../store/slices/betSlipSlice";

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

  const handleIncrease = () => {
    setQty((prev) => prev + 1);
  };

  const handleDecrease = () => {
    setQty((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleAdd = () => {
    if (!qty) return;
    if (!inputValue.trim()) return;

    const values = inputValue.split("");

    // generate backend chip format
    const chipValue = values
      .map((val, index) => `${index + 1}:${val}`)
      .join("-");

    dispatch(
      addBet({
        id: crypto.randomUUID(),

        cat,

        // backend format
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
    <div className={styles.card}>
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
              onChange={(e) => {
                // only allow 0-9
                const value = e.target.value.replace(/[^0-9]/g, "");

                const updated = inputValue.split("");

                updated[index] = value;

                const finalValue = updated.join("");

                setInputValue(finalValue);

                // when typing starts -> default qty 1
                if (finalValue.replace(/\s/g, "").length > 0) {
                  setQty((prev) => (prev === 0 ? 1 : prev));
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
            disabled={qty <= 1}
          >
            -
          </button>

          <input
            className={styles.qtyInput}
            readOnly
            value={qty}
          />

          <button
            className={styles.stepBtn}
            onClick={handleIncrease}
          >
            +
          </button>
        </div>

        <button
          className={styles.addBtn}
          onClick={handleAdd}
        >
          ADD
        </button>
      </div>
    </div>
  );
};

export default BetRow;