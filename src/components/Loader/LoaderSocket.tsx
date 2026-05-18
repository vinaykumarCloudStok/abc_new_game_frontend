import { useEffect, useState } from "react";
import "../Loader/Loader.css";
import logo from "../../assets/screen.png"; 

const LoaderSocket = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 1;
      });
    }, 40); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="socket-loader">
      <div className="loader-content">
        <img src={logo} alt="game logo" className="loader-logo" />
        <div className="loading-bar">
          <div
            className="loading-progress"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="loading-text">{progress}%</p>
      </div>
    </div>
  );
};

export default LoaderSocket;
