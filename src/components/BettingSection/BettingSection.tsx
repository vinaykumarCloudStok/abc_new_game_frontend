import React, { useMemo, useState } from "react";
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
   const { lobbies, selectedLobby, selectedResult } = useSelector(
     (state: RootState) => state.socketSlice
   );
 
   const currentLobby = useMemo(() => {
     return lobbies.find(
       (item) => item.lobby_uuid === selectedLobby
     );
   }, [lobbies, selectedLobby]);
  const showOriginal =
    originalPrice != null && originalPrice !== price;
  const isBetDisabled =
    !currentLobby ||
    currentLobby?.status === "bet_closed" ||
    currentLobby?.status === "cancelled" ||
    currentLobby?.status === "resulted" ||
    !!selectedResult;
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionTitleWrap}>
        <div className={styles.titleLine}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <span className={styles.winPill}>
            <span className={styles.winLabel}>Win {formatINR(win)}</span>
          </span>
        </div>

        <p className={styles.sectionPrice}>
          {showOriginal && (
            <span className={styles.priceStrike}>
              {formatINR(originalPrice!)}
            </span>
          )}
          <span className={showOriginal ? styles.priceAgent : undefined}>
            {formatINR(price)}
          </span>
          /Per Ticket
        </p>
      </div>

      <button
        type="button"
        className={styles.quickGuess}
        onClick={onQuickGuess}
          style={{
              pointerEvents: isBetDisabled ? "none" : "auto",
              opacity: isBetDisabled ? ".5" : "",
            }}
        disabled={isBetDisabled}
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

  const lobbies = useSelector(
    (state: RootState) => state.socketSlice.lobbies
  );

  // Set when the user taps a resulted/history chip to view its draw. While
  // this is active they are looking at a RESULTED lobby, so the betting
  // section is hidden even though the betting target is still open.
  const selectedResult = useSelector(
    (state: RootState) => state.socketSlice.selectedResult
  );

  const info = useSelector(
    (state: RootState) => state.socketSlice.info
  );

  // The lobby currently targeted for betting. Once it has resulted there is
  // nothing left to bet on, so the whole section is hidden (see early return
  // below, placed after all hooks to respect the rules of hooks).
  const currentLobby = useMemo(
    () => lobbies.find((l) => l.lobby_uuid === selectedLobby) || null,
    [lobbies, selectedLobby]
  );

  const isAgent = Number(info?.isAgent) === 1;

  // Regular (non-agent) per-ticket prices — the fixed in-game prices.
  // Single source of truth; also used as the struck-through "before" price
  // shown to agents.
  const REGULAR_PRICE: Record<1 | 2 | 3, number> = {
    1: 12,
    2: 15,
    3: 25,
  };

  // Default agent prices — used for an agent only when the backend didn't
  // send explicit ticketPrices, so an agent always sees a discounted price.
  const DEFAULT_AGENT_PRICE: Record<1 | 2 | 3, number> = {
    1: 10,
    2: 12,
    3: 20,
  };

  // Resolve the per-ticket price for a category.
  //  - Regular user: always the fixed REGULAR_PRICE.
  //  - Agent: the backend-provided dynamic price (admin-set), falling back
  //    to DEFAULT_AGENT_PRICE if none was sent.
  const priceFor = (cat: 1 | 2 | 3): number => {
    const raw = info?.ticketPrices?.[String(cat)];
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
    return isAgent ? DEFAULT_AGENT_PRICE[cat] : REGULAR_PRICE[cat];
  };

  const SINGLE_PRICE = priceFor(1);
  const DOUBLE_PRICE = priceFor(2);
  const TRIPLE_PRICE = priceFor(3);

  // For agents, show the regular price struck-through next to their price —
  // whenever the two differ, regardless of which is higher.
  const originalFor = (cat: 1 | 2 | 3, agentPrice: number): number | undefined =>
    isAgent && REGULAR_PRICE[cat] !== agentPrice ? REGULAR_PRICE[cat] : undefined;

  const ORIGINAL_SINGLE = originalFor(1, SINGLE_PRICE);
  const ORIGINAL_DOUBLE = originalFor(2, DOUBLE_PRICE);
  const ORIGINAL_TRIPLE = originalFor(3, TRIPLE_PRICE);

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

  // Hide the entire betting section when there's nothing to bet on:
  //  - the selected lobby itself has resulted, or
  //  - the user is viewing a resulted lobby opened from the strip/history.
  if (currentLobby?.status === "resulted" || !!selectedResult) return null;

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