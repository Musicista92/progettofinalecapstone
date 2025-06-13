import React from "react";
import { Spinner } from "react-bootstrap";

const LoadingSpinner = ({
  size = "lg",
  text = "Caricamento...",
  centered = true,
}) => {
  const spinnerClass = centered
    ? "loading-spinner"
    : "d-flex align-items-center";

  return (
    <div className={spinnerClass}>
      <div className="text-center">
        <Spinner
          animation="border"
          role="status"
          size={size}
          className="mb-2"
        />
        {text && <div className="text-muted">{text}</div>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
