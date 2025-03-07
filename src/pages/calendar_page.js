"use client"; // Add this line
import { useState } from 'react';
import global from '@/app/global';

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

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);

  return (
    <div className="container mx-auto p-5 relative">
      <h1 className="text-4xl font-bold mb-6 text-center text-indigo-700">Trang Lịch</h1>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handlePrevMonth}
          className="bg-gradient-to-r from-blue-300 to-purple-300 text-white font-sans px-5 py-2 rounded-lg transition duration-300 hover:from-blue-400 hover:to-purple-400"
        >
          Tháng Trước
        </button>
        <h2 className="text-2xl font-semibold">{`${currentMonth + 1}/${currentYear}`}</h2>
        <button
          onClick={handleNextMonth}
          className="bg-gradient-to-r from-blue-300 to-purple-300 text-white font-sans px-5 py-2 rounded-lg transition duration-300 hover:from-blue-400 hover:to-purple-400"
        >
          Tháng Sau
        </button>
      </div>
      <div className="flex justify-center mb-4">
        <button
          onClick={handleToday}
          className="bg-white p-3 rounded-full shadow-md transition duration-300 hover:bg-gradient-to-r hover:from-blue-300 hover:to-purple-300 hover:text-white"
        >
          <span className="text-2xl" style={{ background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
            {'⟲'}
          </span>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-4 text-center mb-4">
        {/* Tiêu đề cho các ngày trong tuần */}
        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
          <div key={day} className="font-bold text-indigo-600">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-4">
        {/* Các ngày trong tháng */}
        {Array.from({ length: daysInMonth }, (_, i) => (
          <div
            key={i}
            className="border border-gray-300 p-6 rounded-lg hover:bg-indigo-100 transition duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
          >
            <span className="text-lg font-semibold">{i + 1}</span>
          </div>
        ))}
      </div>

      {/* Animated Panda Icon */}
      <img
        src="https://i.pinimg.com/originals/a1/29/2a/a1292ab2302cc3f2120a66c8f252315c.gif"
        alt="Panda"
        className="absolute bottom-3 right-5 w-24 h-24" // Adjusted bottom value
      />
    </div>
  );
};

export default CalendarPage;