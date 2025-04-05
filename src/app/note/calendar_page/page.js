"use client";
import { useState, useEffect } from "react";
import "../../globals.css";
import { supabase2 } from "../../../lib/supabase";
import ChiTiet from "../../components/details"; // Import ChiTiet để hiển thị modal
import { MailOutlined } from "@ant-design/icons"; // Thêm biểu tượng email từ Ant Design

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [todos, setTodos] = useState([]);
  const [viewDetailNoteId, setViewDetailNoteId] = useState(null); // Trạng thái để hiển thị chi tiết ghi chú
  const [userEmail, setUserEmail] = useState(""); // Lưu email người dùng
  const [sentEmails, setSentEmails] = useState({}); // Lưu trạng thái email đã gửi: { todoId: { status: boolean, content: string } }
  const [showNotifications, setShowNotifications] = useState(false); // Trạng thái hiển thị danh sách thông báo

  // Hàm lấy dữ liệu todos từ Supabase
  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase2
        .from("notess")
        .select("id, title, todos") // Lấy id, title và todos
        .eq("note_type", "whiteboard");
      if (error) throw error;

      // Phân tích todos từ tất cả các ghi chú whiteboard
      const allTodos = data
        .filter((note) => note.todos) // Lọc các ghi chú có todos
        .flatMap((note) => {
          try {
            const parsedTodos = JSON.parse(note.todos);
            return Array.isArray(parsedTodos)
              ? parsedTodos.map((todo, index) => ({
                  ...todo,
                  todoId: `${note.id}-${index}`, // Tạo ID duy nhất cho mỗi todo
                  noteId: note.id, // Thêm noteId để liên kết với ghi chú
                  noteTitle: note.title, // Thêm title để hiển thị
                }))
              : [];
          } catch (e) {
            console.error("Error parsing todos:", e);
            return [];
          }
        })
        .filter((todo) => todo.reminder); // Chỉ giữ lại các todo có reminder

      setTodos(allTodos);
    } catch (err) {
      console.error("Error fetching todos:", err);
    }
  };

  // Lấy email người dùng từ localStorage
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUserEmail(userData.email || ""); // Lấy email từ userData
    }
    fetchTodos();
  }, []);

  // Hàm giả lập gửi email nhắc nhở
  const sendEmailReminder = (todo) => {
    if (!userEmail) {
      console.error("No user email found for sending reminder.");
      return;
    }

    const reminderDate = new Date(todo.reminder);
    const content = `Nhắc nhở công việc: ${todo.text || todo.noteTitle}\nNgày: ${reminderDate.toLocaleDateString()}\nThời gian: ${reminderDate.toLocaleTimeString()}`;

    // Giả lập gửi email (không gọi API thực tế)
    console.log(`[Giả lập] Email sent to ${userEmail}: ${content}`);
    setSentEmails((prev) => ({
      ...prev,
      [todo.todoId]: { status: true, content }, // Giả lập trạng thái gửi thành công
    }));
  };

  // Kiểm tra và gửi email nhắc nhở khi đến thời gian
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      todos.forEach((todo) => {
        const reminderDate = new Date(todo.reminder);
        // Kiểm tra nếu thời gian hiện tại đã đến thời gian nhắc nhở và email chưa được gửi
        if (
          now >= reminderDate &&
          (!sentEmails[todo.todoId] || !sentEmails[todo.todoId].status)
        ) {
          sendEmailReminder(todo);
        }
      });
    }, 60000); // Kiểm tra mỗi phút

    return () => clearInterval(interval); // Dọn dẹp interval khi component unmount
  }, [todos, sentEmails]);

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

  // Hàm kiểm tra xem ngày có công việc nào không
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

  // Hàm hiển thị chi tiết ghi chú
  const handleNoteClick = (noteId) => {
    setViewDetailNoteId(noteId); // Hiển thị modal chi tiết bằng cách cập nhật trạng thái
  };

  // Hàm toggle hiển thị danh sách thông báo
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <div className="mt-[97px] p-5 mb-[-7px] container mx-auto p-5 relative bg-white rounded-xl shadow-lg">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse">
        BlogNote - Trang lịch
      </h1>
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
          <div
            key={day}
            className="font-bold text-lg text-purple-600 bg-purple-50 p-2 rounded-lg shadow-sm"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-4 relative">
        {/* Các ngày trong tháng */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const todosForDay = getTodosForDay(day);
          return (
            <div
              key={i}
              className="bg-white border-2 border-purple-100 p-6 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer group relative z-10"
            >
              <span className="text-lg font-bold text-gray-700 group-hover:text-purple-600">
                {day}
              </span>
              {todosForDay.length > 0 && (
                <div className="absolute top-1 right-1 flex items-center space-x-1">
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {todosForDay.length}
                  </span>
                  {/* Hiển thị biểu tượng email nếu có email đã gửi */}
                  {todosForDay.some((todo) => sentEmails[todo.todoId]?.status) && (
                    <MailOutlined className="text-green-500" title="Thông báo đã gửi qua email" />
                  )}
                </div>
              )}
              {todosForDay.length > 0 && (
                <div className="hidden group-hover:flex flex-col absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 mb-2 w-64 bottom-full left-0 transform -translate-y-1">
                  {todosForDay.map((todo, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <button
                        onClick={() => handleNoteClick(todo.noteId)}
                        className="text-left text-gray-700 hover:bg-gray-100 p-1 rounded transition-colors duration-200 flex-1"
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
            </div>
          );
        })}
      </div>

      {/* Biểu tượng thông báo ở góc phải màn hình */}
      <div className="fixed top-20 right-5 z-50">
        <button
          onClick={toggleNotifications}
          className="relative bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <MailOutlined className="text-2xl text-blue-500" />
          {/* Hiển thị số lượng thông báo chưa đọc (nếu có) */}
          {Object.keys(sentEmails).length > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
              {Object.keys(sentEmails).length}
            </span>
          )}
        </button>

        {/* Danh sách thông báo */}
        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Thông báo Email</h3>
            {Object.keys(sentEmails).length === 0 ? (
              <p className="text-gray-500">Chưa có thông báo nào.</p>
            ) : (
              Object.entries(sentEmails).map(([todoId, emailInfo]) => (
                <div
                  key={todoId}
                  className="p-2 mb-2 border-b border-gray-200 last:border-b-0"
                >
                  <p className="text-sm text-gray-700">{emailInfo.content}</p>
                  <p className="text-xs text-green-500 mt-1">
                    {emailInfo.status ? "Đã gửi thành công" : "Gửi thất bại"}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Animated Panda Icon */}
      <img
        src="https://i.pinimg.com/originals/a1/29/2a/a1292ab2302cc3f2120a66c8f252315c.gif"
        alt="Panda"
        className="absolute bottom-3 right-5 w-24 h-24 transform hover:scale-110 transition-transform duration-300"
      />

      {/* Modal hiển thị chi tiết ghi chú */}
      {viewDetailNoteId && (
        <ChiTiet
          noteId={viewDetailNoteId}
          onClose={() => setViewDetailNoteId(null)}
        />
      )}
    </div>
  );
};

export default CalendarPage;