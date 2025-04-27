"use client";

import { useState, useEffect, useRef } from "react";
import { Sun, Moon, Leaf, Water, Heart, Flame, Star } from "lucide-react";

// Định nghĩa các theme với Tailwind CSS classes và icon tương ứng
export const themes = {
  light: "bg-gradient-to-br from-blue-100 to-purple-100 text-gray-700",
  dark: "bg-gray-800 text-white",
  blue: "bg-gradient-to-br from-blue-200 to-blue-500 text-gray-800",
  red: "bg-gradient-to-br from-red-200 to-red-500 text-gray-800",
  green: "bg-gradient-to-br from-green-200 to-green-500 text-gray-800",
  purple: "bg-gradient-to-br from-purple-200 to-purple-500 text-gray-800",
  yellow: "bg-gradient-to-br from-yellow-200 to-yellow-500 text-gray-800",
};

// Hàm tiện ích để trả về lớp Tailwind CSS dựa trên theme và type
export const getThemeClasses = (theme, type) => {
  switch (type) {
    case "container":
      return theme === "light"
        ? "bg-white"
        : theme === "dark"
        ? "bg-gray-900"
        : theme === "blue"
        ? "bg-blue-100"
        : theme === "red"
        ? "bg-red-100"
        : theme === "green"
        ? "bg-green-100"
        : theme === "purple"
        ? "bg-purple-100"
        : "bg-yellow-100";
    case "selector":
      return theme === "light"
        ? "bg-indigo-50 border-indigo-200"
        : theme === "dark"
        ? "bg-gray-800 border-gray-700"
        : theme === "blue"
        ? "bg-blue-200 border-blue-300"
        : theme === "red"
        ? "bg-red-200 border-red-300"
        : theme === "green"
        ? "bg-green-200 border-green-300"
        : theme === "purple"
        ? "bg-purple-200 border-purple-300"
        : "bg-yellow-200 border-yellow-300";
    case "select":
      return theme === "dark" ? "bg-gray-700 text-white" : "text-gray-700";
    case "header":
      return theme === "light"
        ? "bg-white border-b border-gray-200"
        : theme === "dark"
        ? "bg-gray-900 border-b border-gray-700"
        : theme === "blue"
        ? "bg-blue-100 border-b border-blue-300"
        : theme === "red"
        ? "bg-red-100 border-b border-red-300"
        : theme === "green"
        ? "bg-green-100 border-b border-green-300"
        : theme === "purple"
        ? "bg-purple-100 border-b border-purple-300"
        : "bg-yellow-100 border-b border-yellow-300";
    case "sidebar":
      return theme === "light"
        ? "bg-gradient-to-br from-blue-100 to-purple-100 border-r border-blue-200"
        : theme === "dark"
        ? "bg-gray-800 border-r border-gray-600"
        : theme === "blue"
        ? "bg-gradient-to-br from-blue-200 to-blue-500 border-r border-blue-300"
        : theme === "red"
        ? "bg-gradient-to-br from-red-200 to-red-500 border-r border-red-300"
        : theme === "green"
        ? "bg-gradient-to-br from-green-200 to-green-500 border-r border-green-300"
        : theme === "purple"
        ? "bg-gradient-to-br from-purple-200 to-purple-500 border-r border-purple-300"
        : "bg-gradient-to-br from-yellow-200 to-yellow-500 border-r border-yellow-300";
    case "main":
      return theme === "light"
        ? "bg-gradient-to-br from-white to-gray-100"
        : theme === "dark"
        ? "bg-gradient-to-br from-gray-900 to-black"
        : theme === "blue"
        ? "bg-gradient-to-br from-blue-100 to-blue-300"
        : theme === "red"
        ? "bg-gradient-to-br from-red-100 to-red-300"
        : theme === "green"
        ? "bg-gradient-to-br from-green-100 to-green-300"
        : theme === "purple"
        ? "bg-gradient-to-br from-purple-100 to-purple-300"
        : "bg-gradient-to-br from-yellow-100 to-yellow-300";
    case "footer":
      return theme === "light"
        ? "bg-white border-t border-gray-200"
        : theme === "dark"
        ? "bg-gray-900 border-t border-gray-700"
        : theme === "blue"
        ? "bg-blue-100 border-t border-blue-300"
        : theme === "red"
        ? "bg-red-100 border-t border-red-300"
        : theme === "green"
        ? "bg-green-100 border-t border-green-300"
        : theme === "purple"
        ? "bg-purple-100 border-t border-purple-300"
        : "bg-yellow-100 border-t border-yellow-300";
    default:
      return "";
  }
};

// Component ThemeSelector để chọn theme
function ThemeSelector({ currentTheme, onThemeChange }) {
  const [theme, setTheme] = useState(currentTheme || "light");

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.className = themes[theme]; // Áp dụng theme toàn cục
    onThemeChange(theme);
  }, [theme, onThemeChange]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <div
      className={`p-4 rounded-lg shadow-sm border w-48 ${getThemeClasses(theme, "selector")}`}
    >
      <h3 className="text-lg font-semibold text-indigo-700 mb-2">
        Chế độ hiển thị
      </h3>
      <select
        value={theme}
        onChange={(e) => handleThemeChange(e.target.value)}
        className={`border border-indigo-400 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:border-indigo-600 rounded px-3 py-2 w-full text-base transition-all duration-300 ${getThemeClasses(theme, "select")}`}
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
  );
}

// Component ThemeIcon hiển thị icon nổi và toggle ThemeSelector
function ThemeIcon() {
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef(null); // Tạo ref để tham chiếu đến ThemeSelector

  const toggleSelector = () => {
    setIsOpen(!isOpen);
  };

  // Xử lý click ngoài khu vực ThemeSelector để ẩn
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsOpen(false); // Ẩn ThemeSelector nếu click bên ngoài
      }
    };

    // Thêm sự kiện click vào document
    document.addEventListener("mousedown", handleClickOutside);

    // Dọn dẹp sự kiện khi component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggleSelector}
        className="p-3 bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-600 transition-all duration-300"
        aria-label="Chọn theme"
      >
        <Sun className="w-6 h-6" />
      </button>
      {isOpen && (
        <div
          ref={selectorRef} // Gắn ref vào div chứa ThemeSelector
          className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl"
        >
          <ThemeSelector
            currentTheme={localStorage.getItem("theme") || "light"}
            onThemeChange={(theme) => {
              localStorage.setItem("theme", theme);
            }}
          />
        </div>
      )}
    </div>
  );
}

// Component chính
export default function ThemeManager() {
  return <ThemeIcon />;
}