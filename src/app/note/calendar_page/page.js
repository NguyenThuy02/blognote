"use client"; // Add this line
import { useState } from 'react';
import '../../globals.css';

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
    <div className="container mx-auto p-5 relative bg-white rounded-xl shadow-lg">
      <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">Trang Lịch</h1>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handlePrevMonth}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 hover:from-blue-600 hover:to-purple-600 hover:shadow-lg transform hover:-translate-y-0.5"
        >
          Tháng Trước
        </button>
        <h2 className="text-2xl font-bold text-gray-800">{`${currentMonth + 1}/${currentYear}`}</h2>
        <button
          onClick={handleNextMonth}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 hover:from-blue-600 hover:to-purple-600 hover:shadow-lg transform hover:-translate-y-0.5"
        >
          Tháng Sau
        </button>
      </div>
      <div className="flex justify-center mb-4">
        <button
          onClick={handleToday}
          className="bg-white p-4 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 border-2 border-transparent hover:border-purple-400"
        >
          <span className="text-3xl bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            ⟲
          </span>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-4 text-center mb-4">
        {/* Tiêu đề cho các ngày trong tuần */}
        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
          <div key={day} className="font-bold text-lg text-purple-600 bg-purple-50 p-2 rounded-lg shadow-sm">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-4">
        {/* Các ngày trong tháng */}
        {Array.from({ length: daysInMonth }, (_, i) => (
          <div
            key={i}
            className="bg-white border-2 border-purple-100 p-6 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer group"
          >
            <span className="text-lg font-bold text-gray-700 group-hover:text-purple-600">{i + 1}</span>
          </div>
        ))}
      </div>
 
      {/* Animated Panda Icon */}
      <img
        src="https://i.pinimg.com/originals/a1/29/2a/a1292ab2302cc3f2120a66c8f252315c.gif"
        alt="Panda"
        className="absolute bottom-3 right-5 w-24 h-24 transform hover:scale-110 transition-transform duration-300"
      />
    </div>
  );
};
 
export default CalendarPage;
 