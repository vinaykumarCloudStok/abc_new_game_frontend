import React, { useEffect } from 'react';
import styles from './RulesModal.module.css';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { toggleRulesModal } from '../../store/slices/socketSlice';
import { MdClose } from 'react-icons/md';


const RulesModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((s) => s.socketSlice.isRulesModalOpen);

  // While the rules modal is open, lock the page (game) behind it so it
  // doesn't scroll underneath the modal. The real scroll container here is
  // the root <html> element (the body just grows with content), so locking
  // body.overflow alone does nothing — we lock <html> too. Freezing the body
  // with position:fixed is also what stops touch-scrolling on mobile Safari.
  //
  // IMPORTANT: the body is centered via `max-width:430 + margin:0 auto`, and
  // margin:auto only centers a position:fixed element when BOTH left and right
  // are set. So we pin left:0 / right:<scrollbarWidth> (NOT width:100%, which
  // collapses the auto margins and shoves the layout to the left). The
  // scrollbar width compensates for the scrollbar disappearing so nothing
  // shifts. Scroll position is captured and restored on close.
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const html = document.documentElement;
    const scrollbarWidth = window.innerWidth - html.clientWidth;

    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
    };

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = `${scrollbarWidth}px`;

    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

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
