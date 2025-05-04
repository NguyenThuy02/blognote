import { useEffect, useState } from "react";
import { MailOutlined } from "@ant-design/icons";

const Notifications = ({ sentEmails, todos, showNotifications, toggleNotifications }) => {
  const [reminderNotifications, setReminderNotifications] = useState([]);

  // Calculate days until due date
  const getDaysUntilDue = (reminderDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for comparison
    const dueDate = new Date(reminderDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Generate reminder notifications
  useEffect(() => {
    const reminders = todos
      .filter((todo) => todo.reminder)
      .map((todo) => {
        const daysUntilDue = getDaysUntilDue(todo.reminder);
        let message = "";
        if (daysUntilDue === 4) {
          message = `Ghi chú ${todo.noteTitle} còn 4 ngày nữa là đến hạn`;
        } else if (daysUntilDue === 3) {
          message = `Ghi chú ${todo.noteTitle} còn 3 ngày nữa là hết hạn`;
        } else if (daysUntilDue === 1) {
          message = `Ghi chú ${todo.noteTitle} mai đến hạn rùi kìa`;
        }
        return daysUntilDue >= 1 && daysUntilDue <= 4 ? { id: todo.todoId, message } : null;
      })
      .filter((reminder) => reminder !== null);

    setReminderNotifications(reminders);
  }, [todos]);

  // Combine sent emails and reminders for display
  const allNotifications = [
    ...Object.entries(sentEmails).map(([todoId, emailInfo]) => ({
      id: todoId,
      message: emailInfo.content,
      status: emailInfo.status ? "Đã gửi thành công" : "Gửi thất bại",
      type: "email",
    })),
    ...reminderNotifications.map((reminder) => ({
      id: reminder.id,
      message: reminder.message,
      status: "Nhắc nhở",
      type: "reminder",
    })),
  ];

  return (
    <div className="fixed top-28 right-5 z-50">
      <button
        onClick={toggleNotifications}
        className="relative p-3 rounded-full shadow-lg hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100 hover:border-purple-300 transition-all duration-300 border border-purple-100"
        style={{ backgroundColor: 'var(--background, #FFFFFF)' }}
      >
        <MailOutlined className="text-2xl text-blue-500" />
        {allNotifications.length > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
            {allNotifications.length}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-3 w-80 border-2 border-purple-100 rounded-xl shadow-2xl p-4 max-h-96 overflow-y-auto" style={{ backgroundColor: 'var(--background, #FFFFFF)' }}>
          <h3 className="text-lg font-bold text-gray-800 mb-3">Thông báo</h3>
          {allNotifications.length === 0 ? (
            <p className="text-gray-500">Chưa có thông báo nào.</p>
          ) : (
            allNotifications.map((notification) => (
              <div
                key={notification.id}
                className="p-3 mb-2 border-b border-gray-100 last:border-b-0 hover:bg-purple-50 transition-colors duration-200 rounded-lg"
              >
                <p className="text-sm text-gray-700">{notification.message}</p>
                <p
                  className={`text-xs mt-1 ${
                    notification.type === "email"
                      ? notification.status === "Đã gửi thành công"
                        ? "text-green-500"
                        : "text-red-500"
                      : "text-blue-500"
                  }`}
                >
                  {notification.status}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;