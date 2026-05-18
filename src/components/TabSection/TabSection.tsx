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

// =========================================================
// SAFE PARSER (IMPORTANT FIX FOR YOUR ROLLBACK ISSUE)
// =========================================================
const safeParse = (data: any) => {
  if (!data) return [];

  try {
    if (typeof data === "object") return data;

    let parsed = JSON.parse(data);

    // handle double stringified JSON
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }

    return parsed;
  } catch {
    return [];
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
      {/* ========================================================= */}
      {/* TABS */}
      {/* ========================================================= */}
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

      {/* ========================================================= */}
      {/* CONTENT */}
      {/* ========================================================= */}
      <div className={styles.orderList}>
        {loading ? (
          <div className={styles.emptyOrder}>Loading...</div>
        ) : currentData.length === 0 ? (
          <div className={styles.emptyOrder}>No data found</div>
        ) : (
          currentData.map((item) => {
            const userBets = safeParse(item.userBets || item.bets);
            const betResults = safeParse(item.bet_results);
            const result = safeParse(item.result);

            const totalBetsCount = userBets?.length || 0;

            return (
              <div key={item.id || item.settlement_id} className={styles.orderItem}>

                {/* HEADER */}
                <div className={styles.orderHeader}>
                  <div className={styles.orderMeta}>
                    <span className={styles.orderType}>
                      {activeTab.toUpperCase()}
                    </span>

                    <span className={styles.orderId}>
                      {item.lobby_id}
                    </span>
                  </div>

                  {/* STATUS (FIX: BET TAB HIDE WIN/LOSS AS REQUESTED) */}
                  {activeTab !== "bet" && (
                    <span
                      className={
                        activeTab === "rollback"
                          ? styles.statusRollback
                          : Number(item.win_amount) > 0
                          ? styles.statusWin
                          : styles.statusLoss
                      }
                    >
                      {activeTab === "rollback"
                        ? "REFUNDED"
                        : Number(item.win_amount) > 0
                        ? "WIN"
                        : "LOSS"}
                    </span>
                  )}
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
                        ? "Win"
                        : "Bets"}
                    </div>

                    <div className={styles.amountValue}>
                      {activeTab === "rollback"
                        ? `₹${item.refund_amount}`
                        : activeTab === "settlement"
                        ? `₹${item.win_amount}`
                        : `${totalBetsCount} Bets`}
                    </div>
                  </div>
                </div>

                {/* RESULT */}
                {result && result.a !== undefined && (
                  <div className={styles.resultBalls}>
                    <span className={styles.ball}>{result.a}</span>
                    <span className={styles.ball}>{result.b}</span>
                    <span className={styles.ball}>{result.c}</span>
                  </div>
                )}

                {/* BET DETAILS */}
                {userBets?.length > 0 && (
                  <div className={styles.betResults}>
                    {userBets.map((bet: any, i: number) => (
                      <div key={i} className={styles.betResultItem}>
                        <span>{bet.chip}</span>
                        <span>₹{bet.amt}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* SETTLEMENT DETAILS */}
                {activeTab === "settlement" &&
                  betResults?.length > 0 && (
                    <div className={styles.betResults}>
                      {betResults.map((bet: any, i: number) => (
                        <div key={i} className={styles.betResultItem}>
                          <span>{bet.chip}</span>
                          <span>{bet.status}</span>
                        </div>
                      ))}
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