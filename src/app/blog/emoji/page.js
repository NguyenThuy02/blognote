"use client";

import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

export default function Emoji({ onSelect = () => {} }) {
  const [show, setShow] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShow(false);
      }
    }

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show]);

  return (
    <div className="mt-70 relative inline-block" ref={pickerRef}>
      <button
        type="button"
        className="text-xl transition-transform duration-150 hover:scale-115"
        onClick={() => setShow((prev) => !prev)}
      >
        😄
      </button>

      {show && (
        <div className="absolute z-50 mt-2 right-0">
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              onSelect(emojiData.emoji);
              // Không đóng sau khi chọn emoji
            }}
            height={350}
            width={300}
          />
        </div>
      )}
    </div>
  );
}
