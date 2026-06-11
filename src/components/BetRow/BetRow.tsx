// BetRow.tsx
import React, { useEffect, useMemo, useState } from "react";
import styles from "./BetRow.module.css";
import type { BetOption } from "../../types";

import { useDispatch, useSelector } from "react-redux";
import { addBet } from "../../store/slices/betSlipSlice";
import { showPopup } from "../../store/slices/popupSlice";
import type { RootState } from "../../store";

interface BetRowProps extends BetOption {
  isTriple?: boolean;
  // Incrementing counter from the section header "Quick Guess" button.
  // When it changes, this row auto-fills random digits.
  quickGuessTick?: number;
}

const BetRow: React.FC<BetRowProps> = ({
  label,
  pricePerTicket,
  digits,
  isTriple,
  cat,
  quickGuessTick,
}) => {
  const dispatch = useDispatch();

  // qty kept as TEXT so a typed "0" shows in the field
  // and backspace can fully clear it
  const [qtyText, setQtyText] = useState("");
  const qty = qtyText === "" ? 0 : Number(qtyText);

  const [inputValue, setInputValue] = useState("");

  // ----------------------------------------------------------------
  // GET BETS
  // ----------------------------------------------------------------
  const bets = useSelector(
    (state: RootState) => state.betSlip.bets
  );

  // ----------------------------------------------------------------
  // GET SELECTED LOBBY + USER INFO (balance)
  // ----------------------------------------------------------------
  const { lobbies, selectedLobby, info } = useSelector(
    (state: RootState) => state.socketSlice
  );

  const currentLobby = useMemo(() => {
    return lobbies.find(
      (item) => item.lobby_uuid === selectedLobby
    );
  }, [lobbies, selectedLobby]);

  // ----------------------------------------------------------------
  // MAX BET → limited by ₹2L cap AND user's balance
  // (info.balance comes from the socket as a STRING e.g. "300.00")
  // Amount already sitting in the bet slip is subtracted, so the
  // user can never build a slip bigger than their balance.
  // ----------------------------------------------------------------
  const HARD_CAP = 200000;

  const balance = Number(info?.balance) || 0;

  const usedAmount = useMemo(
    () => bets.reduce((sum, bet) => sum + bet.amt, 0),
    [bets]
  );

  const maxBetAmount = Math.min(
    HARD_CAP,
    Math.max(0, balance - usedAmount)
  );

  const maxQty = Math.max(
    0,
    Math.floor(maxBetAmount / pricePerTicket)
  );

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
  // COMMON DISABLE FLAG (stepper + inputs)
  // ----------------------------------------------------------------
  const isRowLocked =
    isBetDisabled || alreadyExists || !hasEnteredNumber;

  // can't afford even 1 ticket
  const insufficientBalance = maxQty === 0;

  // ----------------------------------------------------------------
  // TOTAL AMOUNT (formatted Indian style: 2,00,000)
  // ----------------------------------------------------------------
  const totalAmount = qty * pricePerTicket;
  const formattedAmount = totalAmount.toLocaleString("en-IN");

  // ----------------------------------------------------------------
  // LIMIT REACHED → show popup error
  // (balance-limited → insufficient balance, else ₹2L cap message)
  // ----------------------------------------------------------------
  const showLimitError = () => {
    const capQty = Math.floor(HARD_CAP / pricePerTicket);

    dispatch(
      showPopup({
        type: "error",
        message:
          maxQty < capQty
            ? "Insufficient balance"
            : `Max bet limit ₹${HARD_CAP.toLocaleString("en-IN")} reached`,
      })
    );
  };

  // ----------------------------------------------------------------
  // HANDLE INCREASE
  // ----------------------------------------------------------------
  const handleIncrease = () => {
    if (isRowLocked) return;

    if (qty >= maxQty) {
      showLimitError();
      return;
    }

    setQtyText(String(Math.min(qty + 1, maxQty)));
  };

  // ----------------------------------------------------------------
  // HANDLE DECREASE (goes down to 0)
  // ----------------------------------------------------------------
  const handleDecrease = () => {
    if (isRowLocked) return;

    setQtyText(qty > 0 ? String(qty - 1) : "0");
  };

  // ----------------------------------------------------------------
  // QUICK GUESS — auto fill random digit(s) for this row
  // ----------------------------------------------------------------
  const handleQuickGuess = () => {
    if (isBetDisabled) return;

    const random = digits
      .map(() => Math.floor(Math.random() * 10))
      .join("");

    setInputValue(random);
    setQtyText(maxQty > 0 ? "1" : "0");
  };

  // Trigger quick guess when the section header button is pressed
  // (quickGuessTick is incremented by the parent for every row).
  useEffect(() => {
    if (quickGuessTick && quickGuessTick > 0) {
      handleQuickGuess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickGuessTick]);

  // ----------------------------------------------------------------
  // HANDLE ADD
  // ----------------------------------------------------------------
  const handleAdd = () => {
    if (isRowLocked) return;

    if (!qty) return;

    // safety: never allow adding more than balance / cap allows
    if (qty * pricePerTicket > maxBetAmount) {
      showLimitError();
      return;
    }

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

    setQtyText("");
    setInputValue("");
  };

  return (
    <div
      className={`${styles.card}

       ${isBetDisabled ? styles.disabledCard : ""
        }`}
    >
      {/* TOP */}
      <div className={`${styles.topRow} ${isTriple ? styles.topRowFlexCol : ""}`}>
        <div className={`${styles.leftInfo}`}>
          <div className={styles.badgeGroup}>
            {digits.map((digit) => (
              <div
                key={digit}
                className={`${styles.badge} ${styles[`badge${digit}` as keyof typeof styles] || ""
                  }`}
              >
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
              placeholder="-"
              className={styles.guessInput}
              disabled={isBetDisabled || alreadyExists}
              onChange={(e) => {
                if (isBetDisabled || alreadyExists) return;

                // allow only 0-9
                const value = e.target.value.replace(
                  /[^0-9]/g,
                  ""
                );

                const updated = inputValue.split("");

                updated[index] = value;

                const finalValue = updated.join("");

                setInputValue(finalValue);

                // AUTO MOVE TO NEXT INPUT
                if (value && index < digits.length - 1) {
                  const nextInput =
                    e.currentTarget
                      .parentElement
                      ?.children[index + 1] as HTMLInputElement;

                  nextInput?.focus();
                }

                // AUTO SET QTY
                const isComplete = digits.every(
                  (_, i) =>
                    updated[i] !== undefined &&
                    updated[i] !== ""
                );

                if (isComplete && qty === 0 && maxQty > 0) {
                  setQtyText("1");
                }

                if (!isComplete) {
                  setQtyText("");
                }
              }}
              onKeyDown={(e) => {
                // MOVE BACK ON BACKSPACE
                if (
                  e.key === "Backspace" &&
                  !inputValue[index] &&
                  index > 0
                ) {
                  const prevInput =
                    e.currentTarget
                      .parentElement
                      ?.children[index - 1] as HTMLInputElement;

                  prevInput?.focus();
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* ACTION */}
      <div className={`${styles.actionSection}`}>
        <div className={styles.stepper}>
          {/* MINUS — clickable till 0 */}
          <button
            className={styles.stepBtn}
            onClick={handleDecrease}
            disabled={qty <= 0 || isRowLocked}
            style={{
              pointerEvents: isRowLocked ? "none" : "auto",
              opacity: isRowLocked ? ".5" : "",
            }}
          >
            -
          </button>

          {/* QTY INPUT — text state: typed "0" shows, backspace clears */}
          <input
            type="text"
            inputMode="numeric"
            className={styles.qtyInput}
            value={qtyText}
            placeholder="0"
            disabled={isRowLocked}
            style={{
              width: `${Math.max(qtyText.length, 1) + 1.5}ch`,
              opacity: isRowLocked ? ".5" : "",
            }}
            onChange={(e) => {
              if (isRowLocked) return;

              // digits only
              const raw = e.target.value.replace(/\D/g, "");

              if (raw === "") {
                setQtyText("");
                return;
              }

              const parsed = Number(raw);

              // clamp to max allowed by balance / ₹2L cap
              if (parsed > maxQty) {
                setQtyText(String(maxQty));
                showLimitError();
              } else {
                // normalize leading zeros: "007" → "7", "00" → "0"
                setQtyText(String(parsed));
              }
            }}
          />

          {/* PLUS — stays clickable at max so the error popup can show */}
          <button
            className={styles.stepBtn}
            onClick={handleIncrease}
            disabled={isRowLocked}
            style={{
              pointerEvents: isRowLocked ? "none" : "auto",
              opacity: isRowLocked ? ".5" : "",
            }}
          >
            +
          </button>
        </div>

        {/* ADD BUTTON */}
        <button
          className={styles.addBtn}
          onClick={handleAdd}
          disabled={isRowLocked || qty <= 0 || insufficientBalance}
        >
          {isBetDisabled ? (
            "BET CLOSED"
          ) : alreadyExists ? (
            "ADDED"
          ) : insufficientBalance ? (
            "LOW BALANCE"
          ) : qty > 0 ? (
            <span className={styles.addBtnContent}>
              <span>ADD</span>
              <span className={styles.addAmt}>₹{formattedAmount}</span>
            </span>
          ) : (
            "ADD"
          )}
        </button>
      </div>
    </div>
  );
};

export default BetRow;