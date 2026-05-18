/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import styles from "./TabSection.module.css";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import axios from "axios";

type TabType = "bet" | "settlement" | "rollback";

interface BetHistoryItem {
  id?: number;
  settlement_id?: number;

  lobby_id: string;
  user_id: string;
  operator_id: string;

  bet_amount?: string;
  win_amount?: string;

  total_bet_amount?: string;
  refund_amount?: string;

  userBets?: any;
  bets?: any;

  result?: string;
  bet_results?: string;

  created_at: string;
}

interface BetResult {
  btAmt?: number;
  amt?: number;
  chip: string;
  winAmt?: number;
  mult?: number;
  status?: "win" | "loss";
}

interface ChipPart {
  letter: string;
  number: string;
}

// =========================================================
// SAFE PARSER
// =========================================================
const safeParse = (data: any): any => {
  if (!data) return [];
  try {
    if (typeof data === "object") return data;
    let parsed = JSON.parse(data);
    if (typeof parsed === "string") parsed = JSON.parse(parsed);
    return parsed;
  } catch {
    return [];
  }
};

// =========================================================
// CHIP PARSER
// Handles BOTH formats: "1:A" and "A:1"
// Also handles combos: "A:1-B:2-C:3"
// Always returns { letter, number } in correct order
// =========================================================
const parseChip = (chip: string): ChipPart[] => {
  if (!chip) return [];
  return chip.split("-").map((part) => {
    const [left, right] = part.split(":");
    const leftIsLetter = isNaN(Number(left));
    return {
      letter: leftIsLetter ? left : right,
      number: leftIsLetter ? right : left,
    };
  });
};

// =========================================================
// FORMAT DATE
// =========================================================
const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

const TabSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("bet");
  const [loading, setLoading] = useState(false);

  const [betData, setBetData] = useState<BetHistoryItem[]>([]);
  const [settlementData, setSettlementData] = useState<BetHistoryItem[]>([]);
  const [rollbackData, setRollbackData] = useState<BetHistoryItem[]>([]);

  const info = useSelector((state: RootState) => state.socketSlice.info);

  // =========================================================
  // API CALL
  // =========================================================
  const fetchHistory = async (status: TabType) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BASE_SOCKET_URL}bet-history?user_id=${info.user_id}&operator_id=${info.operator_id}&type=${status}`
      );
      const data = res?.data?.data || [];
      if (status === "bet") setBetData(data);
      if (status === "settlement") setSettlementData(data);
      if (status === "rollback") setRollbackData(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (info.user_id && info.operator_id) {
      fetchHistory(activeTab);
    }
  }, [activeTab, info.user_id, info.operator_id]);

  const currentData = useMemo(() => {
    if (activeTab === "bet") return betData;
    if (activeTab === "settlement") return settlementData;
    return rollbackData;
  }, [activeTab, betData, settlementData, rollbackData]);

  return (
    <div className={styles.container}>
      {/* TABS */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${activeTab === "bet" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("bet")}
        >
          Result History
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "settlement" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("settlement")}
        >
          My Order
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "rollback" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("rollback")}
        >
          Rollback
        </button>
      </div>

      {/* CONTENT */}
      <div className={styles.orderList}>
        {loading ? (
          <div className={styles.emptyOrder}>Loading...</div>
        ) : currentData.length === 0 ? (
          <div className={styles.emptyOrder}>No data found</div>
        ) : (
          currentData.map((item) => {
            const result = safeParse(item.result);

            // settlement tab → use bet_results (has btAmt, chip, status)
            // bet/rollback tab → use userBets or bets (has amt, chip)
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
                    <span className={styles.orderDate}>
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
          })
        )}
      </div>
    </div>
  );
};

export default TabSection;