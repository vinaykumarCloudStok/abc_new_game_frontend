import React from 'react';
import styles from './Header.module.css';
import { useAppSelector } from '../../hooks/redux';
import logo from '../../assets/screen.png'
import { formatBalance } from '../../utils/helper';
const Header: React.FC = () => {
  const info = useAppSelector((s) => s.socketSlice.info);
console.log(info)
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {/* <button className={styles.backBtn} aria-label="Go back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button> */}
        <div className={styles.title}>
          <img src={logo} alt="" />
        </div>
      </div>
      <div className={styles.wallet}>
      <span className={styles.walletAmount}>
        {info.user_id}
        </span>
       <div className={styles.flexCol}>
         <span className={`material-symbols-outlined ${styles.walletIcon}`}>
          account_balance_wallet
        </span>
        <span className={styles.walletAmount}>
        {formatBalance(Number(info.balance))}
        </span>
       </div>
      </div>
    </header>
  );
};

export default Header;
