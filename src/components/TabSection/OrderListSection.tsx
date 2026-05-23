import React from "react";
import {
  formatDate,
  parseChip,
  safeParse,
  type BetHistoryItem,
  type BetResult,
  type LobbyHistoryItem,
  type TabType,
} from "../../types";
import styles from "./TabSection.module.css";

interface OrderListProp {
  loading: boolean;
  currentData: BetHistoryItem[] | LobbyHistoryItem[];
  activeTab: TabType;
}

const OrderListSection: React.FC<OrderListProp> = ({
  loading,
  currentData,
  activeTab,
}) => {
  /* ---------- LOADING / EMPTY ---------- */
  if (loading) {
    return (
      <div className={styles.orderList}>
        <div className={styles.emptyOrder}>Loading...</div>
      </div>
    );
  }

  if (!currentData || currentData.length === 0) {
    return (
      <div className={styles.orderList}>
        <div className={styles.emptyOrder}>No data found</div>
      </div>
    );
  }

  /* ===================================================
     GAME HISTORY TAB  →  /lobby-history data
  =================================================== */
  if (activeTab === "game") {
    const games = currentData as LobbyHistoryItem[];

    return (
      <div className={styles.orderList}>
        {games.map((item) => {
          const hasResult = item.result !== null && item.result !== undefined;
        

          return (
            <div key={item.lobby_uuid} className={styles.orderItem}>
              {/* HEADER */}
              <div className={styles.orderHeader}>
                <div className={styles.orderMeta}>
                  <div className={styles.orderTopRow}>
                    <span className={styles.orderType}>GAME RESULT</span>
                    <span
                      className={
                        hasResult ? styles.statusWin : styles.statusRollback
                      }
                    >
                      {hasResult ? "DECLARED" : "PENDING"}
                    </span>
                  </div>
                  <span className={styles.orderId}>{item.lobby_uuid}</span>
                  <span
                    className={styles.orderDate}
                    style={{ textTransform: "uppercase" }}
                  >
                    {formatDate(item.result_at)}
                  </span>
                </div>
              </div>

              {/* RESULT BALLS — A / B / C + SUM */}
              {hasResult ? (
                <div className={styles.resultBalls}>
                  {(["a", "b", "c"] as const).map((key) => (
                    <div key={key} className={styles.ballGroup}>
                      <span className={styles.ballLabel}>
                        {key.toUpperCase()}
                      </span>
                      <span className={styles.ball}>{item.result![key]}</span>
                    </div>
                  ))}

                  
                </div>
              ) : (
                <div className={styles.pendingResult}>
                  Result will be declared soon
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  /* ===================================================
     BET / SETTLEMENT / ROLLBACK TABS  →  /bet-history data
  =================================================== */
  const bets = currentData as BetHistoryItem[];

  return (
    <div className={styles.orderList}>
      {bets.map((item) => {
        const result = safeParse(item.result);

        // settlement tab → bet_results (has btAmt, chip, status)
        // bet/rollback tab → userBets or bets (has amt, chip)
        const betResults: BetResult[] =
          activeTab === "settlement"
            ? safeParse(item.bet_results)
            : safeParse(item.userBets || item.bets);

        const totalBetsCount = betResults?.length || 0;
        const isOverallWin =
          activeTab === "settlement" && Number(item.win_amount) > 0;

        return (
          <div
            key={item.id || item.settlement_id}
            className={styles.orderItem}
          >
            {/* HEADER */}
            <div className={styles.orderHeader}>
              <div className={styles.orderMeta}>
                <div className={styles.orderTopRow}>
                  <span className={styles.orderType}>
                    {activeTab === "bet"
                      ? "RESULT"
                      : activeTab === "settlement"
                      ? "SETTLEMENT"
                      : "ROLLBACK"}
                  </span>
                  {activeTab !== "bet" && (
                    <span
                      className={
                        activeTab === "rollback"
                          ? styles.statusRollback
                          : isOverallWin
                          ? styles.statusWin
                          : styles.statusLoss
                      }
                    >
                      {activeTab === "rollback"
                        ? "REFUNDED"
                        : isOverallWin
                        ? "WIN"
                        : "LOSS"}
                    </span>
                  )}
                </div>
                <span className={styles.orderId}>{item.lobby_id}</span>
                <span
                  className={styles.orderDate}
                  style={{ textTransform: "uppercase" }}
                >
                  {formatDate(item.created_at)}
                </span>
              </div>
            </div>

            {/* AMOUNT SECTION */}
            <div className={styles.amountGrid}>
              <div className={styles.amountCard}>
                <div className={styles.amountLabel}>Bet Amount</div>
                <div className={styles.amountValue}>
                  ₹{item.bet_amount || item.total_bet_amount}
                </div>
              </div>

              <div className={styles.amountCard}>
                <div className={styles.amountLabel}>
                  {activeTab === "rollback"
                    ? "Refund"
                    : activeTab === "settlement"
                    ? "Win Amount"
                    : "Total Bets"}
                </div>
                <div
                  className={`${styles.amountValue} ${
                    isOverallWin ? styles.amountWin : ""
                  }`}
                >
                  {activeTab === "rollback"
                    ? `₹${item.refund_amount}`
                    : activeTab === "settlement"
                    ? `₹${item.win_amount}`
                    : `${totalBetsCount}`}
                </div>
              </div>
            </div>

            {/* RESULT BALLS — A / B / C */}
            {result && result.a !== undefined && (
              <div className={styles.resultBalls}>
                {(["a", "b", "c"] as const).map((key) => (
                  <div key={key} className={styles.ballGroup}>
                    <span className={styles.ballLabel}>
                      {key.toUpperCase()}
                    </span>
                    <span className={styles.ball}>{result[key]}</span>
                  </div>
                ))}
              </div>
            )}

            {/* BET CHIP TILES */}
            {betResults?.length > 0 && (
              <div className={styles.chipSection}>
                <div className={styles.sectionLabel}>
                  {activeTab === "rollback"
                    ? "Refunded bets"
                    : activeTab === "settlement"
                    ? "Bet results"
                    : "Bets placed"}
                </div>

                <div className={styles.chipGrid}>
                  {betResults.map((bet: BetResult, i: number) => {
                    const chipParts = parseChip(bet.chip || "");
                    const isWin = bet.status === "win";
                    const isLoss = bet.status === "loss";
                    const betAmt = bet.btAmt ?? bet.amt ?? 0;

                    const tileClass = [
                      styles.chipTile,
                      activeTab === "rollback"
                        ? styles.chipRefund
                        : isWin
                        ? styles.chipWin
                        : isLoss
                        ? styles.chipLoss
                        : styles.chipNeutral,
                    ].join(" ");

                    return (
                      <div key={i} className={tileClass}>
                        {/* Letter + Number boxes */}
                        <div className={styles.chipBoxes}>
                          {chipParts.map((part, pi) => (
                            <React.Fragment key={pi}>
                              {pi > 0 && (
                                <span className={styles.chipSep}>+</span>
                              )}
                              <div className={styles.chipLetterBox}>
                                {part.letter}
                              </div>
                              <div className={styles.chipNumberBox}>
                                {part.number}
                              </div>
                            </React.Fragment>
                          ))}
                        </div>

                        {/* Info */}
                        <div className={styles.chipInfo}>
                          {activeTab === "settlement" && (
                            <span
                              className={`${styles.chipStatus} ${
                                isWin
                                  ? styles.chipStatusWin
                                  : styles.chipStatusLoss
                              }`}
                            >
                              {isWin ? "WIN" : "LOSS"}
                            </span>
                          )}
                          {activeTab === "rollback" && (
                            <span className={styles.chipStatusRefund}>
                              REFUNDED
                            </span>
                          )}
                        </div>

                        {/* Amount */}
                        <span className={styles.chipAmt}>₹{betAmt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OrderListSection;