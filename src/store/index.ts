import { configureStore } from '@reduxjs/toolkit';
import socketReducer from './slices/socketSlice';

export const store = configureStore({
  reducer: {
    socketSlice: socketReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
