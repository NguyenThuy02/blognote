// src/utils/color.js
"use client";
import { useState, useEffect } from "react";

export const themes = {
  light: "bg-gradient-to-br from-blue-100 to-purple-100 text-gray-700",
  dark: "bg-gray-800 text-white",
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
    case "editor":
      return theme === "light"
        ? "bg-gray-100"
        : theme === "dark"
        ? "bg-gray-900"
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
        ? "bg-gray-800"
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
    case "recent":
      return theme === "light"
        ? "bg-blue-50 border-blue-200"
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
    case "favorites":
      return theme === "light"
        ? "bg-green-50 border-green-200"
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
    case "tips":
      return theme === "light"
        ? "bg-purple-50 border-purple-200"
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
    case "export":
      return theme === "light"
        ? "bg-yellow-50 border-yellow-200"
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
    case "modal":
      return theme === "light"
        ? "bg-white text-black"
        : theme === "dark"
        ? "bg-gray-900 text-white"
        : theme === "blue"
        ? "bg-blue-100 text-gray-800"
        : theme === "red"
        ? "bg-red-100 text-gray-800"
        : theme === "green"
        ? "bg-green-100 text-gray-800"
        : theme === "purple"
        ? "bg-purple-100 text-gray-800"
        : "bg-yellow-100 text-gray-800";
    case "input":
      return theme === "dark"
        ? "bg-gray-700 text-white"
        : "bg-white text-gray-700";
    case "select":
      return theme === "dark" ? "bg-gray-700 text-white" : "text-gray-700";
    default:
      return "";
  }
};

export default function ThemeSelector({ currentTheme, onThemeChange }) {
  const [theme, setTheme] = useState(currentTheme || "light");

  useEffect(() => {
    localStorage.setItem("theme", theme);
    onThemeChange(theme);
  }, [theme, onThemeChange]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <div
      className={`p-4 rounded-lg shadow-sm border ${getThemeClasses(
        theme,
        "selector"
      )}`}
    >
      <h3 className="text-lg font-semibold text-indigo-700">Chế độ hiển thị</h3>
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
  );
}
