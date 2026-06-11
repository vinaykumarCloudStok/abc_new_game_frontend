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
  myOrderSubTab?: "bet" | "settlement";
  /** Count of pending bets that belong to other (non-selected) lobbies */
  otherLobbyCount?: number;
}

/* Format any numeric value as Indian Rupees (display only, no logic change) */
const rsFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});
const formatRs = (val: number | string | undefined | null) =>
  `₹${rsFormatter.format(Number(val ?? 0))}`;

const OrderListSection: React.FC<OrderListProp> = ({
  loading,
  currentData,
  activeTab,
  myOrderSubTab,
  otherLobbyCount = 0,
}) => {
  const isOpenBetsTab = activeTab === "myorder" && myOrderSubTab === "bet";

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
        <div className={styles.emptyOrder}>
          {isOpenBetsTab
            ? "No open bets for this lobby"
            : "No data found"}
        </div>
        {isOpenBetsTab && otherLobbyCount > 0 && (
          <div className={styles.otherLobbyNote}>
            You have {otherLobbyCount} pending bet
            {otherLobbyCount > 1 ? "s" : ""} in other lobb
            {otherLobbyCount > 1 ? "ies" : "y"}. Switch the lobby tab above to
            view {otherLobbyCount > 1 ? "them" : "it"}.
          </div>
        )}
      </div>
    );
  }

  /* ===================================================
     GAME HISTORY — clean one-line result rows
  =================================================== */
  if (activeTab === "game") {
    const games = currentData as LobbyHistoryItem[];
    return (
      <div className={styles.gameList}>
        {games.map((item) => {
          const result = item.result;

          return (
            <div key={item.lobby_uuid} className={styles.gameRow}>
              <div className={styles.gameRowLeft}>
                <div className={styles.gameField}>
                  <span className={styles.gameFieldLabel}>Result Time</span>
                  <span className={styles.gameTime}>
                    {formatDate(item.result_at)}
                  </span>
                </div>
                <div className={styles.gameField}>
                  <span className={styles.gameFieldLabel}>Lobby ID</span>
                  <span className={styles.gameLobbyId} title={item.lobby_uuid}>
                    {item.lobby_uuid}
                  </span>
                </div>
              </div>

              <div className={styles.gameResultCol}>
                <span className={styles.gameFieldLabel}>Result</span>
                {result ? (
                  <div className={styles.gameBalls}>
                    {(["a", "b", "c"] as const).map((key) => (
                      <span key={key} className={styles.gameBall}>
                        {result[key]}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className={styles.gamePending}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ===================================================
     MY ORDER (bet | settlement)  &  ROLLBACK
  =================================================== */
  const bets = currentData as BetHistoryItem[];
  const isRollback = activeTab === "rollback";
  const isSettlement = activeTab === "myorder" && myOrderSubTab === "settlement";
  const isPendingBet = activeTab === "myorder" && myOrderSubTab === "bet";

  return (
    <div className={styles.orderList}>
      {bets.map((item) => {
        const result = safeParse(item.result);

        const betResults: BetResult[] = isSettlement
          ? safeParse(item.bet_results)
          : safeParse(item.userBets || item.bets);

        const totalBetsCount = betResults?.length || 0;
        const isOverallWin = isSettlement && Number(item.win_amount) > 0;

        let statusLabel = "";
        let statusClass = "";
        if (isRollback) {
          statusLabel = "REFUNDED";
          statusClass = styles.statusRollback;
        } else if (isPendingBet) {
          statusLabel = "PENDING";
          statusClass = styles.statusPending;
        } else if (isOverallWin) {
          statusLabel = "WIN";
          statusClass = styles.statusWin;
        } else {
          statusLabel = "LOSS";
          statusClass = styles.statusLoss;
        }

        const headingLabel = isRollback
          ? "ROLLBACK"
          : isSettlement
          ? "SETTLEMENT"
          : "BET PLACED";

        return (
          <div
            key={item.id || item.settlement_id || item.lobby_id}
            className={`${styles.orderItem} ${
              isRollback ? styles.orderItemRollback : ""
            }`}
          >
            <div className={styles.orderHeader}>
              <div className={styles.orderTopRow}>
                <span className={styles.orderType}>{headingLabel}</span>
                <span className={statusClass}>{statusLabel}</span>
              </div>

              <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>
                    Result Time
                  </span>
                  <span className={styles.metaValue}>
                    {formatDate(
                      isPendingBet ? item.result_at : item.created_at
                    )}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Lobby ID</span>
                  <span className={styles.metaValue}>{item.lobby_id}</span>
                </div>
              </div>
            </div>

            {/* ROLLBACK refund summary banner */}
            {isRollback && (
              <div className={styles.refundBanner}>
                <span className="material-symbols-outlined">undo</span>
                <span>
                  {totalBetsCount > 0
                    ? `${totalBetsCount} ticket${
                        totalBetsCount > 1 ? "s" : ""
                      } refunded to your wallet`
                    : "Amount refunded to your wallet"}
                </span>
              </div>
            )}

            <div className={styles.amountGrid}>
              <div className={styles.amountCard}>
                <div className={styles.amountLabel}>Bet Amount</div>
                <div className={styles.amountValue}>
                  {formatRs(item.bet_amount || item.total_bet_amount || 0)}
                </div>
              </div>

              {/* Settlement → Total Tickets */}
              {isSettlement && (
                <div className={styles.amountCard}>
                  <div className={styles.amountLabel}>Total Tickets</div>
                  <div className={styles.amountValue}>{totalBetsCount}</div>
                </div>
              )}

              {/* Rollback → Refunded Tickets count */}
              {isRollback && (
                <div className={styles.amountCard}>
                  <div className={styles.amountLabel}>Refunded Tickets</div>
                  <div className={styles.amountValue}>{totalBetsCount}</div>
                </div>
              )}

              <div className={styles.amountCard}>
                <div className={styles.amountLabel}>
                  {isRollback
                    ? "Refund Amount"
                    : isSettlement
                    ? "Win Amount"
                    : "Total Tickets"}
                </div>

                <div
                  className={`${styles.amountValue} ${
                    isOverallWin ? styles.amountWin : ""
                  } ${isRollback ? styles.amountRefund : ""}`}
                >
                  {isRollback
                    ? formatRs(item.refund_amount || 0)
                    : isSettlement
                    ? formatRs(item.win_amount || 0)
                    : totalBetsCount}
                </div>
              </div>
            </div>

            {result && result.a !== undefined && (
              <div className={styles.resultBalls}>
                {(["a", "b", "c"] as const).map((key) => (
                  <div key={key} className={styles.ballGroup}>
                    <span className={styles.ballLabel}>{key.toUpperCase()}</span>
                    <span className={styles.ball}>{result[key]}</span>
                  </div>
                ))}
              </div>
            )}

            {betResults?.length > 0 && (
              <div className={styles.chipSection}>
                <div className={styles.sectionLabel}>
                  {isRollback
                    ? "Refunded bets"
                    : isSettlement
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
                      isRollback
                        ? styles.chipRefund
                        : isWin
                        ? styles.chipWin
                        : isLoss
                        ? styles.chipLoss
                        : styles.chipNeutral,
                    ].join(" ");

                    return (
                      <div key={i} className={tileClass}>
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

                        <div className={styles.chipInfo}>
                          {isSettlement && (
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
                          {isRollback && (
                            <span className={styles.chipStatusRefund}>
                              REFUNDED
                            </span>
                          )}
                          {isPendingBet && (
                            <span className={styles.chipStatusPending}>
                              PENDING
                            </span>
                          )}
                        </div>

                        <span className={styles.chipAmt}>
                          {formatRs(betAmt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {isPendingBet && otherLobbyCount > 0 && (
        <div className={styles.otherLobbyNote}>
          You also have {otherLobbyCount} pending bet
          {otherLobbyCount > 1 ? "s" : ""} in other lobb
          {otherLobbyCount > 1 ? "ies" : "y"}. Switch the lobby tab above to
          view {otherLobbyCount > 1 ? "them" : "it"}.
        </div>
      )}
    </div>
  );
};

export default OrderListSection;
