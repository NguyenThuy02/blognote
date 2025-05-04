"use client";
import { useState, useEffect } from "react";

export default function ThemeSettings({ user_id, note_id }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [borderButtonColor, setBorderButtonColor] = useState("linear-gradient(to right, #6B46C1, #A3BFFA)");
  const [borderColor, setBorderColor] = useState("#A3BFFA");

  // Available background colors
  const backgroundColors = {
    white: "#FFFFFF",
    lightBlue: "#E6F0FA",
    lightGreen: "#F0F7F4",
    lightYellow: "#FFF7ED",
  };

  // Available border/button colors (gradients and solid colors)
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

  // Available border colors (solid colors only)
  const borderColors = {
    blue: "#A3BFFA",
    green: "#A7F3D0",
    pink: "#FBCFE8",
    yellow: "#FEF9C3",
    gray: "#E5E7EB",
  };

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("themeSettings");
    if (savedTheme) {
      const theme = JSON.parse(savedTheme);
      setIsDarkMode(theme.isDarkMode || false);
      setBackgroundColor(theme.backgroundColor || "#FFFFFF");
      setBorderButtonColor(theme.borderButtonColor || "linear-gradient(to right, #6B46C1, #A3BFFA)");
      setBorderColor(theme.borderColor || "#A3BFFA");
    }
  }, []);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    const bgColor = isDarkMode ? "#1A202C" : backgroundColor;
    const textColor = isDarkMode ? "#F7FAFC" : "#000000";

    root.style.setProperty("--background", bgColor);
    root.style.setProperty("--text-color", textColor);
    root.style.setProperty("--accent-color", borderButtonColor);
    root.style.setProperty("--border-color", borderColor);
  }, [isDarkMode, backgroundColor, borderButtonColor, borderColor]);

  // Handle dark mode toggle and save directly to localStorage
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newDarkMode = !prev;
      const theme = {
        isDarkMode: newDarkMode,
        backgroundColor,
        borderButtonColor,
        borderColor,
      };
      localStorage.setItem("themeSettings", JSON.stringify(theme));
      return newDarkMode;
    });
  };

  // Handle save button click for other settings
  const handleSave = () => {
    const theme = {
      isDarkMode,
      backgroundColor,
      borderButtonColor,
      borderColor,
    };
    localStorage.setItem("themeSettings", JSON.stringify(theme));
    alert("Lưu giao diện thành công!");
  };

  // Handle background color selection
  const handleBackgroundColorChange = (color) => {
    setBackgroundColor(color);
  };

  // Handle border/button color selection
  const handleBorderButtonColorChange = (color) => {
    setBorderButtonColor(color);
  };

  // Handle border color selection
  const handleBorderColorChange = (color) => {
    setBorderColor(color);
  };

  // Handle custom color changes from color picker
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
      {/* Palette Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="palette-btn"
        title="Theme Settings"
      >
        🎨
      </button>

      {/* Dark/Light Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        className="toggle-btn"
        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDarkMode ? "🌙" : "☀️"}
      </button>

      {/* Theme Settings Form */}
      {isOpen && (
        <div className="theme-form">
          <h3 className="form-title">Tùy chỉnh giao diện</h3>

          {/* Predefined Background Colors */}
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

          {/* Predefined Border/Button Colors */}
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

          {/* Predefined Border Colors */}
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

          {/* Custom Background Color Picker */}
          <div className="color-slider">
            <h4>Màu nền tùy chỉnh</h4>
            <input
              type="color"
              value={backgroundColor}
              onChange={handleCustomBackgroundColor}
              className="color-input"
            />
          </div>

          {/* Custom Border/Button Color Picker */}
          <div className="color-slider">
            <h4>Màu nút tùy chỉnh</h4>
            <input
              type="color"
              value={borderButtonColor.startsWith("linear-gradient") ? "#6B46C1" : borderButtonColor}
              onChange={handleCustomBorderButtonColor}
              className="color-input"
            />
          </div>

          {/* Custom Border Color Picker */}
          <div className="color-slider">
            <h4>Màu viền tùy chỉnh</h4>
            <input
              type="color"
              value={borderColor}
              onChange={handleCustomBorderColor}
              className="color-input"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="save-btn"
          >
            Lưu
          </button>
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

        .save-btn {
          width: 100%;
          padding: 8px;
          background: var(--accent-color, linear-gradient(to right, #6B46C1, #A3BFFA));
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .save-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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