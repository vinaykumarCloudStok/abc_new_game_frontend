import React from 'react';
import styles from './Header.module.css';
import { useAppSelector } from '../../hooks/redux';

const Header: React.FC = () => {
  const info = useAppSelector((s) => s.socketSlice.info);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.backBtn} aria-label="Go back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className={styles.title}>ABC</h1>
      </div>
      <div className={styles.wallet}>
        <span className={`material-symbols-outlined ${styles.walletIcon}`}>
          account_balance_wallet
        </span>
        <span className={styles.walletAmount}>
        {info.balance}
        </span>
      </div>
    </header>
  );
};

export default Header;
