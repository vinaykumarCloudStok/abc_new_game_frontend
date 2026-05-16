export type BetType = 'A' | 'B' | 'C' | 'AB' | 'AC' | 'BC' | 'ABC';

export interface BetOption {
  type: BetType;
  betType: BetType;
  label: string;
  multiplier: number;
  pricePerTicket: number;
  digits: string[];
}

export interface CartItem {
  id: string;
  betType: BetType;
  quantity: number;
  pricePerTicket: number;
  multiplier: number;
  lobby: string;
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
export interface SocketState {
  connected: boolean;
  loading: boolean;
  info:InfoData;
  isRulesModalOpen: boolean;
  lobbies: Lobby[],
}
export interface Lobby {
  lobby_uuid: string;
  result_at: string;
  bet_close_at: string;
  status: string;
  result: string | null;
}