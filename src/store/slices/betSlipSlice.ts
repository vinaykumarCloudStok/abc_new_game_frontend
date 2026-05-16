// store/slices/betSlipSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface BetItem {
  id: string;
  cat: number;
  chip: string;
  amt: number;
  qty: number;
  label: string;
}

interface BetSlipState {
  bets: BetItem[];
}

const initialState: BetSlipState = {
  bets: [],
};

const betSlipSlice = createSlice({
  name: "betSlip",
  initialState,

  reducers: {
    addBet(state, action: PayloadAction<BetItem>) {
      const existing = state.bets.find(
        (bet) => bet.chip === action.payload.chip
      );

      if (existing) {
        existing.qty += action.payload.qty;
        existing.amt += action.payload.amt;
      } else {
        state.bets.push(action.payload);
      }
    },

    removeBet(state, action: PayloadAction<string>) {
      state.bets = state.bets.filter(
        (bet) => bet.id !== action.payload
      );
    },

    undoLastBet(state) {
      state.bets.pop();
    },

    clearBets(state) {
      state.bets = [];
    },
  },
});

export const {
  addBet,
  removeBet,
  undoLastBet,
  clearBets,
} = betSlipSlice.actions;

export default betSlipSlice.reducer;