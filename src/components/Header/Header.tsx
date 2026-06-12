import React from 'react';
import styles from './Header.module.css';
import { useAppSelector } from '../../hooks/redux';
import logo from '../../assets/logo.png';
import { formatBalance } from '../../utils/helper';
import { MdPerson, MdAccountBalanceWallet, MdChevronRight } from 'react-icons/md';

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
          <MdPerson className={styles.userIcon} />
          <span className={styles.userId}>{info.user_id}</span>
        </div>

        {/* Wallet pill — clickable, goes to wallet screen */}
        <button
          type="button"
          className={styles.walletBtn}
          onClick={handleWalletClick}
          aria-label="Go to wallet"
        >
          <MdAccountBalanceWallet className={styles.walletIcon} />
          <span className={styles.walletAmount}>
            {formatBalance(Number(info.balance))}
          </span>
          <MdChevronRight className={styles.chevron} />
        </button>
      </div>
    </header>
  );
};

export default Header;
