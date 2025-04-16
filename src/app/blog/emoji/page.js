"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

export default function Emoji({ onSelect = () => {} }) {
  const [show, setShow] = useState(false);

  return (
    <div className="mt-70 relative inline-block">
      <button
        type="button"
        className="text-xl"
        onClick={() => setShow((prev) => !prev)}
      >
        😄
      </button>

      {show && (
        <div className="absolute z-50 mt-2 right-0">
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              onSelect(emojiData.emoji);
              setShow(false);
            }}
            height={350}
            width={300}
          />
        </div>
      )}
    </div>
  );
}