import React from 'react';
import styles from './BettingSection.module.css';
import BetRow from '../BetRow/BetRow';
import type { BetOption } from '../../types';


const BET_OPTIONS: BetOption[] = [
  { type: 'A' as const, betType: 'A' as const, label: 'A Digit', multiplier: 9, pricePerTicket: 20, digits: ['A'] },
  { type: 'B' as const, betType: 'B' as const, label: 'B Digit', multiplier: 9, pricePerTicket: 20, digits: ['B'] },
  { type: 'C' as const, betType: 'C' as const, label: 'C Digit', multiplier: 9, pricePerTicket: 20, digits: ['C'] },
];

const DOUBLE_OPTIONS: BetOption[] = [
  { type: 'AB', betType: 'AB', label: 'AB Combo', multiplier: 90, pricePerTicket: 20, digits: ['A', 'B'] },
  { type: 'AC', betType: 'AC', label: 'AC Combo', multiplier: 90, pricePerTicket: 20, digits: ['A', 'C'] },
  { type: 'BC', betType: 'BC', label: 'BC Combo', multiplier: 90, pricePerTicket: 20, digits: ['B', 'C'] },
];

const TRIPLE_OPTIONS: BetOption[] = [
  { type: 'ABC', betType: 'ABC', label: 'ABC Combo', multiplier: 900, pricePerTicket: 20, digits: ['A', 'B', 'C'] },
];

const BettingSection: React.FC = () => {
  return (
    <section className={styles.section}>
      {/* Single Digit */}
      <div className={styles.sectionHeader}>
        <div className={`${styles.accent} ${styles.accentPrimary}`} />
        <h2 className={styles.sectionTitle}>Single Digit</h2>
      </div>
      <div className={styles.grid}>
        {BET_OPTIONS.map((opt) => (
          <BetRow key={opt.type} {...opt} />
        ))}
      </div>

      {/* Double Digit */}
      <div className={styles.sectionHeader}>
        <div className={`${styles.accent} ${styles.accentTertiary}`} />
        <h2 className={styles.sectionTitle}>Double Digit</h2>
      </div>
      <div className={styles.grid}>
        {DOUBLE_OPTIONS.map((opt) => (
          <BetRow key={opt.type} {...opt} />
        ))}
      </div>

      {/* Triple Digit */}
      <div className={styles.sectionHeader}>
        <div className={`${styles.accent} ${styles.accentSecondary}`} />
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
