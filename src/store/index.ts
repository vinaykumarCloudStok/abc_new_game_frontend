import { configureStore } from '@reduxjs/toolkit';
import socketReducer from './slices/socketSlice';
import betSlipSlice from "./slices/betSlipSlice";
import popUpSlice from './slices/popupSlice'
export const store = configureStore({
  reducer: {
    socketSlice: socketReducer,
     betSlip: betSlipSlice,
     popUpModal:popUpSlice
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
