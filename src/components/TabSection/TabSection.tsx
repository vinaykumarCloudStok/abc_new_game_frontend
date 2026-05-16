import React from 'react';
import styles from './TabSection.module.css';


const TabSection: React.FC = () => {
  // const dispatch = useAppDispatch();
 

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn}`}
   
        >
          Result History
        </button>
        <button
          className={`${styles.tabBtn}`}
        
        >
          My Order
        </button>
      </div>

      {/* {activeTab === 'result' ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Issue</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Time</th>
                <th className={`${styles.th} ${styles.thRight}`}>Number</th>
              </tr>
            </thead>
            <tbody>
              {drawResults.map((row) => (
                <tr key={row.issue} className={styles.tr}>
                  <td className={styles.td}>{row.issue}</td>
                  <td className={`${styles.td} ${styles.tdCenter}`}>{row.time}</td>
                  <td className={`${styles.td} ${styles.tdRight}`}>
                    <div className={styles.resultBalls}>
                      {row.numbers.map((n, i) => (
                        <span key={i} className={styles.ball}>{n}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          {cart.length === 0 ? (
            <div className={styles.emptyOrder}>
              <span className={`material-symbols-outlined ${styles.emptyIcon}`}>
                receipt_long
              </span>
              <p className={styles.emptyText}>No orders for today yet</p>
            </div>
          ) : (
            <div className={styles.orderList}>
              {cart.map((item) => (
                <div key={item.id} className={styles.orderItem}>
                  <div className={styles.orderMeta}>
                    <span className={styles.orderType}>{item.betType} — {item.lobby}</span>
                    <span className={styles.orderDetail}>
                      {item.quantity} × ${item.pricePerTicket.toFixed(2)} • Win {item.multiplier}X
                    </span>
                  </div>
                  <div className={styles.orderRight}>
                    <span className={styles.orderTotal}>
                      ${(item.quantity * item.pricePerTicket).toFixed(2)}
                    </span>
                    <button
                      className={styles.removeBtn}
                      onClick={() => dispatch(removeFromCart(item.id))}
                      aria-label="Remove"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )} */}
    </div>
  );
};

export default TabSection;
