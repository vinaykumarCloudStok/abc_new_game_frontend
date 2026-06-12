import React from 'react';
import styles from './RulesModal.module.css';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { toggleRulesModal } from '../../store/slices/socketSlice';
import { MdClose } from 'react-icons/md';


const RulesModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((s) => s.socketSlice.isRulesModalOpen);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Game Rules">
      <div className={styles.backdrop} onClick={() => dispatch(toggleRulesModal())} />
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Game Rules</h2>
          <button
            className={styles.closeBtn}
            onClick={() => dispatch(toggleRulesModal())}
            aria-label="Close modal"
          >
            <MdClose />
          </button>
        </div>

        <div className={styles.body}>
          <p>
            <span className={styles.ruleKey}>Single Digit:</span> Predict one digit in a
            specific position (A, B, or C). Win <strong>100 per ticket</strong>.
          </p>
          <p>
            <span className={styles.ruleKey}>Double Digit:</span> Predict two digits in
            specific positions (AB, AC, or BC). Win <strong>1000 per ticket</strong>.
          </p>
          <p>
            <span className={styles.ruleKey}>Triple Digit:</span> Predict all three digits
            (ABC). Win <strong>10000 per ticket</strong>.
          </p>
          <p>
            <span className={styles.ruleKey}>Maximum Bet:</span> The highest amount you can
            place on a single draw is <strong>₹2,00,000</strong>.
          </p>
          <p className={styles.divider}>
            Draws happen every hour. <strong>Betting closes 5 minutes before the draw</strong>,
            so place your bets before the cut-off time.
          </p>
        </div>

        <button
          className={styles.gotItBtn}
          onClick={() => dispatch(toggleRulesModal())}
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default RulesModal;
