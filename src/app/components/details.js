// components/details.js
import { useState, useEffect } from "react";
import { supabase2 } from "../../lib/supabase";
import Image from "next/image";
import { FaArrowLeft, FaBell, FaBellSlash } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion"; // Import framer-motion

export default function ChiTiet({ noteId, onClose }) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch chi tiết ghi chú từ Supabase
  useEffect(() => {
    if (!noteId) return;

    const fetchNote = async () => {
      try {
        const { data, error } = await supabase2
          .from("notess")
          .select(
            "id, title, content, image_url, created_at, updated_at, category_id, note_type, font_style, font_size, font_weight, font_family, text_align, text_color, background_color, todos, spreadsheet_data"
          )
          .eq("id", noteId)
          .single();

        if (error) throw error;

        if (!data) {
          setError("Không tìm thấy ghi chú.");
          setLoading(false);
          return;
        }

        // Parse todos và spreadsheet_data nếu có
        let parsedTodos = [];
        let parsedSpreadsheetData = Array(10)
          .fill()
          .map(() => Array(10).fill(""));

        if (data.todos) {
          try {
            parsedTodos = JSON.parse(data.todos);
            if (!Array.isArray(parsedTodos)) parsedTodos = [];
          } catch (e) {
            console.error(`Error parsing todos for note ${data.id}:`, e);
            parsedTodos = [];
          }
        }

        if (data.spreadsheet_data) {
          try {
            parsedSpreadsheetData = JSON.parse(data.spreadsheet_data);
            if (!Array.isArray(parsedSpreadsheetData))
              parsedSpreadsheetData = Array(10)
                .fill()
                .map(() => Array(10).fill(""));
          } catch (e) {
            console.error(
              `Error parsing spreadsheet_data for note ${data.id}:`,
              e
            );
            parsedSpreadsheetData = Array(10)
              .fill()
              .map(() => Array(10).fill(""));
          }
        }

        setNote({
          ...data,
          todos: parsedTodos,
          spreadsheet_data: parsedSpreadsheetData,
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching note:", err);
        setError(
          "Không thể tải ghi chú: " + (err.message || "Lỗi không xác định")
        );
        setLoading(false);
      }
    };

    fetchNote();
  }, [noteId]);

  // Toggle trạng thái hoàn thành của todo
  const toggleTodo = async (index) => {
    if (!note) return;

    const updatedTodos = note.todos.map((todo, i) =>
      i === index ? { ...todo, completed: !todo.completed } : todo
    );

    try {
      const { error } = await supabase2
        .from("notess")
        .update({ todos: JSON.stringify(updatedTodos) })
        .eq("id", note.id);

      if (error) throw error;

      setNote((prev) => ({ ...prev, todos: updatedTodos }));
    } catch (err) {
      console.error("Error updating todo:", err);
      setError(
        "Không thể cập nhật công việc: " + (err.message || "Lỗi không xác định")
      );
    }
  };

  // Xóa nhắc nhở của todo
  const removeReminder = async (index) => {
    if (!note) return;

    const updatedTodos = note.todos.map((todo, i) =>
      i === index ? { ...todo, reminder: null } : todo
    );

    try {
      const { error } = await supabase2
        .from("notess")
        .update({ todos: JSON.stringify(updatedTodos) })
        .eq("id", note.id);

      if (error) throw error;

      setNote((prev) => ({ ...prev, todos: updatedTodos }));
    } catch (err) {
      console.error("Error removing reminder:", err);
      setError(
        "Không thể xóa nhắc nhở: " + (err.message || "Lỗi không xác định")
      );
    }
  };

  // Animation variants cho modal
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  if (loading) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={backdropVariants}
      >
        <motion.div
          className="bg-white p-6 rounded-lg shadow-lg"
          variants={modalVariants}
        >
          <p className="text-gray-700 text-lg font-medium">Đang tải...</p>
        </motion.div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={backdropVariants}
      >
        <motion.div
          className="bg-white p-6 rounded-lg shadow-lg"
          variants={modalVariants}
        >
          <p className="text-red-500 text-lg font-medium">{error}</p>
          <motion.button
            onClick={onClose}
            className="mt-4 flex items-center mx-auto text-blue-500 font-medium hover:text-blue-600 transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft className="mr-2" /> Đóng
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  if (!note) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={backdropVariants}
      >
        <motion.div
          className="bg-white p-6 rounded-lg shadow-lg"
          variants={modalVariants}
        >
          <p className="text-gray-700 text-lg font-medium">
            Không tìm thấy ghi chú.
          </p>
          <motion.button
            onClick={onClose}
            className="mt-4 flex items-center mx-auto text-blue-500 font-medium hover:text-blue-600 transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft className="mr-2" /> Đóng
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={backdropVariants}
      >
        <motion.div
          className="bg-white p-8 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
          variants={modalVariants}
        >
          {/* Nút đóng */}
          <motion.button
            onClick={onClose}
            className="absolute top-4 left-4 text-blue-500 hover:text-blue-600 transition-colors duration-200 flex items-center text-lg font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft className="mr-2" /> Đóng
          </motion.button>

          {/* Tiêu đề ghi chú */}
          <motion.h1
            className="text-4xl font-extrabold text-gray-800 mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
          >
            {note.title}
          </motion.h1>

          {/* Thông tin thời gian */}
          <motion.p
            className="text-gray-500 mb-6 text-center text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.2, duration: 0.5 } }}
          >
            Cập nhật lần cuối: {new Date(note.updated_at).toLocaleString()}
          </motion.p>

          {/* Hiển thị nội dung dựa trên loại ghi chú */}
          {note.note_type === "plain" || note.note_type === "rich" ? (
            <motion.div
              className="border border-gray-200 rounded-lg p-6 bg-gray-50 shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.5 } }}
            >
              {/* Hiển thị hình ảnh nếu có */}
              {note.image_url && (
                <motion.div
                  className="mb-6 flex justify-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1, transition: { delay: 0.4, duration: 0.5 } }}
                >
                  <Image
                    src={note.image_url}
                    alt={note.title}
                    width={600}
                    height={400}
                    className="object-contain rounded-lg shadow-sm"
                  />
                </motion.div>
              )}

              {/* Nội dung văn bản */}
              <motion.div
                className="prose max-w-none"
                style={{
                  fontFamily: note.font_family || "Verdana",
                  fontSize: note.font_size || "16px",
                  fontWeight: note.font_weight || "normal",
                  fontStyle: note.font_style || "normal",
                  textAlign: note.text_align || "left",
                  color: note.text_color || "#1f2937",
                  backgroundColor: note.background_color || "#f9fafb",
                  padding: "1.5rem",
                  borderRadius: "0.75rem",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.5, duration: 0.5 } }}
              >
                {note.content ? (
                  <p>{note.content}</p>
                ) : (
                  <p className="text-gray-500 italic">Không có nội dung.</p>
                )}
              </motion.div>
            </motion.div>
          ) : note.note_type === "whiteboard" ? (
            <motion.div
              className="border border-gray-200 rounded-lg p-6 bg-gray-50 shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.5 } }}
            >
              {/* Hiển thị hình ảnh nếu có */}
              {note.image_url && (
                <motion.div
                  className="mb-6 flex justify-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1, transition: { delay: 0.4, duration: 0.5 } }}
                >
                  <Image
                    src={note.image_url}
                    alt={note.title}
                    width={600}
                    height={400}
                    className="object-contain rounded-lg shadow-sm"
                  />
                </motion.div>
              )}

              {/* Danh sách công việc */}
              <motion.h2
                className="text-2xl font-bold mb-4 text-gray-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.5, duration: 0.5 } }}
              >
                Danh sách công việc
              </motion.h2>
              {note.todos && note.todos.length > 0 ? (
                <ul className="space-y-4">
                  {note.todos.map((todo, index) => (
                    <motion.li
                      key={index}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: 0.6 + index * 0.1, duration: 0.4 } }}
                    >
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(index)}
                        className="w-5 h-5 text-blue-500 rounded focus:ring-blue-300"
                      />
                      <span
                        className={`flex-1 ${
                          todo.completed ? "line-through text-gray-400" : "text-gray-700"
                        }`}
                        style={{
                          fontFamily: note.font_family || "Verdana",
                          fontSize: note.font_size || "16px",
                          fontWeight: note.font_weight || "normal",
                          fontStyle: note.font_style || "normal",
                          textAlign: note.text_align || "left",
                          color: note.text_color || "#1f2937",
                        }}
                      >
                        {todo.text}
                      </span>
                      {todo.reminder && (
                        <small className="ml-2 text-gray-500 flex items-center">
                          <FaBell className="mr-1 text-yellow-500" /> (Nhắc nhở:{" "}
                          {new Date(todo.reminder).toLocaleString()})
                          {!todo.completed && (
                            <motion.button
                              onClick={() => removeReminder(index)}
                              className="ml-2 text-red-500 hover:text-red-600 transition-colors duration-200"
                              title="Tắt nhắc nhở"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <FaBellSlash />
                            </motion.button>
                          )}
                        </small>
                      )}
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <motion.p
                  className="text-gray-500 italic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.6, duration: 0.5 } }}
                >
                  Không có công việc nào.
                </motion.p>
              )}
            </motion.div>
          ) : note.note_type === "spreadsheet" ? (
            <motion.div
              className="border border-gray-200 rounded-lg p-6 bg-gray-50 shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.5 } }}
            >
              <motion.h2
                className="text-2xl font-bold mb-4 text-gray-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.4, duration: 0.5 } }}
              >
                Bảng tính
              </motion.h2>
              {note.spreadsheet_data && note.spreadsheet_data.length > 0 ? (
                <motion.div
                  className="overflow-x-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.5, duration: 0.5 } }}
                >
                  <table className="border-collapse border border-gray-200 w-full">
                    <thead>
                      <tr>
                        <th className="border border-gray-200 p-3 bg-gray-100 font-semibold text-gray-700 w-12">
                          #
                        </th>
                        {note.spreadsheet_data[0].map((_, colIndex) => (
                          <th
                            key={colIndex}
                            className="border border-gray-200 p-3 bg-gray-100 font-semibold text-gray-700 w-24"
                          >
                            {String.fromCharCode(65 + colIndex)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {note.spreadsheet_data.map((row, rowIndex) => (
                        <motion.tr
                          key={rowIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0, transition: { delay: 0.6 + rowIndex * 0.05, duration: 0.3 } }}
                        >
                          <td className="border border-gray-200 p-3 bg-gray-100 font-semibold text-gray-700 text-center">
                            {rowIndex + 1}
                          </td>
                          {row.map((cell, colIndex) => (
                            <td
                              key={colIndex}
                              className="border border-gray-200 p-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                              style={{
                                fontFamily: note.font_family || "Verdana",
                                fontSize: note.font_size || "14px",
                                fontWeight: note.font_weight || "normal",
                                fontStyle: note.font_style || "normal",
                                textAlign: note.text_align || "left",
                                color: note.text_color || "#1f2937",
                                backgroundColor: note.background_color || "#ffffff",
                              }}
                            >
                              {cell || ""}
                            </td>
                          ))}
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              ) : (
                <motion.p
                  className="text-gray-500 italic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.5, duration: 0.5 } }}
                >
                  Không có dữ liệu bảng tính.
                </motion.p>
              )}
            </motion.div>
          ) : (
            <motion.p
              className="text-gray-500 italic text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.3, duration: 0.5 } }}
            >
              Loại ghi chú không được hỗ trợ.
            </motion.p>
          )}

          {/* Hiển thị lỗi nếu có */}
          {error && (
            <motion.p
              className="text-red-500 mt-6 text-center font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.6, duration: 0.5 } }}
            >
              {error}
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}