import React from 'react';
import styles from './BetRow.module.css';



const BetRow: React.FC = () => {


  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <div className={styles.leftInfo}>
          <div className={styles.badgeGroup}>
            
              <div  className={styles.badge}>
               1
              </div>
          
          </div>
          <div>
            <p className={styles.betName}>1</p>
            <p className={styles.multiplier}>Win 1.90X</p>
          </div>
        </div>
        <p className={styles.price}>20 / tkt</p>
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.stepper}>
          <button
            className={styles.stepBtn}
     
            aria-label="Decrease quantity"
          >
            <span className="material-symbols-outlined">remove</span>
          </button>
          <input
            className={styles.qtyInput}
            type="number"
            readOnly
            value={1}
            aria-label="Quantity"
          />
          <button
            className={styles.stepBtn}
         
            aria-label="Increase quantity"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
        <button
          className={styles.addBtn}
          
          
        >
          ADD
        </button>
      </div>
    </div>
  );
};

export default BetRow;
