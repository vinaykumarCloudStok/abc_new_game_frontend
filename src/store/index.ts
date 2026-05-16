import { configureStore } from '@reduxjs/toolkit';
import socketReducer from './slices/socketSlice';
import betSlipSlice from "./slices/betSlipSlice";
export const store = configureStore({
  reducer: {
    socketSlice: socketReducer,
     betSlip: betSlipSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
