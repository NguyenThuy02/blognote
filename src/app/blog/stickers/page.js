"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Sticker({ onSelect }) {
  const [stickerGroups, setStickerGroups] = useState({});
  const [showStickers, setShowStickers] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Tải danh sách sticker
  useEffect(() => {
    fetch("/cache/sticker_urls.json")
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải file sticker_urls.json");
        return res.json();
      })
      .then((data) => {
        const groupedStickers = data.reduce((groups, stickerUrl) => {
          const groupName = stickerUrl.split("/")[9] || "unknown";
          if (!groups[groupName]) {
            groups[groupName] = [];
          }
          groups[groupName].push(stickerUrl);
          return groups;
        }, {});

        const sortedGroups = Object.keys(groupedStickers)
          .sort()
          .reduce((sorted, groupName) => {
            sorted[groupName] = groupedStickers[groupName];
            return sorted;
          }, {});

        setStickerGroups(sortedGroups);
      })
      .catch((err) => {
        console.error("Lỗi tải sticker:", err);
        setError("Không thể tải danh sách sticker.");
      });
  }, []);

  // Lọc các nhóm sticker dựa trên từ khóa tìm kiếm
  const filteredGroups = Object.keys(stickerGroups).filter((groupName) =>
    groupName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Xử lý khi chọn sticker
  const handleStickerSelect = (url) => {
    onSelect(url);
  };

  return (
    <div className="mt-70 max-w-[255px] mx-auto p-6 space-y-4 relative">
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => setShowStickers(!showStickers)}
          className="text-xl hover:scale-110 transition-transform"
        >
          🧸
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {showStickers && (
        <div
          className="absolute z-50 top-10 -left-64 p-2 border border-gray-200 rounded bg-gray-50 max-h-60 overflow-y-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            width: "250px",
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none; /* Ẩn thanh cuộn trên Chrome/Safari */
            }
          `}</style>
          <div className="mb-3 relative">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-md focus:outline-none hover:border-blue-300 focus:border-purple-400 text-xs"
            />
            <svg
              className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 28 28"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {filteredGroups.length === 0 ? (
            <p className="text-xs text-gray-700">Không tìm thấy.</p>
          ) : (
            filteredGroups.map((groupName) => (
              <div
                key={groupName}
                className="mt-4 p-3 bg-gray-100 rounded-md shadow-sm"
              >
                <h3 className="text-xs font-bold text-purple-400 capitalize">
                  {groupName}
                </h3>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {stickerGroups[groupName].map((url, idx) => (
                    <div
                      key={idx}
                      className="relative w-8 h-8 cursor-pointer hover:scale-110 transition-transform overflow-hidden bg-transparent"
                      onClick={() => handleStickerSelect(url)}
                    >
                      <Image
                        src={url}
                        alt={`sticker-${groupName}-${idx}`}
                        width={32}
                        height={32}
                        style={{ objectFit: "fill" }}
                        className="rounded-sm"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}