/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import styles from "./TabSection.module.css";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import axios from "axios";
import type { BetHistoryItem, LobbyHistoryItem, TabType } from "../../types";
import OrderListSection from "./OrderListSection";

const TabSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("game");
  const [loading, setLoading] = useState(false);

  const [gameHistoryData, setGameHistoryData] = useState<LobbyHistoryItem[]>([]);
  const [betData, setBetData] = useState<BetHistoryItem[]>([]);
  const [settlementData, setSettlementData] = useState<BetHistoryItem[]>([]);
  const [rollbackData, setRollbackData] = useState<BetHistoryItem[]>([]);

  const info = useSelector((state: RootState) => state.socketSlice.info);

  const fetchGameHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BASE_SOCKET_URL}/lobby-history?user_id=${info.user_id}&operator_id=${info.operator_id}`
      );
      setGameHistoryData(res?.data?.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBetHistory = async (status: Exclude<TabType, "game">) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BASE_SOCKET_URL}/bet-history?user_id=${info.user_id}&operator_id=${info.operator_id}&type=${status}`
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
    if (!info.user_id || !info.operator_id) return;

    if (activeTab === "game") {
      fetchGameHistory();
    } else {
      fetchBetHistory(activeTab);
    }
  }, [activeTab, info.user_id, info.operator_id]);

  const currentData = useMemo(() => {
    if (activeTab === "game") return gameHistoryData;
    if (activeTab === "bet") return betData;
    if (activeTab === "settlement") return settlementData;
    return rollbackData;
  }, [activeTab, gameHistoryData, betData, settlementData, rollbackData]);

  return (
    <div className={styles.container}>
      {/* TABS */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${activeTab === "game" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("game")}
        >
          Game History
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "bet" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("bet")}
        >
          All Bets
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
      <OrderListSection
        loading={loading}
        activeTab={activeTab}
        currentData={currentData as any}
      />
    </div>
  );
};

export default TabSection;