"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase2 } from "../../../lib/supabase";

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

  return (
    <div className="mt-[97px] p-5 mb-[-7px] min-h-screen bg-gradient-to-br to-gray-100 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-4xl transform transition-all duration-300 hover:shadow-xl">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse">
          BlogNote - Gợi ý ghi chú
        </h1>
        <div className="flex justify-end mb-6">
          <Link href="/manage_note" className="text-blue-500 hover:text-purple-500 transition-colors duration-200 font-medium hover:shadow-md p-2 rounded-lg">
            Xem danh sách ghi chú →
          </Link>
        </div>

        <input
          type="text"
          className="w-full p-4 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm transition-all duration-200 hover:shadow-lg"
          placeholder="Nhập tiêu đề ghi chú..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full p-4 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-y shadow-sm transition-all duration-200 hover:shadow-lg"
          rows="6"
          placeholder="Viết ghi chú của bạn tại đây..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex gap-4 mb-6">
          <button
            className={`flex-1 py-3 rounded-lg text-white font-semibold transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-300 to-purple-300 hover:from-blue-400 hover:to-purple-400"
            }`}
            onClick={handleGenerate}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                </svg>
                Đang tạo gợi ý...
              </>
            ) : (
              "Gợi ý từ AI"
            )}
          </button>
          <button
            className="flex-1 py-3 bg-gradient-to-r from-blue-300 to-purple-300 text-white rounded-lg hover:from-blue-400 hover:to-purple-400 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={handleSave}
          >
            Lưu Ghi Chú
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg animate-slide-in shadow-md hover:shadow-lg transition-all duration-200">
            {error}
          </div>
        )}

        {suggestions && (
          <div className="mt-8 space-y-8 animate-fade-in">
            <div className="p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <h2 className="text-2xl font-semibold text-gray-700 mb-3">Tiêu đề gợi ý:</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                {suggestions.titles.map((title, index) => (
                  <li key={index} className="hover:text-blue-500 transition-colors duration-200">{title}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <h2 className="text-2xl font-semibold text-gray-700 mb-3">Ý tưởng phát triển:</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                {suggestions.ideas.map((idea, index) => (
                  <li key={index} className="hover:text-purple-500 transition-colors duration-200">{idea}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <h2 className="text-2xl font-semibold text-gray-700 mb-3">Mở rộng bài viết:</h2>
              <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg">{suggestions.expanded}</p>
            </div>
            <div className="p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <h2 className="text-2xl font-semibold text-gray-700 mb-3">Mẹo ghi chú hiệu quả:</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                {suggestions.tips.map((tip, index) => (
                  <li key={index} className="hover:text-blue-500 transition-colors duration-200">{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-8 text-gray-700">
          <h1 className="text-3xl font-bold mb-4 animate-slide-in">🔍 Tìm kiếm Ghi Chú</h1>
          <input
            type="text"
            placeholder="Nhập từ khóa..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm transition-all duration-200 hover:shadow-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="w-full px-4 py-3 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm transition-all duration-200 hover:shadow-lg"
            value={classification}
            onChange={(e) => setClassification(e.target.value)}
          >
            {classifications.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <div className="mt-4 p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
            {search ? (
              <div className="animate-fade-in">
                <p className="mb-2">
                  🔎 Kết quả tìm kiếm cho: <strong>{search}</strong> trong phân loại: <strong>{classification}</strong>
                </p>
                {filteredNotes.length > 0 ? (
                  <ul className="list-disc pl-6 space-y-2">
                    {filteredNotes.map((note) => (
                      <li
                        key={note.id}
                        className="py-1 cursor-pointer hover:text-blue-500 transition-colors duration-200 hover:shadow-md rounded-lg p-2"
                        onClick={() => handleNoteClick(note)}
                      >
                        {note.title} (Phân loại: {note.classification})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">Không tìm thấy ghi chú nào.</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Nhập từ khóa để tìm...</p>
            )}
          </div>
        </div>

        {savedNotes.length > 0 && (
          <div className="mt-8 animate-fade-in p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
            <h2 className="text-2xl font-semibold text-gray-700 mb-3">Ghi chú đã lưu:</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              {savedNotes.map((noteItem) => (
                <li
                  key={noteItem.id}
                  className="cursor-pointer hover:text-purple-500 transition-colors duration-200 hover:shadow-md rounded-lg p-2"
                  onClick={() => handleNoteClick(noteItem)}
                >
                  {noteItem.title}: {noteItem.content} (Phân loại: {noteItem.classification}, Ngày: {new Date(noteItem.created_at).toLocaleDateString()})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}