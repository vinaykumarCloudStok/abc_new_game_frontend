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
  // When the player is an agent we also pass the regular (fixed) user price
  // so it can be shown struck-through next to the discounted agent price.
  originalPrice?: number;
  onQuickGuess: () => void;
}> = ({ title, win, price, originalPrice, onQuickGuess }) => {
  const showDiscount =
    originalPrice != null && originalPrice > price;

  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionTitleWrap}>
        <div className={styles.titleLine}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <span className={styles.winPill}>Win {formatINR(win)}</span>
        </div>

        <p className={styles.sectionPrice}>
          {showDiscount && (
            <span className={styles.priceStrike}>
              {formatINR(originalPrice!)}
            </span>
          )}
          <span className={showDiscount ? styles.priceAgent : undefined}>
            {formatINR(price)}
          </span>
          /Per Ticket
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
};

const BettingSection: React.FC = () => {
  const selectedLobby = useSelector(
    (state: RootState) => state.socketSlice.selectedLobby
  );

  const info = useSelector(
    (state: RootState) => state.socketSlice.info
  );

  const isAgent = Number(info?.isAgent) === 1;

  // Ticket prices now come from the backend on the `info` event:
  // regular users get the fixed in-game prices, agents get the
  // admin-set per-agent/per-game prices. The hardcoded values below are
  // only a fallback for older sessions/sockets that didn't send them.
  const FALLBACK_SINGLE = isAgent ? 10 : 12;
  const FALLBACK_DOUBLE = isAgent ? 12 : 15;
  const FALLBACK_TRIPLE = isAgent ? 20 : 25;

  const priceFor = (cat: 1 | 2 | 3, fallback: number): number => {
    const raw = info?.ticketPrices?.[String(cat)];
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const SINGLE_PRICE = priceFor(1, FALLBACK_SINGLE);
  const DOUBLE_PRICE = priceFor(2, FALLBACK_DOUBLE);
  const TRIPLE_PRICE = priceFor(3, FALLBACK_TRIPLE);

  // Fixed regular (non-agent) prices. For agents we show these struck-through
  // next to their discounted price; only shown when it's actually higher.
  const REGULAR_SINGLE = 12;
  const REGULAR_DOUBLE = 15;
  const REGULAR_TRIPLE = 25;

  const ORIGINAL_SINGLE = isAgent ? REGULAR_SINGLE : undefined;
  const ORIGINAL_DOUBLE = isAgent ? REGULAR_DOUBLE : undefined;
  const ORIGINAL_TRIPLE = isAgent ? REGULAR_TRIPLE : undefined;

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
        originalPrice={ORIGINAL_SINGLE}
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
        originalPrice={ORIGINAL_DOUBLE}
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
        originalPrice={ORIGINAL_TRIPLE}
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