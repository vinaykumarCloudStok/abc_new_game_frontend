import React from "react";
import styles from "./InfoCard.module.css";
import { toggleRulesModal } from "../../store/slices/socketSlice";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { BiInfoCircle } from "react-icons/bi";

const InfoCard: React.FC = () => {
  const dispatch = useAppDispatch();

  const latestResult = useAppSelector(
    (state) => state.socketSlice.latestResult
  );

  const digits = latestResult
    ? Object.values(latestResult.result)
    : [];

  return (
    <section className={styles.card}>
      <div className={styles.glow} />

      <div className={styles.resultWrapper}>
        <p className={styles.label}>Draw Result</p>

        <div className={styles.flexRoundId}>
           <p className={styles.lobbyIdText}>
          Lobby Id:
        </p>
          <p className={styles.lobbyId}>
          {latestResult?.lobby_uuid?.slice(0,25)}
        </p>
        </div>

        <div className={styles.digits}>
          {digits.map((digit, index) => (
            <div
              key={index}
              className={styles.digitBall}
              style={{
                animationDelay: `${index * 0.2}s`,
              }}
            >
              {digit}
            </div>
          ))}
        </div>
      </div>

      <button
        className={styles.helpBtn}
        onClick={() => dispatch(toggleRulesModal())}
      >
        <BiInfoCircle className="icons" />
      </button>
    </section>
  );
};

export default InfoCard;