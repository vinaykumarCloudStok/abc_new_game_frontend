/* eslint-disable @typescript-eslint/no-explicit-any */
export type BetType = 'A' | 'B' | 'C' | 'AB' | 'AC' | 'BC' | 'ABC';


export interface CartItem {
  id: string;
  betType: BetType;
  quantity: number;
  pricePerTicket: number;
  multiplier: number;
  lobby: string;
}
export interface LobbyHistoryItem {
  lobby_uuid: string;
  result_at: string;
  result: {
    a: number;
    b: number;
    c: number;
  } | null;
}
export interface DrawResult {
  issue: string;
  time: string;
  numbers: [number, number, number];
}

export interface LotteryState {
  selectedLobby: string;
  lobbies: string[];
  quantities: Record<BetType, number>;
  cart: CartItem[];
  drawResults: DrawResult[];
  lastResult: [number, number, number];
  walletBalance: number;
  activeTab: 'result' | 'order';
  isRulesModalOpen: boolean;
}

export interface InfoData {
  user_id: string;
  operator_id: string;
  balance: string;
}
export interface LobbyResult {
  lobby_uuid: string;
  result: {
    a: number;
    b: number;
    c: number;
  };
}
export interface SocketState {
  connected: boolean;
  loading: boolean;
  info:InfoData;
  isRulesModalOpen: boolean;
  lobbies: Lobby[],
 selectedLobby: string | null;
  latestResult: LobbyResult | null;
}
export interface Lobby {
  lobby_uuid: string;
  result_at: string;
  bet_close_at: string;
  status: string;
  result: string | null;
}
// types.ts
export interface BetOption {
  type: string;
  betType: string;
  label: string;
  multiplier: number;
  pricePerTicket: number;
  digits: string[];
  cat: number;
}

export type TabType =  "myorder"|"game" | "rollback";

export interface BetHistoryItem {
  id?: number;
  settlement_id?: number;
  lobby_id: string;
  user_id?: string;
  operator_id?: string;
  bet_amount?: string;
  total_bet_amount?: string;
  win_amount?: string;
  refund_amount?: string;
  userBets?: string | null;     // from /bet-history
  bets?: string | null;          // from /settlement (currently null in sample)
  bet_results?: string | null;  // from /settlement
  result?: string | null;
  txn_id?: string;
  txn_ids?: string;
  created_at: string;
}

export interface BetResult {
  btAmt?: number;
  amt?: number;
  chip: string;
  winAmt?: number;
  mult?: number;
  status?: "win" | "loss";
}

export interface ChipPart {
  letter: string;
  number: string;
}

// =========================================================
// SAFE PARSER
// =========================================================
export const safeParse = (data: any): any => {
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

export const parseChip = (chip: string): ChipPart[] => {
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
export const formatDate = (dateStr: string) => {
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