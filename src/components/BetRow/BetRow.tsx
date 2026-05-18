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

  const [inputValue, setInputValue] = useState("");

  // ----------------------------------------------------------------
  // GET BETS
  // ----------------------------------------------------------------
  const bets = useSelector(
    (state: RootState) => state.betSlip.bets
  );

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
  // CHIP VALUE
  // ----------------------------------------------------------------
  const chipValue = useMemo(() => {
    return digits
      .map((digit, index) => {
        const value = inputValue[index] || "";
        return `${digit}:${value}`;
      })
      .join("-");
  }, [digits, inputValue]);

  // ----------------------------------------------------------------
  // CHECK DUPLICATE
  // ----------------------------------------------------------------
  const alreadyExists = useMemo(() => {
    return bets.some(
      (bet) => bet.cat === cat && bet.chip === chipValue
    );
  }, [bets, cat, chipValue]);

  // ----------------------------------------------------------------
  // DISABLE CONDITION
  // ----------------------------------------------------------------
  const isBetDisabled =
    !currentLobby ||
    currentLobby?.status === "bet_closed" ||
    currentLobby?.status === "cancelled" ||
    currentLobby?.status === "resulted";

  // ----------------------------------------------------------------
  // CHECK IF ALL REQUIRED DIGITS ENTERED
  // ----------------------------------------------------------------
  const hasEnteredNumber = digits.every(
    (_, index) =>
      inputValue[index] !== undefined &&
      inputValue[index] !== ""
  );

  // ----------------------------------------------------------------
  // HANDLE INCREASE
  // ----------------------------------------------------------------
  const handleIncrease = () => {
    if (
      isBetDisabled ||
      alreadyExists ||
      !hasEnteredNumber
    )
      return;

    setQty((prev) => prev + 1);
  };

  // ----------------------------------------------------------------
  // HANDLE DECREASE
  // ----------------------------------------------------------------
  const handleDecrease = () => {
    if (
      isBetDisabled ||
      alreadyExists ||
      !hasEnteredNumber
    )
      return;

    setQty((prev) => (prev > 0 ? prev - 1 : 0));
  };

  // ----------------------------------------------------------------
  // HANDLE ADD
  // ----------------------------------------------------------------
  const handleAdd = () => {
    if (
      isBetDisabled ||
      alreadyExists ||
      !hasEnteredNumber
    )
      return;

    if (!qty) return;

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

        {/* INPUTS */}
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
              disabled={isBetDisabled || alreadyExists}
              onChange={(e) => {
                if (
                  isBetDisabled ||
                  alreadyExists
                )
                  return;

                // allow only 0-9
                const value =
                  e.target.value.replace(
                    /[^0-9]/g,
                    ""
                  );

                const updated =
                  inputValue.split("");

                updated[index] = value;

                const finalValue =
                  updated.join("");

                setInputValue(finalValue);

                // AUTO SET QTY
                const isComplete =
                  digits.every(
                    (_, i) =>
                      updated[i] !== undefined &&
                      updated[i] !== ""
                  );

                if (isComplete && qty === 0) {
                  setQty(1);
                }

                if (!isComplete) {
                  setQty(0);
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* ACTION */}
      <div className={styles.actionSection}>
        <div className={styles.stepper}>
          {/* MINUS */}
          <button
            className={styles.stepBtn}
            onClick={handleDecrease}
            disabled={
              qty <= 1 ||
              isBetDisabled ||
              alreadyExists ||
              !hasEnteredNumber
            }
             style={{pointerEvents: isBetDisabled ||
              alreadyExists ||
              !hasEnteredNumber?"none":"auto",
              opacity:isBetDisabled ||
              alreadyExists ||
              !hasEnteredNumber?".5":""
            }}
          >
            -
          </button>

          {/* QTY INPUT */}
          <input
            type="number"
            min={0}
            className={styles.qtyInput}
            value={qty}
            disabled={
              isBetDisabled ||
              alreadyExists ||
              !hasEnteredNumber
            }
            style={{ opacity:isBetDisabled ||
              alreadyExists ||
              !hasEnteredNumber?".5":""}}
            onFocus={(e) => {
              // remove 0 on focus
              if (qty === 0) {
                e.target.value = "";
              }
            }}
            onBlur={(e) => {
              // show 0 again if empty
              if (e.target.value === "") {
                setQty(0);
              }
            }}
            onChange={(e) => {
              if (
                isBetDisabled ||
                alreadyExists ||
                !hasEnteredNumber
              )
                return;

              const value = e.target.value;

              if (value === "") {
                setQty(0);
                return;
              }

              const parsed = Number(value);

              if (
                !isNaN(parsed) &&
                parsed >= 0
              ) {
                setQty(parsed);
              }
            }}
          />

          {/* PLUS */}
          <button
            className={styles.stepBtn}
            onClick={handleIncrease}
            disabled={
              isBetDisabled ||
              alreadyExists ||
              !hasEnteredNumber
            }
            style={{pointerEvents:isBetDisabled ||
              alreadyExists ||
              !hasEnteredNumber?"none":"auto",
             opacity:isBetDisabled ||
              alreadyExists ||
              !hasEnteredNumber?".5":""}}
          >
            +
          </button>
        </div>

        {/* ADD BUTTON */}
        <button
          className={styles.addBtn}
          onClick={handleAdd}
          disabled={
            isBetDisabled ||
            alreadyExists ||
            !hasEnteredNumber ||
            qty <= 0
          }
        >
          {isBetDisabled
            ? "BET CLOSED"
            : alreadyExists
            ? "ADDED"
            : "ADD"}
        </button>
      </div>
    </div>
  );
};

export default BetRow;