import React from 'react';
import styles from './InfoCard.module.css';
import { toggleRulesModal } from '../../store/slices/socketSlice';
import { useAppDispatch } from '../../hooks/redux';


const InfoCard: React.FC = () => {
 const dispatch = useAppDispatch();

  return (
    <section className={styles.card}>
      <div className={styles.glow} />
      <div>
        <p className={styles.label}>Last Draw Result</p>
        <div className={styles.digits}>
          
            <div className={styles.digitBall}>
              1
            </div>
      
        </div>
      </div>
      <button
        className={styles.helpBtn}
        onClick={() => dispatch(toggleRulesModal())}
        aria-label="Show rules"
      >
        <span className="material-symbols-outlined">help</span>
      </button>
    </section>
  );
};

export default InfoCard;
