// src/utils/color.js
"use client";
import { useState, useEffect, useRef } from "react";
import { FaSun, FaMoon, FaPalette } from "react-icons/fa"; // Import icons

export const themes = {
  light: "bg-gradient-to-br from-blue-100 to-purple-100 text-gray-700",
  dark: "bg-gray-800 text-blue-500",
  blue: "bg-gradient-to-br from-blue-200 to-blue-500 text-gray-800",
  red: "bg-gradient-to-br from-red-200 to-red-500 text-gray-800",
  green: "bg-gradient-to-br from-green-200 to-green-500 text-gray-800",
  purple: "bg-gradient-to-br from-purple-200 to-purple-500 text-gray-800",
  yellow: "bg-gradient-to-br from-yellow-200 to-yellow-500 text-gray-800",
};

// Hàm tiện ích để trả về lớp CSS dựa trên theme và type
export const getThemeClasses = (theme, type) => {
  switch (type) {
    case "container":
      return theme === "light"
        ? "bg-white"
        : theme === "dark"
        ? "bg-gray-700"
        : theme === "blue"
        ? "bg-blue-100"
        : theme === "red"
        ? "bg-red-100"
        : theme === "green"
        ? "bg-green-100"
        : theme === "purple"
        ? "bg-purple-100"
        : "bg-yellow-100";
    case "editor":
      return theme === "light"
        ? "bg-gray-100"
        : theme === "dark"
        ? "bg-gray-700"
        : theme === "blue"
        ? "bg-blue-200"
        : theme === "red"
        ? "bg-red-200"
        : theme === "green"
        ? "bg-green-200"
        : theme === "purple"
        ? "bg-purple-200"
        : "bg-yellow-200";
    case "preview":
      return theme === "light"
        ? "bg-white"
        : theme === "dark"
        ? "bg-gray-600"
        : theme === "blue"
        ? "bg-blue-50"
        : theme === "red"
        ? "bg-red-50"
        : theme === "green"
        ? "bg-green-50"
        : theme === "purple"
        ? "bg-purple-50"
        : "bg-yellow-50";
    case "support":
    case "recent":
    case "favorites":
    case "tips":
    case "export":
    case "selector":
      return theme === "light"
        ? "bg-indigo-50 border-indigo-200"
        : theme === "dark"
        ? "bg-gray-800 border-gray-500"
        : theme === "blue"
        ? "bg-blue-200 border-blue-300"
        : theme === "red"
        ? "bg-red-200 border-red-300"
        : theme === "green"
        ? "bg-green-200 border-green-300"
        : theme === "purple"
        ? "bg-purple-200 border-purple-300"
        : "bg-yellow-200 border-yellow-300";
    case "modal":
      return theme === "light"
        ? "bg-white text-black"
        : theme === "dark"
        ? "bg-gray-900 text-gray-700"
        : theme === "blue"
        ? "bg-blue-100 text-gray-800"
        : theme === "red"
        ? "bg-red-100 text-gray-800"
        : theme === "green"
        ? "bg-green-100 text-gray-800"
        : theme === "purple"
        ? "bg-purple-100 text-gray-800"
        : "bg-yellow-100 text-gray-800";
    default:
      return "";
  }
};

export default function ThemeSelector({ currentTheme, onThemeChange }) {
  const [theme, setTheme] = useState("light");
  const [showSelector, setShowSelector] = useState(false);
  const selectorRef = useRef(null); // Tham chiếu

  useEffect(() => {
    localStorage.setItem("theme", theme);
    onThemeChange(theme);
  }, [theme, onThemeChange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setShowSelector(false);
      }
    };

    if (showSelector) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSelector]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setShowSelector(false);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <FaSun className="text-yellow-500" size={24} />;
      case "dark":
        return <FaMoon className="text-indigo-400" size={24} />;
      default:
        return <FaPalette className="" size={24} />;
    }
  };

  return (
    <>
      {/* Floating Icon Button */}
      <button
        onClick={() => setShowSelector(!showSelector)}
        className="fixed bottom-19 right-6 z-50 p-2 rounded-full shadow-lg bg-gray-400 text-white hover:bg-gray-500 transition-all"
      >
        {getThemeIcon()}
      </button>

      {/* Selector Panel */}
      {showSelector && (
        <div
          ref={selectorRef}
          className={`fixed bottom-20 right-6 z-40 p-4 rounded-lg shadow-lg border w-64 ${getThemeClasses(
            theme,
            "selector"
          )} transition-all duration-300`}
        >
          <div className="flex items-center gap-2 mb-3">
            {getThemeIcon()}
            <h3 className="text-lg font-bold text-indigo-700">
              Chế độ hiển thị
            </h3>
          </div>

          <select
            value={theme}
            onChange={(e) => handleThemeChange(e.target.value)}
            className={`border border-indigo-400 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:border-indigo-600 rounded px-3 py-2 w-full text-base transition-all duration-300 ${getThemeClasses(
              theme,
              "select"
            )}`}
          >
            <option value="light">Sáng</option>
            <option value="dark">Tối</option>
            <option value="blue">Xanh dương</option>
            <option value="red">Đỏ</option>
            <option value="green">Xanh lá</option>
            <option value="purple">Tím</option>
            <option value="yellow">Vàng</option>
          </select>
        </div>
      )}
    </>
  );
}
