"use client";
import { useState, useEffect } from "react";
import "../../globals.css";
import { supabase2 } from "../../../lib/supabase";
import ChiTiet from "../../components/details";
import Notifications from "../../components/Notifications";
import { MailOutlined, LeftOutlined, RightOutlined, CloseOutlined, EllipsisOutlined, SearchOutlined, CalendarOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import ical from "ical-generator";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ThemeSettings from "../../components/ThemeSettings";

// Updated solarToLunar function with a reference-based calculation
const solarToLunar = (day, month, year) => {
  const referenceSolarDate = new Date(2025, 3, 16);
  const referenceLunarDay = 19;
  const referenceLunarMonth = 3;
  const referenceLunarYear = 2025;
  const targetSolarDate = new Date(year, month, day);
  const timeDiff = targetSolarDate - referenceSolarDate;
  const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  let lunarDay = referenceLunarDay + dayDiff;
  let lunarMonth = referenceLunarMonth;
  let lunarYear = referenceLunarYear;
  while (lunarDay > 30) {
    lunarDay -= 30;
    lunarMonth += 1;
    if (lunarMonth > 12) {
      lunarMonth = 1;
      lunarYear += 1;
    }
  }
  while (lunarDay <= 0) {
    lunarMonth -= 1;
    if (lunarMonth < 1) {
      lunarMonth = 12;
      lunarYear -= 1;
    }
    lunarDay += 30;
  }
  const zodiacCycle = [
    "Giáp Tý", "Ất Sửu", "Bính Dần", "Đinh Mão", "Mậu Thìn", "Kỷ Tỵ", "Canh Ngọ", "Tân Mùi", "Nhâm Thân", "Quý Dậu",
    "Giáp Tuất", "Ất Hợi", "Bính Tý", "Đinh Sửu", "Mậu Dần", "Kỷ Mão", "Canh Thìn", "Tân Tỵ", "Nhâm Ngọ", "Quý Mùi",
    "Giáp Thân", "Ất Dậu", "Bính Tuất", "Đinh Hợi", "Mậu Tý", "Kỷ Sửu", "Canh Dần", "Tân Mão", "Nhâm Thìn", "Quý Tỵ",
    "Giáp Ngọ", "Ất Mùi", "Bính Thân", "Đinh Dậu", "Mậu Tuất", "Kỷ Hợi", "Canh Tý", "Tân Sửu", "Nhâm Dần", "Quý Mão",
    "Giáp Thìn", "Ất Tỵ", "Bính Ngọ", "Đinh Mùi", "Mậu Thân", "Kỷ Dậu", "Canh Tuất", "Tân Hợi", "Nhâm Tý", "Quý Sửu",
    "Giáp Dần", "Ất Mão", "Bính Thìn", "Đinh Tỵ", "Mậu Ngọ", "Kỷ Mùi", "Canh Thân", "Tân Dậu", "Nhâm Tuất", "Quý Hợi"
  ];
  const referenceZodiacIndex = 41;
  const zodiacIndex = (referenceZodiacIndex + dayDiff) % 60;
  const adjustedZodiacIndex = zodiacIndex < 0 ? zodiacIndex + 60 : zodiacIndex;
  const zodiacDay = zodiacCycle[adjustedZodiacIndex];
  return `Tháng ${lunarMonth} năm ${lunarYear}\nNgày ${lunarDay} - ${zodiacDay}`;
};

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [todos, setTodos] = useState([]);
  const [viewDetailNoteId, setViewDetailNoteId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [sentEmails, setSentEmails] = useState({});
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState("month");
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState("vi");
  const [showQuickView, setShowQuickView] = useState(false);
  const [quickViewDay, setQuickViewDay] = useState(selectedDay || new Date().getDate());
  const [quickViewMonth, setQuickViewMonth] = useState(currentMonth);
  const [quickViewYear, setQuickViewYear] = useState(currentYear);

  const today = new Date();
  const isToday = (day) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase2
        .from("notess")
        .select("id, title, todos")
        .eq("note_type", "whiteboard");
      if (error) throw error;

      const allTodos = data
        .filter((note) => note.todos)
        .flatMap((note) => {
          try {
            const parsedTodos = JSON.parse(note.todos);
            return Array.isArray(parsedTodos)
              ? parsedTodos.map((todo, index) => ({
                  ...todo,
                  todoId: `${note.id}-${index}`,
                  noteId: note.id,
                  noteTitle: note.title,
                }))
              : [];
          } catch (e) {
            console.error("Error parsing todos:", e);
            return [];
          }
        })
        .filter((todo) => todo.reminder);

      setTodos(allTodos);
    } catch (err) {
      console.error("Error fetching todos:", err);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUserEmail(userData.email || "");
    }
    fetchTodos();
  }, []);

  const sendEmailReminder = (todo) => {
    if (!userEmail) {
      console.error("No user email found for sending reminder.");
      return;
    }

    const reminderDate = new Date(todo.reminder);
    const content = `Nhắc nhở công việc: ${todo.text || todo.noteTitle}\nNgày: ${reminderDate.toLocaleDateString()}\nThời gian: ${reminderDate.toLocaleTimeString()}`;
    console.log(`[Giả lập] Email sent to ${userEmail}: ${content}`);
    setSentEmails((prev) => ({
      ...prev,
      [todo.todoId]: { status: true, content },
    }));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      todos.forEach((todo) => {
        const reminderDate = new Date(todo.reminder);
        if (
          now >= reminderDate &&
          (!sentEmails[todo.todoId] || !sentEmails[todo.todoId].status)
        ) {
          sendEmailReminder(todo);
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [todos, sentEmails]);

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth === 0 ? 11 : currentMonth - 1);
    if (currentMonth === 0) setCurrentYear(currentYear - 1);
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth === 11 ? 0 : currentMonth + 1);
    if (currentMonth === 11) setCurrentYear(currentYear + 1);
    setSelectedDay(null);
  };

  const handlePrevYear = () => {
    setCurrentYear(currentYear - 1);
    setSelectedDay(null);
  };

  const handleNextYear = () => {
    setCurrentYear(currentYear + 1);
    setSelectedDay(null);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDay(null);
  };

  const handlePrevDay = () => {
    let newDay = (selectedDay || today.getDate()) - 1;
    let newMonth = currentMonth;
    let newYear = currentYear;
    if (newDay < 1) {
      newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      newYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      newDay = getDaysInMonth(newMonth, newYear);
    }
    setSelectedDay(newDay);
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const handleNextDay = () => {
    let newDay = (selectedDay || today.getDate()) + 1;
    let newMonth = currentMonth;
    let newYear = currentYear;
    const daysInCurrentMonth = getDaysInMonth(currentMonth, currentYear);
    if (newDay > daysInCurrentMonth) {
      newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      newYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      newDay = 1;
    }
    setSelectedDay(newDay);
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);

  const getTodosForDay = (day) => {
    const dateToCheck = new Date(currentYear, currentMonth, day);
    return todos.filter((todo) => {
      if (!todo.reminder) return false;
      const reminderDate = new Date(todo.reminder);
      return (
        reminderDate.getDate() === dateToCheck.getDate() &&
        reminderDate.getMonth() === dateToCheck.getMonth() &&
        reminderDate.getFullYear() === dateToCheck.getFullYear()
      );
    });
  };

  const getTooltipText = (todosForDay) => {
    if (todosForDay.length === 0) return "";
    return todosForDay.map((todo) => todo.noteTitle).join(", ");
  };

  const handleNoteClick = (noteId) => {
    setViewDetailNoteId(noteId);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleDayClick = (day) => {
    setSelectedDay(selectedDay === day ? null : day);
  };

  const handleCloseTaskList = () => {
    setSelectedDay(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".day-cell") && !event.target.closest(".task-list")) {
        setSelectedDay(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const filteredTodos = todos.filter((todo) =>
    todo.noteTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const suggestFreeTime = () => {
    const today = new Date();
    const busyHours = todos
      .filter((todo) => {
        const reminderDate = new Date(todo.reminder);
        return (
          reminderDate.getDate() === today.getDate() &&
          reminderDate.getMonth() === today.getMonth() &&
          reminderDate.getFullYear() === today.getFullYear()
        );
      })
      .map((todo) => new Date(todo.reminder).getHours());
    const freeHour = Array.from({ length: 24 }, (_, i) => i).find(
      (hour) => !busyHours.includes(hour)
    );
    return freeHour !== undefined
      ? `Gợi ý thời gian rảnh hôm nay: ${freeHour}:00`
      : "Hôm nay không có thời gian rảnh.";
  };

  const exportCalendar = () => {
    try {
      const calendar = ical({ name: "BlogNote Calendar" });
      todos.forEach((todo) => {
        if (todo.reminder) {
          const reminderDate = new Date(todo.reminder);
          calendar.createEvent({
            start: reminderDate,
            end: new Date(reminderDate.getTime() + 60 * 60 * 1000),
            summary: todo.noteTitle,
            description: todo.text || todo.noteTitle,
            location: "N/A",
            organizer: { name: "BlogNote", email: userEmail || "no-reply@blognote.com" },
          });
        }
      });
      const blob = new Blob([calendar.toString()], { type: "text/calendar" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `blognote_calendar_${currentMonth + 1}_${currentYear}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Lịch đã được xuất thành công!");
    } catch (error) {
      console.error("Error exporting calendar:", error);
      toast.error("Có lỗi khi xuất lịch. Vui lòng thử lại.");
    }
  };

  const syncCalendar = async () => {
    try {
      if (!userEmail) {
        toast.error("Vui lòng đăng nhập để đồng bộ lịch.");
        return;
      }
      const events = todos
        .filter((todo) => todo.reminder)
        .map((todo) => ({
          summary: todo.noteTitle,
          description: "Đồng bộ từ BlogNote Calendar",
          start: {
            dateTime: new Date(todo.reminder).toISOString(),
            timeZone: "Asia/Ho_Chi_Minh",
          },
          end: {
            dateTime: new Date(new Date(todo.reminder).getTime() + 60 * 60 * 1000).toISOString(),
            timeZone: "Asia/Ho_Chi_Minh",
          },
        }));
      console.log("Đang đồng bộ với Google Calendar...", { email: userEmail, events });
      toast.success("Đồng bộ lịch với Google Calendar thành công!");
    } catch (error) {
      console.error("Error syncing calendar:", error);
      toast.error("Có lỗi khi đồng bộ lịch. Vui lòng thử lại.");
    }
  };

  const getHeatmapData = () => {
    const heatmap = {};
    todos.forEach((todo) => {
      const date = new Date(todo.reminder);
      const key = `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
      heatmap[key] = (heatmap[key] || 0) + 1;
    });
    return heatmap;
  };

  const MiniCalendar = () => {
    const miniDaysInMonth = getDaysInMonth(currentMonth, currentYear);
    const heatmap = getHeatmapData();
    return (
      <div className="grid grid-cols-7 gap-1 text-center">
        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
          <div key={day} className="text-xs font-bold text-purple-600">
            {day}
          </div>
        ))}
        {Array.from({ length: miniDaysInMonth }, (_, i) => {
          const day = i + 1;
          const key = `${day}-${currentMonth}-${currentYear}`;
          const eventCount = heatmap[key] || 0;
          return (
            <div
              key={i}
              className={`text-xs p-1 rounded-full ${
                eventCount > 0
                  ? `bg-gradient-to-br from-purple-100 to-blue-100`
                  : "bg-gray-100"
              } ${isToday(day) ? "border-2 border-purple-400" : ""}`}
            >
              {day}
            </div>
          );
        })}
      </div>
    );
  };

  const WeekView = () => {
    const startOfWeek = new Date(currentYear, currentMonth, selectedDay || 1);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
    return (
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((date, i) => (
          <div
            key={i}
            className="bg-white border-2 border-purple-100 p-4 rounded-xl"
          >
            <div className="font-bold">{date.getDate()}</div>
            {getTodosForDay(date.getDate()).map((todo, index) => (
              <div
                key={index}
                className="text-sm text-purple-600 hover:underline cursor-pointer"
                onClick={() => handleNoteClick(todo.noteId)}
              >
                {todo.noteTitle}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const DayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return (
      <div className="flex flex-col gap-2">
        {hours.map((hour) => {
          const todosInHour = getTodosForDay(selectedDay).filter(
            (todo) => new Date(todo.reminder).getHours() === hour
          );
          return (
            <div
              key={hour}
              className="flex items-center gap-2 border-b border-gray-100 p-2"
            >
              <div className="w-16 text-sm font-bold">{`${hour}:00`}</div>
              <div className="flex-1">
                {todosInHour.map((todo, index) => (
                  <div
                    key={index}
                    className="text-sm text-purple-600 hover:underline cursor-pointer"
                    onClick={() => handleNoteClick(todo.noteId)}
                  >
                    {todo.noteTitle}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const formatSolarDate = (day, month, year) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.toLocaleDateString("vi-VN", { weekday: "long" });
    return `${dayOfWeek} ${month + 1} năm ${year}`;
  };

  const formatLunarDate = (day, month, year) => {
    return solarToLunar(day, month, year);
  };

  const getLunarDay = (day, month, year) => {
    const lunarDateString = solarToLunar(day, month, year);
    const lunarDay = lunarDateString.split('\n')[1].split(' ')[1];
    return lunarDay;
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const getQuickViewDays = () => {
    const daysInCurrentMonth = getDaysInMonth(quickViewMonth, quickViewYear);
    const firstDay = getFirstDayOfMonth(quickViewMonth, quickViewYear);
    const daysInPrevMonth = getDaysInMonth(quickViewMonth - 1, quickViewMonth === 0 ? quickViewYear - 1 : quickViewYear);
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
      });
    }
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
      });
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
      });
    }
    return days;
  };

  const handleQuickViewDayClick = (day, isCurrentMonth) => {
    if (!isCurrentMonth) {
      if (day > 15) {
        const newMonth = quickViewMonth === 0 ? 11 : quickViewMonth - 1;
        const newYear = quickViewMonth === 0 ? quickViewYear - 1 : quickViewYear;
        setQuickViewMonth(newMonth);
        setQuickViewYear(newYear);
        setQuickViewDay(day);
      } else {
        const newMonth = quickViewMonth === 11 ? 0 : quickViewMonth + 1;
        const newYear = quickViewMonth === 11 ? quickViewYear + 1 : quickViewYear;
        setQuickViewMonth(newMonth);
        setQuickViewYear(newYear);
        setQuickViewDay(day);
      }
    } else {
      setQuickViewDay(day);
    }
  };

  const handleQuickViewPrevMonth = () => {
    const newMonth = quickViewMonth === 0 ? 11 : quickViewMonth - 1;
    const newYear = quickViewMonth === 0 ? quickViewYear - 1 : quickViewYear;
    setQuickViewMonth(newMonth);
    setQuickViewYear(newYear);
    const daysInNewMonth = getDaysInMonth(newMonth, newYear);
    if (quickViewDay > daysInNewMonth) setQuickViewDay(daysInNewMonth);
  };

  const handleQuickViewNextMonth = () => {
    const newMonth = quickViewMonth === 11 ? 0 : quickViewMonth + 1;
    const newYear = quickViewMonth === 11 ? quickViewYear + 1 : quickViewYear;
    setQuickViewMonth(newMonth);
    setQuickViewYear(newYear);
    const daysInNewMonth = getDaysInMonth(newMonth, newYear);
    if (quickViewDay > daysInNewMonth) setQuickViewDay(daysInNewMonth);
  };

  const handleQuickViewConfirm = () => {
    setSelectedDay(quickViewDay);
    setCurrentMonth(quickViewMonth);
    setCurrentYear(quickViewYear);
    setShowQuickView(false);
  };

  const handleQuickView = () => {
    setQuickViewDay(selectedDay || today.getDate());
    setQuickViewMonth(currentMonth);
    setQuickViewYear(currentYear);
    setShowQuickView(true);
  };

  return (
    <div className="mt-[97px] p-5 mb-[-7px] w-full min-h-screen bg-gradient-to-br from-gray-50 to-white flex justify-center items-start">
      {/* Supplemental CSS to integrate ThemeSettings */}
      <style jsx global>{`
        /* Apply theme variables to CalendarPage elements */
        .mt-[97px] {
          background: var(--background, #FFFFFF);
          color: var(--text-color, #000000);
        }

        /* Buttons with gradient backgrounds */
        button.bg-gradient-to-r {
          background: var(--accent-color, linear-gradient(to right, #6B46C1, #A3BFFA));
          border-color: var(--border-color, #A3BFFA);
          color: var(--text-color, #000000);
        }

        /* Hover effects for buttons */
        button.bg-gradient-to-r:hover {
          background: var(--accent-color, linear-gradient(to right, #6B46C1, #A3BFFA));
          border-color: var(--border-color, #A3BFFA);
          color: var(--text-color, #000000);
        }

        /* Day cells */
        .day-cell {
          background: var(--background, #FFFFFF);
          border-color: var(--border-color, #A3BFFA);
          color: var(--text-color, #000000);
        }

        .day-cell:hover {
          background: var(--background, #FFFFFF);
          border-color: var(--border-color, #A3BFFA);
        }

        /* Task list */
        .task-list {
          background: var(--background, #FFFFFF);
          border-color: var(--border-color, #A3BFFA);
          color: var(--text-color, #000000);
        }

        /* Sidebar */
        .fixed.top-0.left-0 {
          background: var(--background, #FFFFFF);
          border-color: var(--border-color, #A3BFFA);
          color: var(--text-color, #000000);
        }

        /* Quick view modal */
        .fixed.top-1\\/2.left-1\\/2 {
          background: var(--background, #FFFFFF);
          border-color: var(--border-color, #A3BFFA);
          color: var(--text-color, #000000);
        }

        /* Calendar container */
        .bg-white.rounded-2xl {
          background: var(--background, #FFFFFF);
          border-color: var(--border-color, #A3BFFA);
          color: var(--text-color, #000000);
        }

        /* Text elements */
        h1, h2, h3, h4, p, span {
          color: var(--text-color, #000000);
        }

        /* Input and select elements */
        input, select {
          background: var(--background, #FFFFFF);
          border-color: var(--border-color, #A3BFFA);
          color: var(--text-color, #000000);
        }

        /* Ensure existing styles are not overridden unless specified */
        .bg-purple-50, .bg-purple-100, .bg-gray-100, .bg-gray-200 {
          /* Preserve specific background colors */
        }

        .text-purple-600, .text-gray-600, .text-gray-700, .text-gray-800 {
          /* Preserve specific text colors where needed */
        }
      `}</style>

      <ToastContainer position="top-right" autoClose={3000} />
      <div className="w-full relative">
        <motion.div
          className="w-full bg-white rounded-2xl shadow-xl mt-1 px-4 sm:px-6 lg:px-8 py-3 sm:py-4"
          animate={{ x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {showSidebar && (
            <>
              <motion.div
                initial={{ x: -256 }}
                animate={{ x: 0 }}
                exit={{ x: -256 }}
                transition={{ duration: 0.3 }}
                className="fixed top-0 left-0 h-full w-72 sm:w-80 bg-white border-r border-gray-200 p-4 z-50 shadow-lg"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-purple-600">Điều khiển</h3>
                  <button
                    onClick={toggleSidebar}
                    className="text-gray-500 hover:text-purple-600"
                  >
                    <CloseOutlined className="text-lg" />
                  </button>
                </div>
                <div className="relative mb-4">
                  <SearchOutlined className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sự kiện..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-2">Lịch nhỏ</h4>
                  <MiniCalendar />
                </div>
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-2">Công việc</h4>
                  {filteredTodos.slice(0, 5).map((todo, index) => (
                    <div
                      key={index}
                      className="text-sm text-purple-600 hover:underline cursor-pointer mb-1"
                      onClick={() => handleNoteClick(todo.noteId)}
                    >
                      {todo.noteTitle}
                    </div>
                  ))}
                </div>
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-2">Gợi ý AI</h4>
                  <p className="text-sm text-gray-600">{suggestFreeTime()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2">Ngôn ngữ</h4>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-2 border-2 border-purple-200 rounded-xl"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black bg-opacity-30 z-40"
                onClick={toggleSidebar}
              />
            </>
          )}

          {showQuickView && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black z-50"
                onClick={() => setShowQuickView(false)}
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-80 z-60"
              >
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={handleQuickViewPrevMonth}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <LeftOutlined className="text-lg" />
                  </button>
                  <h3 className="text-lg font-bold text-gray-800">
                    THÁNG {quickViewMonth + 1 < 10 ? `0${quickViewMonth + 1}` : quickViewMonth + 1} – {quickViewYear}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleQuickViewNextMonth}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <RightOutlined className="text-lg" />
                    </button>
                    <button
                      onClick={() => setShowQuickView(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <CloseOutlined className="text-lg" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {["Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "CN"].map((day) => (
                    <div key={day} className="text-sm font-bold text-gray-600">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-4">
                  {getQuickViewDays().map((date, index) => (
                    <div
                      key={index}
                      className={`text-sm p-2 rounded cursor-pointer ${
                        date.isCurrentMonth
                          ? quickViewDay === date.day
                            ? "bg-gray-300 text-white"
                            : "text-gray-800 hover:bg-gray-100"
                          : "text-gray-400"
                      }`}
                      onClick={() => handleQuickViewDayClick(date.day, date.isCurrentMonth)}
                    >
                      {date.day}
                    </div>
                  ))}
                </div>
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500">☀</span>
                    <h4 className="text-sm font-bold text-gray-800">Dương Lịch</h4>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-600">Ngày {quickViewDay}</span>
                    <select
                      value={quickViewMonth + 1}
                      onChange={(e) => {
                        const newMonth = parseInt(e.target.value) - 1;
                        setQuickViewMonth(newMonth);
                        const daysInNewMonth = getDaysInMonth(newMonth, quickViewYear);
                        if (quickViewDay > daysInNewMonth) setQuickViewDay(daysInNewMonth);
                      }}
                      className="border border-gray-300 rounded p-1 text-sm"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <option key={month} value={month}>
                          Tháng {month}
                        </option>
                      ))}
                    </select>
                    <select
                      value={quickViewYear}
                      onChange={(e) => {
                        const newYear = parseInt(e.target.value);
                        setQuickViewYear(newYear);
                        const daysInNewMonth = getDaysInMonth(quickViewMonth, newYear);
                        if (quickViewDay > daysInNewMonth) setQuickViewDay(daysInNewMonth);
                      }}
                      className="border border-gray-300 rounded p-1 text-sm"
                    >
                      {Array.from({ length: 21 }, (_, i) => quickViewYear - 10 + i).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">☾</span>
                    <h4 className="text-sm font-bold text-gray-800">Âm Lịch</h4>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-600">
                      Ngày {solarToLunar(quickViewDay, quickViewMonth, quickViewYear).split('\n')[1].split(' ')[1]}
                    </span>
                    <select
                      value={solarToLunar(quickViewDay, quickViewMonth, quickViewYear).split('\n')[0].split(' ')[1]}
                      onChange={(e) => {
                        const newLunarMonth = parseInt(e.target.value) - 1;
                        const newSolarMonth = newLunarMonth;
                        setQuickViewMonth(newSolarMonth);
                        const daysInNewMonth = getDaysInMonth(newSolarMonth, quickViewYear);
                        if (quickViewDay > daysInNewMonth) setQuickViewDay(daysInNewMonth);
                      }}
                      className="border border-gray-300 rounded p-1 text-sm"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <option key={month} value={month}>
                          Tháng {month}
                        </option>
                      ))}
                    </select>
                    <select
                      value={solarToLunar(quickViewDay, quickViewMonth, quickViewYear).split('\n')[0].split(' ')[3]}
                      onChange={(e) => {
                        const newYear = parseInt(e.target.value);
                        setQuickViewYear(newYear);
                        const daysInNewMonth = getDaysInMonth(quickViewMonth, newYear);
                        if (quickViewDay > daysInNewMonth) setQuickViewDay(daysInNewMonth);
                      }}
                      className="border border-gray-300 rounded p-1 text-sm"
                    >
                      {Array.from({ length: 21 }, (_, i) => quickViewYear - 10 + i).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleQuickViewConfirm}
                  className="w-full bg-gradient-to-r from-purple-200 to-blue-200 text-purple-600 font-bold px-4 py-2 rounded-xl border-2 border-purple-200 shadow-md hover:bg-gradient-to-r hover:from-purple-300 hover:to-blue-300 hover:text-purple-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  XEM
                </button>
              </motion.div>
            </>
          )}

          <div className="relative">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleSidebar}
                  className="bg-gradient-to-r from-purple-200 to-blue-200 text-purple-600 font-bold px-3 py-2 rounded-xl border-2 border-purple-200 shadow-md hover:bg-gradient-to-r hover:from-purple-300 hover:to-blue-300"
                >
                  <EllipsisOutlined className="text-lg" />
                </button>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="px-3 py-2 border-2 border-purple-200 rounded-xl text-base font-bold text-purple-600 bg-gradient-to-r from-purple-200 to-blue-200 hover:bg-gradient-to-r hover:from-purple-300 hover:to-blue-300"
                >
                  <option value="month">Tháng</option>
                  <option value="week">Tuần</option>
                  <option value="day">Ngày</option>
                </select>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse absolute left-1/2 transform -translate-x-1/2">
                BlogNote - Trang lịch
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-blue-400 to-purple-400 opacity-50 rounded-full"></span>
              </h1>
              <div className="flex items-center space-x-2"></div>
            </div>
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevYear}
                  className="bg-gradient-to-r from-purple-200 to-blue-200 text-purple-600 font-bold px-4 py-2 rounded-xl border-2 border-purple-200 shadow-md hover:bg-gradient-to-r hover:from-purple-300 hover:to-blue-300 hover:text-purple-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                  aria-label="Năm trước"
                >
                  <LeftOutlined className="text-base" />
                </button>
                <button
                  onClick={handlePrevMonth}
                  className="bg-gradient-to-r from-purple-200 to-blue-200 text-purple-600 font-bold px-6 py-3 rounded-xl border-2 border-purple-200 shadow-md hover:bg-gradient-to-r hover:from-purple-300 hover:to-blue-300 hover:text-purple-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-2 text-base"
                  aria-label="Tháng trước"
                >
                  <LeftOutlined />
                  <span>Tháng Trước</span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{`${currentMonth + 1}/${currentYear}`}</h2>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleNextMonth}
                  className="bg-gradient-to-r from-purple-200 to-blue-200 text-purple-600 font-bold px-6 py-3 rounded-xl border-2 border-purple-200 shadow-md hover:bg-gradient-to-r hover:from-purple-300 hover:to-blue-300 hover:text-purple-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-2 text-base"
                  aria-label="Tháng sau"
                >
                  <span>Tháng Sau</span>
                  <RightOutlined />
                </button>
                <button
                  onClick={handleNextYear}
                  className="bg-gradient-to-r from-purple-200 to-blue-200 text-purple-600 font-bold px-4 py-2 rounded-xl border-2 border-purple-200 shadow-md hover:bg-gradient-to-r hover:from-purple-300 hover:to-blue-300 hover:text-purple-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                  aria-label="Năm sau"
                >
                  <RightOutlined className="text-base" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {viewMode === "month" && (
                  <>
                    <div className="grid grid-cols-7 gap-3 sm:gap-4 text-center mb-3">
                      {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                        <div
                          key={day}
                          className="font-bold text-sm sm:text-lg text-purple-600 bg-purple-50 p-2 rounded-lg shadow-sm transition-colors duration-200 hover:bg-purple-100"
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-3 sm:gap-4 relative">
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const todosForDay = getTodosForDay(day);
                        const tooltipText = getTooltipText(todosForDay);
                        return (
                          <motion.div
                            key={i}
                            className={`day-cell bg-white border-2 border-purple-200 p-4 sm:p-6 rounded-xl transition-all duration-300 cursor-pointer relative z-10 ${
                              isToday(day)
                                ? "bg-purple-100"
                                : "hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:scale-105 hover:shadow-xl hover:border-purple-300"
                            }`}
                            onClick={() => handleDayClick(day)}
                            title={tooltipText}
                            aria-label={`Ngày ${day} tháng ${currentMonth + 1}`}
                            whileHover={{ scale: 1.05 }}
                          >
                            <span
                              className={`text-base sm:text-lg font-bold ${
                                isToday(day) ? "text-purple-600" : "text-gray-700"
                              }`}
                            >
                              {day}
                            </span>
                            {todosForDay.length > 0 && (
                              <div className="absolute top-1 right-1 flex items-center space-x-1">
                                <span className="inline-flex items-center justify-center w-4 sm:w-5 h-4 sm:h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                                  {todosForDay.length}
                                </span>
                                {todosForDay.some((todo) => sentEmails[todo.todoId]?.status) && (
                                  <MailOutlined className="text-green-500 text-sm sm:text-base" title="Thông báo đã gửi qua email" />
                                )}
                              </div>
                            )}
                            {selectedDay === day && todosForDay.length > 0 && (
                              <div className="task-list flex flex-col absolute z-50 bg-white border-2 border-purple-200 rounded-xl shadow-2xl p-3 w-64 sm:w-80 bottom-full left-0 transform -translate-y-3 transition-all duration-300 ease-in-out animate-fade-in">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm sm:text-base font-bold text-purple-600">Công việc ngày {day}</span>
                                  <button
                                    onClick={handleCloseTaskList}
                                    className="text-gray-500 hover:text-purple-600 transition-colors duration-200"
                                    aria-label="Đóng danh sách công việc"
                                  >
                                    <CloseOutlined className="text-sm" />
                                  </button>
                                </div>
                                {todosForDay.map((todo, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-purple-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                                  >
                                    <button
                                      onClick={() => handleNoteClick(todo.noteId)}
                                      className="text-left text-gray-700 font-medium flex-1 hover:text-purple-600 transition-colors duration-200 text-sm sm:text-base"
                                    >
                                      {todo.noteTitle}
                                    </button>
                                    {sentEmails[todo.todoId] && (
                                      <span
                                        className="text-xs text-green-500"
                                        title={`Thông báo đã gửi qua email: ${sentEmails[todo.todoId].content}`}
                                      >
                                        <MailOutlined />
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                )}
                {viewMode === "week" && <WeekView />}
                {viewMode === "day" && <DayView />}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-end items-center gap-2 mb-4">
              <button
                onClick={handleToday}
                className="bg-gradient-to-r from-purple-200 to-blue-200 text-purple-600 font-bold px-4 py-2 rounded-xl border-2 border-purple-200 shadow-md hover:bg-gradient-to-r hover:from-purple-300 hover:to-blue-300 hover:text-purple-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                aria-label="Hôm nay"
              >
                <span className="text-base">⟲</span>
              </button>
              <button
                onClick={exportCalendar}
                className="bg-gradient-to-r from-purple-200 to-blue-200 text-purple-600 font-bold px-4 py-2 rounded-xl border-2 border-purple-200 shadow-md hover:bg-gradient-to-r hover:from-purple-300 hover:to-blue-300 hover:text-purple-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Xuất lịch
              </button>
              <button
                onClick={syncCalendar}
                className="bg-gradient-to-r from-purple-200 to-blue-200 text-purple-600 font-bold px-4 py-2 rounded-xl border-2 border-purple-200 shadow-md hover:bg-gradient-to-r hover:from-purple-300 hover:to-blue-300 hover:text-purple-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Đồng bộ
              </button>
              <img
                src="https://i.pinimg.com/originals/a1/29/2a/a1292ab2302cc3f2120a66c8f252315c.gif"
                alt="Panda"
                className="w-20 sm:w-24 h-20 sm:h-24 transform hover:scale-110 transition-transform duration-300"
              />
            </div>

            <div className="mt-6 bg-white rounded-xl shadow-md p-4 relative">
              <div className="flex justify-between items-center bg-[#D1C4E9] text-gray-800 rounded-lg p-2 mb-4">
                <h3 className="text-lg font-bold uppercase">LỊCH VẠN NIÊN</h3>
                <button
                  onClick={handleQuickView}
                  className="bg-gradient-to-r from-purple-200 to-blue-200 text-purple-600 font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1 hover:bg-gradient-to-r hover:from-purple-300 hover:to-blue-300 hover:text-purple-700 transition-all duration-300"
                >
                  <CalendarOutlined />
                  Xem nhanh theo ngày
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 relative">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-800">Dương Lịch</h3>
                  <div className="flex items-center justify-center mt-2">
                    <button
                      onClick={handlePrevDay}
                      className="bg-gray-200 text-gray-600 font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                      aria-label="Ngày trước"
                    >
                      <LeftOutlined className="text-sm" />
                    </button>
                    <p className="text-5xl font-bold text-gray-800 mx-4">
                      {selectedDay || today.getDate()}
                    </p>
                    <button
                      onClick={handleNextDay}
                      className="bg-gray-200 text-gray-600 font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                      aria-label="Ngày sau"
                    >
                      <RightOutlined className="text-sm" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatSolarDate(
                      selectedDay || today.getDate(),
                      currentMonth,
                      currentYear
                    )}
                  </p>
                </div>
                <div className="absolute left-1/2 top-0 bottom-0 border-l border-gray-300 transform -translate-x-1/2"></div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-800">Âm Lịch</h3>
                  <div className="flex items-center justify-center mt-2">
                    <button
                      onClick={handlePrevDay}
                      className="bg-gray-200 text-gray-600 font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                      aria-label="Ngày trước"
                    >
                      <LeftOutlined className="text-sm" />
                    </button>
                    <p className="text-5xl font-bold text-gray-800 mx-4">
                      {getLunarDay(
                        selectedDay || today.getDate(),
                        currentMonth,
                        currentYear
                      )}
                    </p>
                    <button
                      onClick={handleNextDay}
                      className="bg-gray-200 text-gray-600 font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                      aria-label="Ngày sau"
                    >
                      <RightOutlined className="text-sm" />
                    </button>
                  </div>
                  <p className="text-sm text-red-600 mt-1 whitespace-pre-line">
                    {formatLunarDate(
                      selectedDay || today.getDate(),
                      currentMonth,
                      currentYear
                    )}
                  </p>
                </div>
              </div>

              <hr className="border-t border-gray-300 my-4" />
              <div className="text-center">
                <p className="text-base text-gray-700">Chúc bạn một ngày tốt lành</p>
                <p className="text-sm text-purple-600 mt-1">{suggestFreeTime()}</p>
              </div>
              <hr className="border-t border-gray-300 mt-4" />
            </div>

            <Notifications
              sentEmails={sentEmails}
              todos={todos}
              showNotifications={showNotifications}
              toggleNotifications={toggleNotifications}
            />

            {viewDetailNoteId && (
              <ChiTiet
                noteId={viewDetailNoteId}
                onClose={() => setViewDetailNoteId(null)}
              />
            )}
          </div>
        </motion.div>
        <ThemeSettings />
      </div>
    </div>
  );
};

export default CalendarPage;