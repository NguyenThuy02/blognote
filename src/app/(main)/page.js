"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase2 } from "./../../lib/supabase";
import { useRouter } from "next/navigation";

const ThemeSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [borderButtonColor, setBorderButtonColor] = useState("linear-gradient(to right, #6B46C1, #A3BFFA)");
  const [borderColor, setBorderColor] = useState("#A3BFFA");

  const backgroundColors = {
    white: "#FFFFFF",
    lightBlue: "#E6F0FA",
    lightGreen: "#F0F7F4",
    lightYellow: "#FFF7ED",
  };

  const borderButtonColors = {
    purpleBlue: "linear-gradient(to right, #6B46C1, #A3BFFA)",
    greenYellow: "linear-gradient(to right, #A7F3D0, #FEF9C3)",
    pinkWhite: "linear-gradient(to right, #FBCFE8, #FFFFFF)",
    pinkYellow: "linear-gradient(to right, #FBCFE8, #FEF9C3)",
    bluePink: "linear-gradient(to right, #C4E4FF, #FBCFE8)",
    grayWhite: "linear-gradient(to right, #E5E7EB, #FFFFFF)",
    orangeRed: "linear-gradient(to right, #F97316, #EF4444)",
    tealPurple: "linear-gradient(to right, #14B8A6, #A855F7)",
    blueGreen: "linear-gradient(to right, #3B82F6, #10B981)",
    purplePink: "linear-gradient(to right, #9333EA, #F472B6)",
  };

  const borderColors = {
    blue: "#A3BFFA",
    green: "#A7F3D0",
    pink: "#FBCFE8",
    yellow: "#FEF9C3",
    gray: "#E5E7EB",
  };

  useEffect(() => {
    const root = document.documentElement;
    const bgColor = isDarkMode ? "#1A202C" : backgroundColor;
    const textColor = isDarkMode ? "#F7FAFC" : "#000000";

    root.style.setProperty("--background", bgColor);
    root.style.setProperty("--text-color", textColor);
    root.style.setProperty("--accent-color", borderButtonColor);
    root.style.setProperty("--border-color", borderColor);
  }, [isDarkMode, backgroundColor, borderButtonColor, borderColor]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleBackgroundColorChange = (color) => {
    setBackgroundColor(color);
  };

  const handleBorderButtonColorChange = (color) => {
    setBorderButtonColor(color);
  };

  const handleBorderColorChange = (color) => {
    setBorderColor(color);
  };

  const handleCustomBackgroundColor = (e) => {
    setBackgroundColor(e.target.value);
  };

  const handleCustomBorderButtonColor = (e) => {
    setBorderButtonColor(e.target.value);
  };

  const handleCustomBorderColor = (e) => {
    setBorderColor(e.target.value);
  };

  return (
    <div className="theme-settings">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="palette-btn"
        title="Theme Settings"
      >
        🎨
      </button>

      <button
        onClick={toggleDarkMode}
        className="toggle-btn"
        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDarkMode ? "🌙" : "☀️"}
      </button>

      {isOpen && (
        <div className="theme-form">
          <h3 className="form-title">Tùy chỉnh giao diện</h3>

          <div className="predefined-colors">
            <h4>Màu nền</h4>
            <div className="color-options">
              {Object.entries(backgroundColors).map(([key, value]) => (
                <div
                  key={key}
                  className={`color-option ${backgroundColor === value ? "active" : ""}`}
                  style={{ backgroundColor: value }}
                  onClick={() => handleBackgroundColorChange(value)}
                />
              ))}
            </div>
          </div>

          <div className="predefined-colors">
            <h4>Màu nút</h4>
            <div className="color-options">
              {Object.entries(borderButtonColors).map(([key, value]) => (
                <div
                  key={key}
                  className={`color-option ${borderButtonColor === value ? "active" : ""}`}
                  style={{ background: value }}
                  onClick={() => handleBorderButtonColorChange(value)}
                />
              ))}
            </div>
          </div>

          <div className="predefined-colors">
            <h4>Màu viền</h4>
            <div className="color-options">
              {Object.entries(borderColors).map(([key, value]) => (
                <div
                  key={key}
                  className={`color-option ${borderColor === value ? "active" : ""}`}
                  style={{ backgroundColor: value }}
                  onClick={() => handleBorderColorChange(value)}
                />
              ))}
            </div>
          </div>

          <div className="color-slider">
            <h4>Màu nền tùy chỉnh</h4>
            <input
              type="color"
              value={backgroundColor}
              onChange={handleCustomBackgroundColor}
              className="color-input"
            />
          </div>

          <div className="color-slider">
            <h4>Màu nút tùy chỉnh</h4>
            <input
              type="color"
              value={borderButtonColor.startsWith("linear-gradient") ? "#6B46C1" : borderButtonColor}
              onChange={handleCustomBorderButtonColor}
              className="color-input"
            />
          </div>

          <div className="color-slider">
            <h4>Màu viền tùy chỉnh</h4>
            <input
              type="color"
              value={borderColor}
              onChange={handleCustomBorderColor}
              className="color-input"
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .theme-settings {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }

        .palette-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--accent-color, linear-gradient(to right, #6B46C1, #A3BFFA));
          color: white;
          font-size: 20px;
          border: none;
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .palette-btn:hover {
          transform: scale(1.1) rotate(15deg);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }

        .toggle-btn {
          position: absolute;
          bottom: 60px;
          right: 0;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--background, #FFFFFF);
          color: var(--text-color, #000000);
          font-size: 20px;
          border: 2px solid var(--border-color, #A3BFFA);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .toggle-btn:hover {
          transform: rotate(360deg);
          background: var(--accent-color, linear-gradient(to right, #6B46C1, #A3BFFA));
          color: white;
        }

        .theme-form {
          position: absolute;
          bottom: 60px;
          right: 50px;
          width: 250px;
          background: var(--background, #FFFFFF);
          border: 2px solid var(--border-color, #A3BFFA);
          border-radius: 12px;
          padding: 15px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          animation: slideIn 0.3s ease forwards;
        }

        .form-title {
          margin: 0 0 10px;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-color, #000000);
          text-align: center;
        }

        .predefined-colors {
          margin-bottom: 15px;
        }

        .predefined-colors h4,
        .color-slider h4 {
          font-size: 14px;
          margin: 0 0 8px;
          color: var(--text-color, #000000);
        }

        .color-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .color-option {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s ease;
          border: 1px solid var(--text-color, #000000);
        }

        .color-option:hover {
          transform: scale(1.1);
        }

        .color-option.active {
          border: 2px solid var(--border-color, #A3BFFA);
        }

        .color-slider {
          margin-bottom: 15px;
        }

        .color-input {
          width: 100%;
          height: 30px;
          border: none;
          padding: 0;
          cursor: pointer;
          background: none;
        }

        .color-input::-webkit-color-swatch {
          border: 1px solid var(--text-color, #000000);
          border-radius: 4px;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to validate URL
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return url && typeof url === "string" && url.startsWith("/");
  }
};

export default function Home() {
  const [topNotes, setTopNotes] = useState([]);
  const [bottomNotes, setBottomNotes] = useState([]);
  const [error, setError] = useState(null);
  const [isStatsMenuOpen, setIsStatsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNotesLoading, setIsNotesLoading] = useState(true);
  const router = useRouter();

  const fetchNotes = async () => {
    setIsNotesLoading(true);
    const userData = localStorage.getItem("user");
    let user_id = null;
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        user_id = parsedUser.id;
      } catch (err) {
        setError("Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.");
        setIsNotesLoading(false);
        return;
      }
    } else {
      setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập.");
      setIsNotesLoading(false);
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
        .limit(6);

      if (error) throw new Error(`Lỗi Supabase (notess): ${error.message}`);

      const parsedNotes = data.map((note) => ({
        ...note,
        spreadsheet_data: note.note_type === "spreadsheet" && note.spreadsheet_data ? JSON.parse(note.spreadsheet_data) : Array(10).fill().map(() => Array(10).fill("")),
        isPinned: note.is_pinned || false,
        audio_url: note.audio_url || "",
        audio_file_name: note.audio_file_name || "",
        video_url: note.video_url || "",
        video_file_name: note.video_file_name || "",
        image_url: note.image_url && isValidUrl(note.image_url) ? note.image_url : "/note_image.svg",
      })) || [];

      setTopNotes(parsedNotes.slice(0, 3));
      setBottomNotes(parsedNotes.slice(3, 6));
    } catch (err) {
      setError("Không thể tải ghi chú: " + err.message);
    } finally {
      setIsNotesLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleNavigation = (path) => {
    setIsLoading(true);
    setTimeout(() => {
      router.push(path);
      setIsLoading(false);
    }, 500); // Ensure loading animation is visible for at least 500ms
  };

  const handlePostsClick = () => {
    handleNavigation("/blog/post");
  };

  const handleNotesClick = () => {
    handleNavigation("/note/create_notes");
  };

  const toggleStatsMenu = () => {
    setIsStatsMenuOpen((prev) => !prev);
  };

  const handleStatsPostsClick = () => {
    handleNavigation("/blog/report");
    setIsStatsMenuOpen(false);
  };

  const handleStatsNotesClick = () => {
    handleNavigation("/note/report");
    setIsStatsMenuOpen(false);
  };

  const handleCalendarClick = () => {
    handleNavigation("/note/calendar_page");
  };

  return (
    <div className="mt-[97px] min-h-screen flex" style={{ backgroundColor: 'var(--background)' }}>
      <main className="flex-1 p-6 relative">
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold font-montserrat text-transparent bg-clip-text" style={{ backgroundImage: 'var(--accent-color)' }}>
            Smart Notes Dashboard
          </h1>
          <div className="relative w-1/2">
            <input
              type="text"
              placeholder="Tìm ghi chú của bạn..."
              className="border rounded-full px-4 py-2 pr-10 focus:outline-none focus:ring focus:ring-blue-300 transition duration-200 w-full shadow-md"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
            />
            <button className="absolute right-0 top-0 mt-2 mr-2 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gradient-to-l transition duration-200" style={{ background: 'var(--accent-color)' }}>
              🔍
            </button>
          </div>
        </div>

        <div className="p-4 mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
            Chào mừng bạn đến với BlogNote
          </h2>
          <p className="mt-2" style={{ color: 'var(--text-color)' }}>
            Người bạn thông minh của bạn trong việc quản lý ghi chú. Tổ chức,
            tìm kiếm và tạo ghi chú một cách dễ dàng. Tăng cường năng suất của
            bạn với các công cụ thân thiện với người dùng được thiết kế cho việc
            học tập tối ưu.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isNotesLoading ? (
            <div className="loading-notes">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : topNotes.length > 0 ? (
            topNotes.map((note) => (
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
                <h3 className="text-lg font-semibold mt-2" style={{ color: 'var(--text-color)' }}>
                  {note.title}
                </h3>
                <p style={{ color: 'var(--text-color)' }}>
                  {note.content && note.content.length > 50
                    ? note.content.substring(0, 50) + "..."
                    : note.content || ""}
                </p>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-color)' }}>Không có ghi chú nào để hiển thị.</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {isNotesLoading ? (
            <div className="loading-notes">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : bottomNotes.length > 0 ? (
            bottomNotes.map((note) => (
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
                <h3 className="text-lg font-semibold mt-2" style={{ color: 'var(--text-color)' }}>
                  {note.title}
                </h3>
                <p style={{ color: 'var(--text-color)' }}>
                  {note.content && note.content.length > 50
                    ? note.content.substring(0, 50) + "..."
                    : note.content || ""}
                </p>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-color)' }}>Không có ghi chú nào để hiển thị.</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow mt-10 transition-transform duration-200 hover:shadow-xl">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>Tùy Chọn</h2>
          <ul className="mt-4">
            <li
              className="flex justify-between items-center py-2 border-b transition duration-200 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
              style={{ borderColor: 'var(--border-color)' }}
              onClick={handlePostsClick}
            >
              <span style={{ color: 'var(--text-color)' }}>Bài viết</span>
              <span style={{ color: 'var(--text-color)' }}>›</span>
            </li>
            <li
              className="flex justify-between items-center py-2 border-b transition duration-200 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
              style={{ borderColor: 'var(--border-color)' }}
              onClick={handleNotesClick}
            >
              <span style={{ color: 'var(--text-color)' }}>Ghi chú</span>
              <span style={{ color: 'var(--text-color)' }}>›</span>
            </li>
            <li
              className="flex justify-between items-center py-2 transition duration-200 hover:bg-blue-50 hover:text-blue-600 cursor-pointer relative"
              onClick={toggleStatsMenu}
            >
              <span style={{ color: 'var(--text-color)' }}>Thống kê</span>
              <span style={{ color: 'var(--text-color)' }}>›</span>
              {isStatsMenuOpen && (
                <div className="absolute top-full left-0 w-full bg-white rounded-lg shadow-lg z-10">
                  <div
                    className="py-2 px-4 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                    onClick={handleStatsPostsClick}
                    style={{ color: 'var(--text-color)' }}
                  >
                    Thống kê bài viết
                  </div>
                  <div
                    className="py-2 px-4 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                    onClick={handleStatsNotesClick}
                    style={{ color: 'var(--text-color)' }}
                  >
                    Thống kê ghi chú
                  </div>
                </div>
              )}
            </li>
          </ul>
        </div>

        <div className="mt-10" style={{ marginTop: isStatsMenuOpen ? '90px' : '40px', transition: 'margin-top 0.3s ease' }}>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>Sự Kiện Sắp Đến</h2>
          <div className="bg-white p-4 rounded-lg shadow mt-4">
            <p
              style={{ color: 'var(--text-color)', cursor: 'pointer' }}
              onClick={handleCalendarClick}
            >
              [Lịch và công việc của bạn hôm nay]
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </main>
      <ThemeSettings />
      <style jsx>{`
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
        }

        .loading-notes {
          grid-column: span 3;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 270px; /* Match min-h of note cards */
        }

        .loading-dots {
          display: flex;
          gap: 8px;
        }

        .loading-dots span {
          width: 12px;
          height: 12px;
          background-color: #9ca3fa; /* Light blue with a purple tint */
          border-radius: 50%;
          animation: wave 1.2s infinite ease-in-out;
        }

        .loading-dots span:nth-child(1) {
          animation-delay: 0s;
        }

        .loading-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .loading-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        .loading-dots span:nth-child(4) {
          animation-delay: 0.6s;
        }

        @keyframes wave {
          0%, 40%, 100% {
            transform: translateY(0);
          }
          20% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}