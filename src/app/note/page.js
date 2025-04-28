"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase2 } from "./../../lib/supabase";

export default function NotePage() {
  const [note, setNote] = useState("");
  const [title, setTitle] = useState("");
  const [noteType, setNoteType] = useState("plain");
  const [suggestions, setSuggestions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedNotes, setSavedNotes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const { data, error } = await supabase2.from("notes").select("*");
        if (error) {
          console.error("Lỗi khi lấy ghi chú từ Supabase:", error.message);
        } else {
          console.log("Danh sách ghi chú từ Supabase:", data);
          setSavedNotes(data || []);
        }
      } catch (error) {
        console.error("Lỗi không mong muốn khi fetch notes:", error.message);
      }
    };
    fetchNotes();
  }, []);

  const saveNote = async (content, title, type) => {
    try {
      const { data, error } = await supabase2.from("notes").insert({
        title: title || "Ghi chú không tiêu đề",
        content,
        created_at: new Date().toISOString(),
        note_type: type,
      });
      if (error) {
        console.error("Lỗi khi lưu ghi chú:", error.message);
      } else {
        console.log("Ghi chú đã lưu thành công:", data);
        setSavedNotes((prev) => [
          ...prev,
          {
            id: data[0].id,
            title: data[0].title,
            content,
            created_at: data[0].created_at,
            note_type: type,
          },
        ]);
        alert("Ghi chú đã được lưu!");
      }
    } catch (error) {
      console.error("Lỗi không mong muốn khi lưu ghi chú:", error.message);
    }
  };

  const generateSuggestions = async (input) => {
    try {
      console.log("Bắt đầu gọi API /api/ai-suggestions với note:", input);
      const response = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: input }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Lỗi từ /api/ai-suggestions:", response.status, errorData);
        throw new Error(errorData.error || "Lỗi không xác định từ API.");
      }

      const data = await response.json();
      console.log("Phản hồi từ /api/ai-suggestions:", data);
      return data;
    } catch (error) {
      console.error("Lỗi chi tiết trong generateSuggestions:", error.message);
      throw error;
    }
  };

  const handleGenerate = async () => {
    if (!note.trim()) {
      setError("Vui lòng nhập ghi chú trước khi tạo gợi ý!");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      console.log("Bắt đầu tạo gợi ý với note:", note);
      const newSuggestions = await generateSuggestions(note);
      console.log("Gợi ý nhận được:", newSuggestions);
      setSuggestions(newSuggestions);
      console.log("State suggestions sau khi set:", newSuggestions);
    } catch (error) {
      setError(error.message);
      setSuggestions(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (note.trim()) {
      saveNote(note, title, noteType);
    } else {
      alert("Vui lòng nhập ghi chú trước khi lưu!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          BlogNote - Tạo Ghi Chú 
        </h1>
        <div className="flex justify-end mb-4">
          <Link href="/note/list" className="text-blue-500 hover:underline">
            Xem danh sách ghi chú →
          </Link>
        </div>
        <input
          type="text"
          className="w-full p-4 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          placeholder="Nhập tiêu đề ghi chú..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="w-full p-4 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          value={noteType}
          onChange={(e) => setNoteType(e.target.value)}
        >
          <option value="plain">Ghi chú văn bản thuần</option>
          <option value="rich">Ghi chú văn bản phong phú</option>
          <option value="whiteboard">Ghi chú danh sách công việc</option>
          <option value="spreadsheet">Ghi chú bảng tính</option>
        </select>
        <textarea
          className="w-full p-4 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-gray-700"
          rows="6"
          placeholder="Viết ghi chú của bạn tại đây..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex gap-4 mb-4">
          <button
            className={`flex-1 py-3 rounded-md text-white font-semibold transition-all flex items-center justify-center ${
              isLoading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            onClick={handleGenerate}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                  />
                </svg>
                Đang tạo gợi ý...
              </>
            ) : (
              "Gợi ý từ AI"
            )}
          </button>
          <button
            className="flex-1 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
            onClick={handleSave}
          >
            Lưu Ghi Chú
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {suggestions ? (
          <div className="mt-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Tiêu đề gợi ý:
              </h2>
              <ul className="list-disc pl-6 text-gray-600">
                {suggestions.titles.map((title, index) => (
                  <li key={index} className="mb-1">
                    {title}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Ý tưởng phát triển:
              </h2>
              <ul className="list-disc pl-6 text-gray-600">
                {suggestions.ideas.map((idea, index) => (
                  <li key={index} className="mb-1">
                    {idea}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Mở rộng bài viết:
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {suggestions.expanded}
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Mẹo ghi chú hiệu quả:
              </h2>
              <ul className="list-disc pl-6 text-gray-600">
                {suggestions.tips.map((tip, index) => (
                  <li key={index} className="mb-1">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          suggestions !== null && (
            <p className="mt-4 text-gray-500">Không có gợi ý để hiển thị.</p>
          )
        )}

        {savedNotes.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Ghi chú đã lưu:
            </h2>
            <ul className="list-disc pl-6 text-gray-600">
              {savedNotes.map((noteItem, index) => (
                <li key={index} className="mb-1">
                  {noteItem.title}: {noteItem.content} (Loại: {noteItem.note_type}, Ngày: {new Date(noteItem.created_at).toLocaleDateString()})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}