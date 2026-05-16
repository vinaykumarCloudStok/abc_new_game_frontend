// BetRow.tsx
import React, { useState } from "react";
import styles from "./BetRow.module.css";
import type { BetOption } from "../../types";

import { useDispatch } from "react-redux";
import { addBet } from "../../store/slices/betSlipSlice";

const BetRow: React.FC<BetOption> = ({
  label,
  multiplier,
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
    setQty((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleAdd = () => {
    if (!qty) return;
    if (!inputValue.trim()) return;

    dispatch(
      addBet({
        id: crypto.randomUUID(),

        // 1 = single
        // 2 = double
        // 3 = triple
        cat,

        // backend format
        // 1:A
        // 2:AB
        // 3:ABC
        chip: `${cat}:${inputValue}`,

        qty,

        amt: qty * pricePerTicket,

        label,
      })
    );

    // reset after add
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
              <div
                key={digit}
                className={styles.badge}
              >
                {digit}
              </div>
            ))}
          </div>

          <div className={styles.textContent}>
            <div className={styles.titleRow}>
              <p className={styles.betName}>
                {label}
              </p>
            </div>

            <p className={styles.multiplier}>
              Win {multiplier}X / per bet
            </p>
          </div>
        </div>

        <p className={styles.price}>
          ₹ {pricePerTicket}.00
        </p>
      </div>

      {/* BOTTOM */}
      <div className={styles.bottomRow}>
        <div className={styles.guessBox}>
          {digits.map((digit, index) => (
            <input
              key={digit}
              type="text"
              maxLength={1}
              value={inputValue[index] || ""}
              placeholder={digit}
              className={styles.guessInput}
              onChange={(e) => {
                const value = e.target.value
                  .toUpperCase()
                  .replace(/[^0-9]/g, "");

                const updated = inputValue.split("");

                updated[index] = value;

                setInputValue(updated.join(""));
              }}
            />
          ))}
        </div>

        {/* RIGHT CONTROLS */}
        <div className={styles.actionSection}>
          <div className={styles.stepper}>
            <button
              className={styles.stepBtn}
              onClick={handleDecrease}
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
    </div>
  );
};

export default BetRow;