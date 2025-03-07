"use client"; // Add this line
import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth === 0 ? 11 : currentMonth - 1);
    if (currentMonth === 0) setCurrentYear(currentYear - 1);
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth === 11 ? 0 : currentMonth + 1);
    if (currentMonth === 11) setCurrentYear(currentYear + 1);
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);

  return (
    <div className="container mx-auto p-5">
      <h1 className="text-3xl font-bold mb-4 text-center">Trang Lịch</h1>
      <div className="grid grid-cols-7 gap-2 text-center mb-4">
        {/* Tiêu đề cho các ngày trong tuần */}
        <div className="font-bold">CN</div>
        <div className="font-bold">T2</div>
        <div className="font-bold">T3</div>
        <div className="font-bold">T4</div>
        <div className="font-bold">T5</div>
        <div className="font-bold">T6</div>
        <div className="font-bold">T7</div>
        {/* Các ngày trong tháng */}
        {Array.from({ length: daysInMonth }, (_, i) => (
          <div key={i} className="border border-gray-300 p-4 hover:bg-blue-100 transition duration-300">
            {i + 1}
          </div>
        ))}
      </div>
      <h2 className="text-xl font-semibold text-center mb-4">{`${currentMonth + 1}/${currentYear}`}</h2>
      <div className="flex justify-between mb-4">
        <button onClick={handlePrevMonth} className="bg-green-500 text-white px-4 py-2 rounded-lg transition duration-300 hover:bg-green-600">
          Tháng Trước
        </button>
        <button onClick={handleNextMonth} className="bg-purple-500 text-white px-4 py-2 rounded-lg transition duration-300 hover:bg-purple-600">
          Tháng Sau
        </button>
      </div>
    </div>
  );
};

export default CalendarPage;