"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase2 } from "./../../lib/supabase";
import { supabase } from "./../../lib/supabase";

// Helper function to validate URL
const isValidUrl = (url) => {
  try {
    new URL(url); // Check if it's a valid absolute URL
    return true;
  } catch {
    return url && typeof url === "string" && url.startsWith("/"); // Allow relative paths starting with "/"
  }
};

export default function Home() {
  const [notes, setNotes] = useState([]);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(null);

  // Hàm lấy ghi chú phong phú từ Supabase
  const fetchNotes = async () => {
    const userData = localStorage.getItem("user");
    let user_id = null;
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        user_id = parsedUser.id;
      } catch (err) {
        setError("Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.");
        return;
      }
    } else {
      setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập.");
      return;
    }

    try {
      const { data, error } = await supabase2
        .from("notess")
        .select("id, user_id, title, content, image_url, created_at, updated_at, is_pinned, audio_url, audio_file_name, video_url, video_file_name, spreadsheet_data, note_type")
        .eq("user_id", user_id)
        .eq("note_type", "rich")
        .not("image_url", "is", null)
        .order("updated_at", { ascending: false })
        .limit(3);

      if (error) throw new Error(`Lỗi Supabase (notess): ${error.message}`);

      const parsedNotes = data.map((note) => ({
        ...note,
        spreadsheet_data: note.note_type === "spreadsheet" && note.spreadsheet_data ? JSON.parse(note.spreadsheet_data) : Array(10).fill().map(() => Array(10).fill("")),
        isPinned: note.is_pinned || false,
        audio_url: note.audio_url || "",
        audio_file_name: note.audio_file_name || "",
        video_url: note.video_url || "",
        video_file_name: note.video_file_name || "",
        image_url: note.image_url && isValidUrl(note.image_url) ? note.image_url : "/note_image.svg", // Validate and fallback
      })) || [];

      setNotes(parsedNotes);
    } catch (err) {
      setError("Không thể tải ghi chú: " + err.message);
    }
  };

  // Hàm lấy bài viết từ Supabase
  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, content, topics, tags, name, images, videos, files, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw new Error(`Lỗi Supabase (posts): ${error.message}`);

      const parsedArticles = data.map((article) => ({
        ...article,
        image_url: article.images && article.images.length > 0 && isValidUrl(article.images[0]) ? article.images[0] : "/note_image.svg", // Validate and fallback
      })) || [];

      setArticles(parsedArticles);
    } catch (err) {
      setError("Không thể tải bài viết: " + err.message);
    }
  };

  // Effect để lấy dữ liệu khi component mount
  useEffect(() => {
    fetchNotes();
    fetchArticles();
  }, []);

  return (
    <div className="mt-[97px] min-h-screen flex bg-gray-100">
      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold font-montserrat text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-400">
            Smart Notes Dashboard
          </h1>
          {/* Search Bar */}
          <div className="relative w-1/2">
            <input
              type="text"
              placeholder="Tìm ghi chú của bạn..."
              className="border border-gray-300 rounded-full px-4 py-2 pr-10 focus:outline-none focus:border-blue-400 focus:ring focus:ring-blue-300 transition duration-200 w-full shadow-md"
            />
            <button className="absolute right-0 top-0 mt-2 mr-2 bg-gradient-to-r from-blue-500 to-purple-400 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gradient-to-l transition duration-200">
              🔍
            </button>
          </div>
        </div>

        {/* Introduction Section */}
        <div className="p-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Chào mừng bạn đến với BlogNote
          </h2>
          <p className="text-gray-600 mt-2">
            Người bạn thông minh của bạn trong việc quản lý ghi chú. Tổ chức,
            tìm kiếm và tạo ghi chú một cách dễ dàng. Tăng cường năng suất của
            bạn với các công cụ thân thiện với người dùng được thiết kế cho việc
            học tập tối ưu.
          </p>
        </div>

        {/* Courses Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Article Card */}
          {articles.length > 0 ? (
            articles.map((article) => (
              <div
                key={article.id}
                className="bg-white p-4 rounded-lg shadow transition-transform duration-200 hover:shadow-xl hover:-translate-y-1 min-h-[270px]"
              >
                <div className="w-full h-[150px] overflow-hidden rounded-md">
                  <Image
                    src={article.image_url && isValidUrl(article.image_url) ? article.image_url : "/note_image.svg"}
                    alt={article.title}
                    width={150}
                    height={150}
                    className="object-cover w-full h-full"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mt-2">
                  {article.title}
                </h3>
                <p className="text-gray-600">
                  {article.content && article.content.length > 50
                    ? article.content.substring(0, 50) + "..."
                    : article.content || ""}
                </p>
                <p className="mt-2 font-semibold">
                  Được tạo bởi: {article.name || "Không rõ"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Không có bài viết nào để hiển thị.</p>
          )}
        </div>

        {/* Notes Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {/* Note Card */}
          {notes.length > 0 ? (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-white p-4 rounded-lg shadow transition-transform duration-200 hover:shadow-xl hover:-translate-y-1 min-h-[270px]"
              >
                <div className="w-full h-[150px] overflow-hidden rounded-md">
                  <Image
                    src={note.image_url && isValidUrl(note.image_url) ? note.image_url : "/note_image.svg"}
                    alt={note.title}
                    width={150}
                    height={150}
                    className="object-cover w-full h-full"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mt-2">
                  {note.title}
                </h3>
                <p className="text-gray-600">
                  {note.content && note.content.length > 50
                    ? note.content.substring(0, 50) + "..."
                    : note.content || ""}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Không có ghi chú nào để hiển thị.</p>
          )}
        </div>

        {/* New Section at the Bottom */}
        <div className="bg-white p-4 rounded-lg shadow mt-10 transition-transform duration-200 hover:shadow-xl">
          <h2 className="text-lg font-bold text-gray-800">Tùy Chọn</h2>
          <ul className="mt-4">
            <li className="flex justify-between items-center py-2 border-b border-gray-200 transition duration-200 hover:bg-blue-50 hover:text-blue-600">
              <span className="text-gray-700">Bài viết</span>
              <span className="text-gray-500">›</span>
            </li>
            <li className="flex justify-between items-center py-2 border-b border-gray-200 transition duration-200 hover:bg-blue-50 hover:text-blue-600">
              <span className="text-gray-700">Ghi chú</span>
              <span className="text-gray-500">›</span>
            </li>
            <li className="flex justify-between items-center py-2 transition duration-200 hover:bg-blue-50 hover:text-blue-600">
              <span className="text-gray-700">Thống kê</span>
              <span className="text-gray-500">›</span>
            </li>
          </ul>
        </div>

        {/* Calendar Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-800">Sự Kiện Sắp Đến</h2>
          <div className="bg-white p-4 rounded-lg shadow mt-4">
            <p className="text-gray-500">[Thành Phần Lịch Ở Đây]</p>
          </div>
        </div>

        {/* Hiển thị lỗi nếu có */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}