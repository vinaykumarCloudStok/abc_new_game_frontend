/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import styles from "./TabSection.module.css";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import axios from "axios";
import type { BetHistoryItem, LobbyHistoryItem, TabType } from "../../types";
import OrderListSection from "./OrderListSection";

type MyOrderSubTab = "bet" | "settlement";

const TabSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("myorder");
  const [myOrderSubTab, setMyOrderSubTab] = useState<MyOrderSubTab>("bet");
  const [loading, setLoading] = useState(false);

  const [gameHistoryData, setGameHistoryData] = useState<LobbyHistoryItem[]>([]);
  const [betData, setBetData] = useState<BetHistoryItem[]>([]);
  const [settlementData, setSettlementData] = useState<BetHistoryItem[]>([]);
  const [rollbackData, setRollbackData] = useState<BetHistoryItem[]>([]);

  const info = useSelector((state: RootState) => state.socketSlice.info);
  const selectedLobby = useSelector(
    (state: RootState) => state.socketSlice.selectedLobby
  );

 const fetchGameHistory = async () => {
  try {
    setLoading(true);

    const res = await axios.get(
      `${import.meta.env.VITE_APP_BASE_SOCKET_URL}/lobby-history?user_id=${info.user_id}&operator_id=${info.operator_id}`
    );

    const data = res?.data?.data || [];

    const sortedData = data.sort((a: LobbyHistoryItem, b: LobbyHistoryItem) => {
      if (a.result && !b.result) return -1;
      if (!a.result && b.result) return 1;

      return (
        new Date(b.result_at).getTime() -
        new Date(a.result_at).getTime()
      );
    });

    setGameHistoryData(sortedData);
  } catch (err) {
    console.log(err);
  } finally {
    setLoading(false);
  }
};

  const fetchBetHistory = async (status: "bet" | "settlement" | "rollback") => {
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

  // MAIN TAB EFFECT
  useEffect(() => {
    if (!info.user_id || !info.operator_id) return;

    if (activeTab === "game") {
      fetchGameHistory();
    } else if (activeTab === "myorder") {
      // fetch the currently-selected sub-tab
      fetchBetHistory(myOrderSubTab);
    } else if (activeTab === "rollback") {
      fetchBetHistory("rollback");
    }
  }, [activeTab, info.user_id, info.operator_id]);

  // SUB-TAB EFFECT — refetch when sub-tab changes (only while inside My Order)
  useEffect(() => {
    if (activeTab !== "myorder") return;
    if (!info.user_id || !info.operator_id) return;

    fetchBetHistory(myOrderSubTab);
  }, [myOrderSubTab]);

useEffect(() => {
  const handleRefresh = () => {
    if (!info.user_id || !info.operator_id) return;

    // refresh current myorder tab
    if (activeTab === "myorder") {
      fetchBetHistory(myOrderSubTab);
    }
  };

  window.addEventListener("refreshBetHistory", handleRefresh);

  return () => {
    window.removeEventListener("refreshBetHistory", handleRefresh);
  };
}, [activeTab, myOrderSubTab, info.user_id, info.operator_id]);

  const myOrderData = useMemo(() => {
    if (myOrderSubTab === "settlement") {
      return [...settlementData].sort((a, b) => {
        const ta = new Date(a.created_at || 0).getTime();
        const tb = new Date(b.created_at || 0).getTime();
        return tb - ta;
      });
    }

    // Group bet rows by lobby_id
    const grouped = new Map<string, BetHistoryItem>();

    betData.forEach((b) => {
      if (!b.lobby_id) return;
      const existing = grouped.get(b.lobby_id);

      if (!existing) {
        const rawBets =
          (typeof b.userBets === "string"
            ? JSON.parse(b.userBets || "[]")
            : b.userBets) || [];
        grouped.set(b.lobby_id, {
          ...b,
          bet_amount: String(Number(b.bet_amount || 0)),
          userBets: JSON.stringify(rawBets),
        });
      } else {
        const existingBets =
          (typeof existing.userBets === "string"
            ? JSON.parse(existing.userBets || "[]")
            : existing.userBets) || [];
        const newBets =
          (typeof b.userBets === "string"
            ? JSON.parse(b.userBets || "[]")
            : b.userBets) || [];

        const combined = [...existingBets, ...newBets];
        const totalAmt =
          Number(existing.bet_amount || 0) + Number(b.bet_amount || 0);

        const earliestCreatedAt =
          new Date(b.created_at) < new Date(existing.created_at!)
            ? b.created_at
            : existing.created_at;

        grouped.set(b.lobby_id, {
          ...existing,
          bet_amount: String(totalAmt),
          userBets: JSON.stringify(combined),
          created_at: earliestCreatedAt,
        });
      }
    });

    return Array.from(grouped.values()).sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return tb - ta;
    });
  }, [betData, settlementData, myOrderSubTab]);

  // -------------------------------------------------------------------
  // OPEN BETS — show LOBBY-WISE (only the currently selected lobby).
  // Bets are always placed against the selected lobby, so the Open Bets
  // tab should reflect the lobby tab you are viewing. Pending bets in
  // other lobbies are still counted so they are never silently hidden.
  // -------------------------------------------------------------------
  const openBetsForSelectedLobby = useMemo(() => {
    if (!selectedLobby) return myOrderData;
    return myOrderData.filter((b) => b.lobby_id === selectedLobby);
  }, [myOrderData, selectedLobby]);

  const otherLobbyOpenBetCount = useMemo(() => {
    if (myOrderSubTab !== "bet" || !selectedLobby) return 0;
    return myOrderData.filter((b) => b.lobby_id !== selectedLobby).length;
  }, [myOrderData, selectedLobby, myOrderSubTab]);

 const currentData = useMemo(() => {
  if (activeTab === "game") {
    return gameHistoryData;
  }

  if (activeTab === "myorder") {
    // Open Bets → scoped to the selected lobby; Settlement → unchanged
    return myOrderSubTab === "bet" ? openBetsForSelectedLobby : myOrderData;
  }

  return rollbackData;
}, [
  activeTab,
  gameHistoryData,
  myOrderData,
  openBetsForSelectedLobby,
  myOrderSubTab,
  rollbackData,
]);

  return (
    <div className={styles.container}>
      {/* MAIN TABS */}
    <div className={styles.newContainer}>
        <div className={styles.tabs}>
             <button
          className={`${styles.tabBtn} ${activeTab === "myorder" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("myorder")}
        >
          My Order
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "game" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("game")}
        >
          Game History
        </button>
   
        <button
          className={`${styles.tabBtn} ${activeTab === "rollback" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("rollback")}
        >
          Rollback
        </button>
      </div>
      {activeTab === "myorder" && (
        <div className={styles.subTabs}>
          <button
            className={`${styles.subTabBtn} ${
              myOrderSubTab === "bet" ? styles.activeSubTab : ""
            }`}
            onClick={() => setMyOrderSubTab("bet")}
          >
            Open Bets
          </button>
          <button
            className={`${styles.subTabBtn} ${
              myOrderSubTab === "settlement" ? styles.activeSubTab : ""
            }`}
            onClick={() => setMyOrderSubTab("settlement")}
          >
            Settlement
          </button>
        </div>
      )}
    </div>

      {/* CONTENT */}
      <OrderListSection
        loading={loading}
        activeTab={activeTab}
        myOrderSubTab={activeTab === "myorder" ? myOrderSubTab : undefined}
        otherLobbyCount={otherLobbyOpenBetCount}
        currentData={currentData as any}
      />
    </div>
  );
};

export default TabSection;