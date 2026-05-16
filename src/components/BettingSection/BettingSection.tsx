// BettingSection.tsx
import React from "react";
import styles from "./BettingSection.module.css";
import BetRow from "../BetRow/BetRow";
import type { BetOption } from "../../types";

const BET_OPTIONS: BetOption[] = [
  {
    type: "A",
    betType: "A",
    label: "A Digit",
    multiplier: 9,
    pricePerTicket: 20,
    digits: ["A"],
    cat: 1,
  },
  {
    type: "B",
    betType: "B",
    label: "B Digit",
    multiplier: 9,
    pricePerTicket: 20,
    digits: ["B"],
    cat: 1,
  },
  {
    type: "C",
    betType: "C",
    label: "C Digit",
    multiplier: 9,
    pricePerTicket: 20,
    digits: ["C"],
    cat: 1,
  },
];

const DOUBLE_OPTIONS: BetOption[] = [
  {
    type: "AB",
    betType: "AB",
    label: "AB Combo",
    multiplier: 90,
    pricePerTicket: 20,
    digits: ["A", "B"],
    cat: 2,
  },
  {
    type: "AC",
    betType: "AC",
    label: "AC Combo",
    multiplier: 90,
    pricePerTicket: 20,
    digits: ["A", "C"],
    cat: 2,
  },
  {
    type: "BC",
    betType: "BC",
    label: "BC Combo",
    multiplier: 90,
    pricePerTicket: 20,
    digits: ["B", "C"],
    cat: 2,
  },
];

const TRIPLE_OPTIONS: BetOption[] = [
  {
    type: "ABC",
    betType: "ABC",
    label: "ABC Combo",
    multiplier: 900,
    pricePerTicket: 20,
    digits: ["A", "B", "C"],
    cat: 3,
  },
];

const BettingSection: React.FC = () => {
  return (
    <section className={styles.section}>
      {/* Single */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Single Digit</h2>
      </div>

      <div className={styles.grid}>
        {BET_OPTIONS.map((opt) => (
          <BetRow key={opt.type} {...opt} />
        ))}
      </div>

      {/* Double */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Double Digit</h2>
      </div>

      <div className={styles.grid}>
        {DOUBLE_OPTIONS.map((opt) => (
          <BetRow key={opt.type} {...opt} />
        ))}
      </div>

      {/* Triple */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Triple Digit</h2>
      </div>

      <div className={styles.grid}>
        {TRIPLE_OPTIONS.map((opt) => (
          <BetRow key={opt.type} {...opt} />
        ))}
      </div>
    </section>
  );
};

export default BettingSection;