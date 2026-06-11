import React, { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import styles from "./BettingSection.module.css";
import BetRow from "../BetRow/BetRow";
import type { BetOption } from "../../types";

const formatINR = (value: number) =>
  `₹${new Intl.NumberFormat("en-IN").format(value)}`;

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

      <p className={styles.sectionPrice}>
        {formatINR(price)} / per ticket
      </p>
    </div>

    <button
      type="button"
      className={styles.quickGuess}
      onClick={onQuickGuess}
    >
      Quick Guess
    </button>
  </div>
);

const BettingSection: React.FC = () => {
  const selectedLobby = useSelector(
    (state: RootState) => state.socketSlice.selectedLobby
  );

  const info = useSelector(
    (state: RootState) => state.socketSlice.info
  );

  const isAgent = Number(info?.isAgent) === 1;

  // Agent Pricing
  const SINGLE_PRICE = isAgent ? 10 : 12;
  const DOUBLE_PRICE = isAgent ? 12 : 15;
  const TRIPLE_PRICE = isAgent ? 20 : 25;

  const BET_OPTIONS: BetOption[] = [
    {
      type: "A",
      betType: "A",
      label: "A Digit",
      multiplier: 100,
      pricePerTicket: SINGLE_PRICE,
      digits: ["A"],
      cat: 1,
    },
    {
      type: "B",
      betType: "B",
      label: "B Digit",
      multiplier: 100,
      pricePerTicket: SINGLE_PRICE,
      digits: ["B"],
      cat: 1,
    },
    {
      type: "C",
      betType: "C",
      label: "C Digit",
      multiplier: 100,
      pricePerTicket: SINGLE_PRICE,
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
      pricePerTicket: DOUBLE_PRICE,
      digits: ["A", "B"],
      cat: 2,
    },
    {
      type: "AC",
      betType: "AC",
      label: "AC Combo",
      multiplier: 1000,
      pricePerTicket: DOUBLE_PRICE,
      digits: ["A", "C"],
      cat: 2,
    },
    {
      type: "BC",
      betType: "BC",
      label: "BC Combo",
      multiplier: 1000,
      pricePerTicket: DOUBLE_PRICE,
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
      pricePerTicket: TRIPLE_PRICE,
      digits: ["A", "B", "C"],
      cat: 3,
    },
  ];

  const [singleTick, setSingleTick] = useState(0);
  const [doubleTick, setDoubleTick] = useState(0);
  const [tripleTick, setTripleTick] = useState(0);

  return (
    <section className={styles.section}>
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
            quickGuessTick={doubleTick}
            {...opt}
          />
        ))}
      </div>

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
            isTriple
            quickGuessTick={tripleTick}
            {...opt}
          />
        ))}
      </div>
    </section>
  );
};

export default BettingSection;