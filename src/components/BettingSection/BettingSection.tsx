// BettingSection.tsx

import React from "react";
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

const BettingSection: React.FC = () => {
  // ----------------------------------------------------------------
  // SELECTED LOBBY
  // ----------------------------------------------------------------
  const selectedLobby = useSelector(
    (state: RootState) => state.socketSlice.selectedLobby
  );

  return (
    <section className={styles.section}>
      {/* ---------------------------------------------------------------- */}
      {/* SINGLE */}
      {/* ---------------------------------------------------------------- */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          Single Digit
        </h2>

        <div className={styles.sectionMeta}>
          <p className={styles.sectionWin}>
            Win {BET_OPTIONS[0].multiplier} / per ticket
          </p>

          <p className={styles.sectionPrice}>
            {BET_OPTIONS[0].pricePerTicket}.00/per ticket
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        {BET_OPTIONS.map((opt) => (
          <BetRow
            key={`${selectedLobby}-${opt.type}`}
            {...opt}
          />
        ))}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* DOUBLE */}
      {/* ---------------------------------------------------------------- */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          Double Digit
        </h2>

        <div className={styles.sectionMeta}>
          <p className={styles.sectionWin}>
            Win {DOUBLE_OPTIONS[0].multiplier} / per ticket
          </p>

          <p className={styles.sectionPrice}>
            {DOUBLE_OPTIONS[0].pricePerTicket}.00
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        {DOUBLE_OPTIONS.map((opt) => (
          <BetRow
            key={`${selectedLobby}-${opt.type}`}
            {...opt}
          />
        ))}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* TRIPLE */}
      {/* ---------------------------------------------------------------- */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          Triple Digit
        </h2>

        <div className={styles.sectionMeta}>
          <p className={styles.sectionWin}>
            Win {TRIPLE_OPTIONS[0].multiplier} / per ticket
          </p>

          <p className={styles.sectionPrice}>
            {TRIPLE_OPTIONS[0].pricePerTicket}.00
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        {TRIPLE_OPTIONS.map((opt) => (
          <BetRow
            key={`${selectedLobby}-${opt.type}`}
            {...opt}
          />
        ))}
      </div>
    </section>
  );
};

export default BettingSection;