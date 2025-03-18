"use client";
import { useEffect } from "react";
import { FaExclamationTriangle, FaTimesCircle } from "react-icons/fa";

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 mb-4 bg-white rounded-lg shadow-lg z-50`}
    >
      <div className="flex items-center">
        <span className="mr-2">
          {type === "success" && "✅"}
          {type === "error" && <FaTimesCircle className="text-red-600" />}
          {type === "warning" && (
            <FaExclamationTriangle className="text-yellow-600" />
          )}
        </span>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Notification;
