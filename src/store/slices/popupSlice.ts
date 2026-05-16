import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface PopupState {
  open: boolean;
  type: "success" | "error" | "info";
  message: string;
}

const initialState: PopupState = {
  open: false,
  type: "success",
  message: "",
};

const popupSlice = createSlice({
  name: "popup",
  initialState,

  reducers: {
    showPopup: (
      state,
      action: PayloadAction<{
        type?: "success" | "error" | "info";
        message: string;
      }>
    ) => {
      state.open = true;
      state.type = action.payload.type || "success";
      state.message = action.payload.message;
    },

    hidePopup: (state) => {
      state.open = false;
      state.message = "";
    },
  },
});

export const { showPopup, hidePopup } = popupSlice.actions;

export default popupSlice.reducer;