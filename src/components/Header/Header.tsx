import React from 'react';
import styles from './Header.module.css';
import { useAppSelector } from '../../hooks/redux';
import logo from '../../assets/screen.png';
import { formatBalance } from '../../utils/helper';

const Header: React.FC = () => {
  const info = useAppSelector((s) => s.socketSlice.info);

  const handleWalletClick = () => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "OPEN_WALLET" }, "*");
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.title}>
          <img src={logo} alt="logo" />
        </div>
      </div>

      <div className={styles.right}>
        {/* User ID pill — display only */}
        <div className={styles.userPill}>
          <span className={`material-symbols-outlined ${styles.userIcon}`}>
            person
          </span>
          <span className={styles.userId}>{info.user_id}</span>
        </div>

        {/* Wallet pill — clickable, goes to wallet screen */}
        <button
          type="button"
          className={styles.walletBtn}
          onClick={handleWalletClick}
          aria-label="Go to wallet"
        >
          <span className={`material-symbols-outlined ${styles.walletIcon}`}>
            account_balance_wallet
          </span>
          <span className={styles.walletAmount}>
            {formatBalance(Number(info.balance))}
          </span>
          <span className={`material-symbols-outlined ${styles.chevron}`}>
            chevron_right
          </span>
        </button>
      </div>
    </header>
  );
};

export default Header;