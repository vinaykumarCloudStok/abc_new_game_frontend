import React from 'react';
import styles from './ActionBar.module.css';


const ActionBar: React.FC = () => {
 

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.cartLeft}>
          <div className={styles.cartIconWrapper}>
            <span className={`material-symbols-outlined ${styles.cartIcon}`}>
              shopping_cart
            </span>
            0
          </div>
          <div className={styles.cartInfo}>
            <p className={styles.cartLabel}>Total Bids: 1</p>
            <p className={styles.cartTotal}>
              1
            </p>
          </div>
        </div>
        <button
          className={styles.placeBtn}
         
         
        >
          Place Bet
        </button>
      </div>
    </div>
  );
};

export default ActionBar;
