// BettingSection.tsx

import React, { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import styles from "./BettingSection.module.css";
import BetRow from "../BetRow/BetRow";
import type { BetOption } from "../../types";

const BET_OPTIONS: BetOption[] = [
  {
    type: "A",
    betType: "A",
    label: "A Digit",
    multiplier: 100,
    pricePerTicket: 12,
    digits: ["A"],
    cat: 1,
  },
  {
    type: "B",
    betType: "B",
    label: "B Digit",
    multiplier: 100,
    pricePerTicket: 12,
    digits: ["B"],
    cat: 1,
  },
  {
    type: "C",
    betType: "C",
    label: "C Digit",
    multiplier: 100,
    pricePerTicket: 12,
    digits: ["C"],
    cat: 1,
  },
];

const DOUBLE_OPTIONS: BetOption[] = [
  {
    type: "AB",
    betType: "AB",
    label: "AB Combo",
    multiplier: 1000,
    pricePerTicket: 15,
    digits: ["A", "B"],
    cat: 2,
  },
  {
    type: "AC",
    betType: "AC",
    label: "AC Combo",
    multiplier: 1000,
    pricePerTicket: 15,
    digits: ["A", "C"],
    cat: 2,
  },
  {
    type: "BC",
    betType: "BC",
    label: "BC Combo",
    multiplier: 1000,
    pricePerTicket: 15,
    digits: ["B", "C"],
    cat: 2,
  },
];

const TRIPLE_OPTIONS: BetOption[] = [
  {
    type: "ABC",
    betType: "ABC",
    label: "ABC Combo",
    multiplier: 10000,
    pricePerTicket: 25,
    digits: ["A", "B", "C"],
    cat: 3,
  },
];

// ----------------------------------------------------------------
// CURRENCY FORMATTER (display only — no logic change)
// ----------------------------------------------------------------
const formatINR = (value: number) =>
  `₹${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;

// ----------------------------------------------------------------
// REUSABLE SECTION HEADER
// ----------------------------------------------------------------
const SectionHeader: React.FC<{
  title: string;
  win: number;
  price: number;
  onQuickGuess: () => void;
}> = ({ title, win, price, onQuickGuess }) => (
  <div className={styles.sectionHeader}>
    <div className={styles.sectionTitleWrap}>
      <div className={styles.titleLine}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <span className={styles.winPill}>Win {formatINR(win)}</span>
      </div>
      <p className={styles.sectionPrice}>{formatINR(price)} / per ticket</p>
    </div>

    <button
      type="button"
      className={styles.quickGuess}
      onClick={onQuickGuess}
    >
      <span className="material-symbols-outlined">casino</span>
      Quick Guess
    </button>
  </div>
);

const BettingSection: React.FC = () => {
  // ----------------------------------------------------------------
  // SELECTED LOBBY
  // ----------------------------------------------------------------
  const selectedLobby = useSelector(
    (state: RootState) => state.socketSlice.selectedLobby
  );

  // ----------------------------------------------------------------
  // QUICK GUESS TICKS (one per section)
  // Incrementing a tick tells every BetRow in that section to
  // auto-fill a random number. (Resets on lobby change via the row keys.)
  // ----------------------------------------------------------------
  const [singleTick, setSingleTick] = useState(0);
  const [doubleTick, setDoubleTick] = useState(0);
  const [tripleTick, setTripleTick] = useState(0);

  return (
    <section className={styles.section}>
      {/* ---------------------------------------------------------------- */}
      {/* SINGLE */}
      {/* ---------------------------------------------------------------- */}
      <SectionHeader
        title="Single Digit"
        win={BET_OPTIONS[0].multiplier}
        price={BET_OPTIONS[0].pricePerTicket}
        onQuickGuess={() => setSingleTick((t) => t + 1)}
      />

      <div className={styles.grid}>
        {BET_OPTIONS.map((opt) => (
          <BetRow
            key={`${selectedLobby}-${opt.type}`}
            quickGuessTick={singleTick}
            {...opt}
          />
        ))}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* DOUBLE */}
      {/* ---------------------------------------------------------------- */}
      <SectionHeader
        title="Double Digit"
        win={DOUBLE_OPTIONS[0].multiplier}
        price={DOUBLE_OPTIONS[0].pricePerTicket}
        onQuickGuess={() => setDoubleTick((t) => t + 1)}
      />

      <div className={styles.grid}>
        {DOUBLE_OPTIONS.map((opt) => (
          <BetRow
            key={`${selectedLobby}-${opt.type}`}
            isTriple={true}
            quickGuessTick={doubleTick}
            {...opt}
          />
        ))}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* TRIPLE */}
      {/* ---------------------------------------------------------------- */}
      <SectionHeader
        title="Triple Digit"
        win={TRIPLE_OPTIONS[0].multiplier}
        price={TRIPLE_OPTIONS[0].pricePerTicket}
        onQuickGuess={() => setTripleTick((t) => t + 1)}
      />

      <div className={styles.grid}>
        {TRIPLE_OPTIONS.map((opt) => (
          <BetRow
            key={`${selectedLobby}-${opt.type}`}
            isTriple={true}
            quickGuessTick={tripleTick}
            {...opt}
          />
        ))}
      </div>
    </section>
  );
};

export default BettingSection;
