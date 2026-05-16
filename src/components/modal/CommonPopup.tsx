import  { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { RootState } from "../../store";
import { hidePopup } from "../../store/slices/popupSlice";

import styles from "./CommonPopup.module.css";

const CommonPopup = () => {
  const dispatch = useDispatch();

  const { open, message, type } = useSelector(
    (state: RootState) => state.popUpModal
  );

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      dispatch(hidePopup());
    }, 3000);

    return () => clearTimeout(timer);
  }, [open, dispatch]);

  if (!open) return null;

  return (
    <div
      className={`${styles.popup} ${
        type === "success"
          ? styles.success
          : type === "error"
          ? styles.error
          : styles.info
      }`}
    >
      {message}
    </div>
  );
};

export default CommonPopup;