"use client";
import React from "react";

const Confirm = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-lg max-w-md">
        <h2 className="text-lg mb-4">{message}</h2>
        <div className="flex justify-around">
          <button
            onClick={onConfirm}
            className="bg-green-400 text-white py-2 px-5 rounded-md hover:bg-green-500"
          >
            Có
          </button>
          <button
            onClick={onCancel}
            className="bg-red-400 text-white py-2 px-4 rounded-md hover:bg-red-500"
          >
            Không
          </button>
        </div>
      </div>
    </div>
  );
};

export default Confirm;
