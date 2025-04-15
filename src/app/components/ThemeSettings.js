"use client";
import { useState, useEffect } from "react";

export default function ThemeSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("default");

  // Các chủ đề màu sắc có sẵn
  const themes = {
    default: { bg: "#FFFFFF", text: "#000000", foreground: "#171717", accent: "#6B46C1" },
    forest: { bg: "#F0F7F4", text: "#2D3A3E", foreground: "#2D3A3E", accent: "#4A7046" },
    ocean: { bg: "#E6F0FA", text: "#1E3A8A", foreground: "#1E3A8A", accent: "#3B82F6" },
    sunset: { bg: "#FFF7ED", text: "#431407", foreground: "#431407", accent: "#F97316" },
    midnight: { bg: "#1E293B", text: "#F1F5F9", foreground: "#F1F5F9", accent: "#8B5CF6" },
    pastel: { bg: "#F3E8FF", text: "#4B0082", foreground: "#4B0082", accent: "#D8B4FE" },
    desert: { bg: "#FDF6E3", text: "#3F2A1D", foreground: "#3F2A1D", accent: "#D97706" },
    neon: { bg: "#000000", text: "#FFFFFF", foreground: "#FFFFFF", accent: "#00FF00" },
  };

    // Áp dụng chủ đề
    useEffect(() => {
      const root = document.documentElement;
      const theme = isDarkMode
        ? { bg: "#1A202C", text: "#F7FAFC", accent: themes[selectedTheme].accent }
        : themes[selectedTheme];

      root.style.setProperty("--background", theme.bg);
      root.style.setProperty("--text-color", theme.text);
      root.style.setProperty("--accent-color", theme.accent);
    }, [isDarkMode, selectedTheme]);

      // Xử lý chuyển đổi tối/sáng
      const toggleDarkMode = () => {
        setIsDarkMode((prev) => !prev);
      };

  // Xử lý chọn chủ đề
  const handleThemeChange = (theme) => {
    setSelectedTheme(theme);
    setIsOpen(false); // Đóng form sau khi chọn
  };

  return (
    <div className="theme-settings">
      {/* Nút Palette */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="palette-btn"
        title="Cài đặt chủ đề"
      >
        🎨
      </button>

      {/* Nút chuyển đổi tối/sáng */}
      <button
        onClick={toggleDarkMode}
        className="toggle-btn"
        title={isDarkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      >
        {isDarkMode ? "🌙" : "☀️"}
      </button>

      {/* Form cài đặt chủ đề */}
      {isOpen && (
        <div className="theme-form">
          <h3 className="form-title">Chọn chủ đề</h3>
          <div className="theme-options">
            {Object.entries(themes).map(([key, value]) => (
              <div
                key={key}
                className={`theme-option ${selectedTheme === key ? "active" : ""}`}
                style={{ backgroundColor: value.bg, color: value.text }}
                onClick={() => handleThemeChange(key)}
              >
                <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <div
                  className="color-preview"
                  style={{ backgroundColor: value.accent }}
                />
              </div>
            ))}
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
          background: var(--accent-color, #6B46C1);
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
          border: 2px solid var(--accent-color, #6B46C1);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .toggle-btn:hover {
          transform: rotate(360deg);
          background: var(--accent-color, #6B46C1);
          color: white;
        }

        .theme-form {
          position: absolute;
          bottom: 60px;
          right: 50px;
          width: 200px;
          background: var(--background, #FFFFFF);
          border: 2px solid var(--accent-color, #6B46C1);
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

        .theme-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .theme-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .theme-option:hover {
          transform: translateX(5px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .theme-option.active {
          border: 2px solid var(--accent-color, #6B46C1);
        }

        .color-preview {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1px solid var(--text-color, #000000);
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
}