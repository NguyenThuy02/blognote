"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase2 } from "../../../lib/supabase";
import ThemeSettings from "../../components/ThemeSettings";

export default function NotePage() {
  const [note, setNote] = useState("");
  const [title, setTitle] = useState("");
  const [noteType, setNoteType] = useState("rich");
  const [suggestions, setSuggestions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedNotes, setSavedNotes] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [classification, setClassification] = useState("Tất cả");
  const [filteredNotes, setFilteredNotes] = useState([]);
  const classifications = ["Tất cả", "Công việc", "Cá nhân", "Học tập", "Khác"];

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const { data, error } = await supabase2.from("notess").select("*");
        if (error) {
          console.error("Lỗi khi lấy ghi chú từ Supabase:", error.message);
        } else {
          setSavedNotes(data || []);
          setFilteredNotes(data || []);
        }
      } catch (error) {
        console.error("Lỗi không mong muốn khi fetch notes:", error.message);
      }
    };
    fetchNotes();
  }, []);

  useEffect(() => {
    const results = savedNotes.filter(
      (note) =>
        (classification === "Tất cả" || note.classification === classification) &&
        note.title.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredNotes(results);
  }, [search, classification, savedNotes]);

  const saveNote = async (content, title, type) => {
    try {
      const { data, error } = await supabase2
        .from("notess")
        .insert({
          title: title || "Ghi chú không tiêu đề",
          content,
          created_at: new Date().toISOString(),
          note_type: type,
          classification: classification === "Tất cả" ? "Khác" : classification,
        })
        .select();

      if (error) {
        console.error("Lỗi khi lưu ghi chú:", error.message);
      } else {
        if (data && data.length > 0) {
          setSavedNotes((prev) => [...prev, { ...data[0], content }]);
          alert("Ghi chú đã được lưu!");
        }
      }
    } catch (error) {
      console.error("Lỗi không mong muốn khi lưu ghi chú:", error.message);
    }
  };

  const generateSuggestions = async (input) => {
    try {
      const response = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: input }),
      });

      if (!response.ok) throw new Error("Lỗi từ API.");
      return await response.json();
    } catch (error) {
      throw new Error(`Không thể tạo gợi ý: ${error.message}`);
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
      const newSuggestions = await generateSuggestions(note);
      setSuggestions(newSuggestions);
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

  const handleNoteClick = (noteItem) => {
    setTitle(noteItem.title);
    setNote(noteItem.content);
    setNoteType(noteItem.note_type);
    setClassification(noteItem.classification);
  };

  const handleSuggestionClick = (type, value) => {
    if (type === "title") {
      setTitle(value);
    } else if (type === "idea" || type === "expanded" || type === "tip") {
      setNote(value);
    }
  };

  return (
    <div
      className="mt-[76px] p-5 mb-[-7px] min-h-screen"
      style={{ background: "var(--background)", color: "var(--text-color)" }}
    >
      <div className="container mx-auto w-full">
        <div
          className="rounded-3xl shadow-2xl p-8 transform transition-all duration-300"
          style={{
            background: "var(--background)",
            border: "1px solid var(--border-color)",
          }}
        >
          <h1
            className="text-4xl font-extrabold text-center mb-8"
            style={{ color: "var(--accent-color)" }}
          >
            BlogNote - Ghi Chú Thông Minh
          </h1>

          {/* Header Link */}
          <div className="flex justify-end mb-6">
            <Link
              href="/manage_note"
              className="inline-flex items-center px-4 py-2 font-medium rounded-lg transition-all duration-200"
              style={{
                color: "var(--accent-color)",
                background: "var(--background)",
                border: "1px solid var(--border-color)",
              }}
            >
              <span>Xem danh sách ghi chú</span>
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {/* Note Input Section */}
          <div className="space-y-4 mb-8">
            <input
              type="text"
              className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
              placeholder="Tiêu đề ghi chú..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                background: "var(--background)",
                color: "var(--text-color)",
                border: "1px solid var(--border-color)",
                focusRingColor: "var(--accent-color)",
              }}
            />
            <textarea
              className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 resize-y transition-all duration-200"
              rows="6"
              placeholder="Viết ghi chú của bạn..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                background: "var(--background)",
                color: "var(--text-color)",
                border: "1px solid var(--border-color)",
                focusRingColor: "var(--accent-color)",
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <button
              className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md ${
                isLoading ? "cursor-not-allowed" : ""
              }`}
              onClick={handleGenerate}
              disabled={isLoading}
              style={{
                background: isLoading ? "#9CA3AF" : "var(--accent-color)",
                color: "var(--background)",
                border: "1px solid var(--border-color)",
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    viewBox="0 0 24 24"
                    style={{ color: "var(--background)" }}
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
                </div>
              ) : (
                "Tạo Gợi Ý AI"
              )}
            </button>
            <button
              className="flex-1 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md"
              onClick={handleSave}
              style={{
                background: "var(--accent-color)",
                color: "var(--background)",
                border: "1px solid var(--border-color)",
              }}
            >
              Lưu Ghi Chú
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mb-8 p-4 rounded-xl shadow-md transition-all duration-200"
              style={{
                background: "#FEF2F2",
                color: "#DC2626",
                border: "1px solid var(--border-color)",
              }}
            >
              {error}
            </div>
          )}

          {/* Suggestions Section */}
          {suggestions && (
            <div className="grid gap-6 mb-8">
              <div
                className="p-6 rounded-xl shadow-md transition-all duration-200"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <h2
                  className="text-xl font-semibold mb-4"
                  style={{ color: "var(--text-color)" }}
                >
                  Tiêu đề gợi ý
                </h2>
                <ul className="space-y-2">
                  {suggestions.titles.map((title, index) => (
                    <li
                      key={index}
                      className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                      onClick={() => handleSuggestionClick("title", title)}
                      style={{
                        background: "var(--background)",
                        color: "var(--text-color)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      {title}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="p-6 rounded-xl shadow-md transition-all duration-200"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <h2
                  className="text-xl font-semibold mb-4"
                  style={{ color: "var(--text-color)" }}
                >
                  Ý tưởng phát triển
                </h2>
                <ul className="space-y-2">
                  {suggestions.ideas.map((idea, index) => (
                    <li
                      key={index}
                      className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                      onClick={() => handleSuggestionClick("idea", idea)}
                      style={{
                        background: "var(--background)",
                        color: "var(--text-color)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      {idea}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="p-6 rounded-xl shadow-md transition-all duration-200"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <h2
                  className="text-xl font-semibold mb-4"
                  style={{ color: "var(--text-color)" }}
                >
                  Mở rộng bài viết
                </h2>
                <p
                  className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                  onClick={() =>
                    handleSuggestionClick("expanded", suggestions.expanded)
                  }
                  style={{
                    background: "var(--background)",
                    color: "var(--text-color)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  {suggestions.expanded}
                </p>
              </div>
              <div
                className="p-6 rounded-xl shadow-md transition-all duration-200"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <h2
                  className="text-xl font-semibold mb-4"
                  style={{ color: "var(--text-color)" }}
                >
                  Mẹo ghi chú hiệu quả
                </h2>
                <ul className="space-y-2">
                  {suggestions.tips.map((tip, index) => (
                    <li
                      key={index}
                      className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                      onClick={() => handleSuggestionClick("tip", tip)}
                      style={{
                        background: "var(--background)",
                        color: "var(--text-color)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Search Section */}
          <div className="mb-8">
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: "var(--text-color)" }}
            >
              Tìm Kiếm Ghi Chú
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Nhập từ khóa..."
                className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: "var(--background)",
                  color: "var(--text-color)",
                  border: "1px solid var(--border-color)",
                  focusRingColor: "var(--accent-color)",
                }}
              />
              <select
                className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                style={{
                  background: "var(--background)",
                  color: "var(--text-color)",
                  border: "1px solid var(--border-color)",
                  focusRingColor: "var(--accent-color)",
                }}
              >
                {classifications.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
            <div
              className="mt-4 p-6 rounded-xl shadow-md"
              style={{
                background: "var(--background)",
                border: "1px solid var(--border-color)",
              }}
            >
              {search ? (
                <div>
                  <p
                    className="mb-4"
                    style={{ color: "var(--text-color)" }}
                  >
                    Kết quả tìm kiếm: <strong>{search}</strong> (Phân loại:{" "}
                    <strong>{classification}</strong>)
                  </p>
                  {filteredNotes.length > 0 ? (
                    <ul className="space-y-2">
                      {filteredNotes.map((note) => (
                        <li
                          key={note.id}
                          className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                          onClick={() => handleNoteClick(note)}
                          style={{
                            background: "var(--background)",
                            color: "var(--text-color)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {note.title}{" "}
                          <span style={{ color: "#9CA3AF" }}>
                            ({note.classification})
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: "var(--text-color)" }}>
                      Không tìm thấy ghi chú nào.
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ color: "var(--text-color)" }}>
                  Nhập từ khóa để tìm kiếm...
                </p>
              )}
            </div>
          </div>

          {/* Saved Notes Section */}
          {savedNotes.length > 0 && (
            <div
              className="p-6 rounded-xl shadow-md"
              style={{
                background: "var(--background)",
                border: "1px solid var(--border-color)",
              }}
            >
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: "var(--text-color)" }}
              >
                Ghi Chú Đã Lưu
              </h2>
              <ul className="space-y-2">
                {savedNotes.map((noteItem) => (
                  <li
                    key={noteItem.id}
                    className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                    onClick={() => handleNoteClick(noteItem)}
                    style={{
                      background: "var(--background)",
                      color: "var(--text-color)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <div className="flex justify-between">
                      <span>{noteItem.title}</span>
                      <span style={{ color: "#9CA3AF" }}>
                        {new Date(noteItem.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-color)" }}
                    >
                      {noteItem.classification}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <ThemeSettings />
    </div>
  );
}