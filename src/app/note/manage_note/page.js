"use client";
import { useState, useEffect } from "react";
import { supabase2 } from "../../../lib/supabase";
import ChiTiet from "../../components/details"; // Import component xem chi tiết
import ThemeSettings from "../../components/ThemeSettings"; // Import ThemeSettings

export default function ManageNotes() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [notes, setNotes] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [viewDetailNoteId, setViewDetailNoteId] = useState(null); // Trạng thái để hiển thị chi tiết ghi chú
  const [pinnedNotes, setPinnedNotes] = useState(new Set()); // Trạng thái để theo dõi ghi chú đã ghim
  const [categories, setCategories] = useState(["personal", "study", "entertainment", "upload"]); // Quản lý danh sách categories động
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Trạng thái để điều khiển menu ba chấm

  const categoryMap = {
    1: "personal",
    2: "study",
    3: "entertainment",
    4: "upload",
  };

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase2
        .from("notess")
        .select(
          "id, title, content, image_url, created_at, updated_at, category_id, note_type, todos, spreadsheet_data"
        )
        .order("updated_at", { ascending: false });

      if (error) throw error;

      setNotes(
        data.map((note) => {
          let parsedTodos = [];
          let parsedSpreadsheetData = Array(10)
            .fill()
            .map(() => Array(10).fill(""));

          if (note.todos) {
            try {
              parsedTodos = JSON.parse(note.todos);
              if (!Array.isArray(parsedTodos)) parsedTodos = [];
            } catch (e) {
              console.error(`Error parsing todos for note ${note.id}:`, e);
            }
          }

          if (note.spreadsheet_data) {
            try {
              parsedSpreadsheetData = JSON.parse(note.spreadsheet_data);
              if (!Array.isArray(parsedSpreadsheetData))
                parsedSpreadsheetData = Array(10)
                  .fill()
                  .map(() => Array(10).fill(""));
            } catch (e) {
              console.error(
                `Error parsing spreadsheet_data for note ${note.id}:`,
                e
              );
            }
          }

          return {
            ...note,
            todos: parsedTodos,
            spreadsheet_data: parsedSpreadsheetData,
            category: categoryMap[note.category_id] || "personal",
          };
        }) || []
      );
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Hàm ghim/bỏ ghim ghi chú
  const togglePin = (noteId) => {
    setPinnedNotes((prev) => {
      const newPinned = new Set(prev);
      if (newPinned.has(noteId)) {
        newPinned.delete(noteId); // Bỏ ghim
      } else {
        newPinned.add(noteId); // Ghim
      }
      return newPinned;
    });
  };

  // Edit function
  const handleEdit = async (note) => {
    const newTitle = prompt("Enter new title:", note.title);
    const newContent = prompt("Enter new content:", note.content);

    if (newTitle && newContent) {
      try {
        const { error } = await supabase2
          .from("notess")
          .update({
            title: newTitle,
            content: newContent,
            updated_at: new Date().toISOString(),
          })
          .eq("id", note.id);

        if (error) throw error;
        fetchNotes(); // Refresh notes after edit
        alert("Note updated successfully!");
      } catch (err) {
        console.error("Error updating note:", err);
        alert("Failed to update note");
      }
    }
  };

  // Delete function
  const handleDelete = async (noteId) => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        const { error } = await supabase2
          .from("notess")
          .delete()
          .eq("id", noteId);

        if (error) throw error;
        fetchNotes(); // Refresh notes after delete
        alert("Note deleted successfully!");
      } catch (err) {
        console.error("Error deleting note:", err);
        alert("Failed to delete note");
      }
    }
  };

  // Share function
  const handleShare = (note) => {
    const shareText = `${note.title}\n${note.content}\nCategory: ${note.category}`;
    if (navigator.share) {
      navigator
        .share({
          title: note.title,
          text: shareText,
          url: window.location.href,
        })
        .catch((err) => console.error("Error sharing:", err));
    } else {
      navigator.clipboard
        .writeText(shareText)
        .then(() => alert("Note content copied to clipboard!"))
        .catch((err) => {
          console.error("Error copying to clipboard:", err);
          alert("Failed to copy note content");
        });
    }
  };

  // Download function
  const handleDownload = (note) => {
    let content = `${note.title}\n\n${note.content}\n\nCategory: ${note.category}`;

    if (note.note_type === "whiteboard" && note.todos?.length) {
      content +=
        "\n\nTodos:\n" +
        note.todos
          .map((todo) => `- [${todo.completed ? "x" : " "}] ${todo.text}`)
          .join("\n");
    }

    if (note.note_type === "spreadsheet" && note.spreadsheet_data?.length) {
      content +=
        "\n\nSpreadsheet Data:\n" +
        note.spreadsheet_data.map((row) => row.join("\t")).join("\n");
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${note.title}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCategoryClick = (category) => {
    // If the clicked category is already selected, set selectedCategory to null to hide content
    // Otherwise, set it to the clicked category to show content
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  // Hàm tạo category mới
  const handleCreateCategory = () => {
    const newCategory = prompt("Nhập tên danh mục mới:");
    if (newCategory && newCategory.trim() !== "") {
      const formattedCategory = newCategory.trim().toLowerCase();
      if (categories.includes(formattedCategory)) {
        alert("Danh mục này đã tồn tại!");
      } else {
        setCategories((prev) => [...prev, formattedCategory]);
        alert(`Danh mục "${newCategory}" đã được tạo thành công!`);
      }
    } else {
      alert("Tên danh mục không được để trống!");
    }
    setIsMenuOpen(false); // Đóng menu sau khi thêm danh mục
  };

  const filteredNotes = selectedCategory
    ? notes.filter((note) => note.category === selectedCategory)
    : [];

  // Hàm sắp xếp ghi chú: Ghi chú đã ghim lên đầu
  const sortNotes = (notes) => {
    return [...notes].sort((a, b) => {
      if (pinnedNotes.has(a.id) && !pinnedNotes.has(b.id)) return -1; // Ghi chú ghim lên trước
      if (!pinnedNotes.has(a.id) && pinnedNotes.has(b.id)) return 1; // Ghi chú không ghim xuống sau
      return 0; // Giữ nguyên thứ tự nếu cả hai cùng trạng thái
    });
  };

  // Chia danh mục thành các hàng, mỗi hàng 4 danh mục
  const chunkCategories = (categories, size) => {
    const chunks = [];
    for (let i = 0; i < categories.length; i += size) {
      chunks.push(categories.slice(i, i + size));
    }
    return chunks;
  };

  const categoryRows = chunkCategories(categories, 4);

  // Component hiển thị ghi chú
  const NotesDisplay = ({ category }) => {
    return (
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4 text-left text-gray-800">
          📌 Ghi chú -{" "}
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </h2>

        {/* Plain Notes */}
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4 text-left text-gray-800">
            Ghi chú văn bản thuần
          </h2>
          <div className="flex flex-col gap-4">
            {sortNotes(
              filteredNotes.filter(
                (note) => !note.image_url && note.note_type === "plain"
              )
            ).map((note) => (
              <div
                key={note.id}
                className={`border border-[#A3BFFA] rounded-xl p-4 relative shadow-sm max-w-full flex flex-col transition-all duration-300 hover:shadow-lg hover:scale-105 hover:bg-gray-100 ${
                  pinnedNotes.has(note.id) ? "bg-[#E0E7FF]" : "bg-white"
                }`}
              >
                <div className="relative">
                  <h3 className="font-semibold inline text-gray-800">{note.title}</h3>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`absolute top-0 right-0 text-lg ${
                      pinnedNotes.has(note.id)
                        ? "text-[#A78BFA]"
                        : "text-gray-400"
                    } hover:text-[#A78BFA]`}
                    title={pinnedNotes.has(note.id) ? "Bỏ ghim" : "Ghim"}
                  >
                    📌
                  </button>
                </div>
                <p className="text-gray-600 line-clamp-2 min-h-[40px]">
                  {note.content}
                </p>
                <button
                  onClick={() => setViewDetailNoteId(note.id)}
                  className="text-[#A78BFA] mt-2 text-left"
                >
                  Xem chi tiết →
                </button>
                <div className="flex overflow-x-auto gap-2 mt-3 justify-end">
                  <button
                    onClick={() => handleEdit(note)}
                    className="min-w-[80px] px-3 py-1 text-sm bg-[#A78BFA] text-white rounded-xl transition-all duration-300 hover:bg-[#D6BCFA] hover:text-gray-800 hover:shadow-md sm:px-2 sm:text-xs"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="min-w-[80px] px-3 py-1 text-sm bg-[#A78BFA] text-white rounded-xl transition-all duration-300 hover:bg-[#D6BCFA] hover:text-gray-800 hover:shadow-md sm:px-2 sm:text-xs"
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => handleShare(note)}
                    className="min-w-[80px] px-3 py-1 text-sm bg-[#A78BFA] text-white rounded-xl transition-all duration-300 hover:bg-[#D6BCFA] hover:text-gray-800 hover:shadow-md sm:px-2 sm:text-xs"
                  >
                    Chia sẻ
                  </button>
                  <button
                    onClick={() => handleDownload(note)}
                    className="min-w-[80px] px-3 py-1 text-sm bg-[#A78BFA] text-white rounded-xl transition-all duration-300 hover:bg-[#D6BCFA] hover:text-gray-800 hover:shadow-md sm:px-2 sm:text-xs"
                  >
                    Tải xuống
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rich Notes */}
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4 text-left text-gray-800">
            Ghi chú văn bản phong phú
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortNotes(
              filteredNotes.filter(
                (note) => note.image_url && note.note_type === "rich"
              )
            ).map((note) => (
              <div
                key={note.id}
                className={`bg-white p-4 shadow-md rounded-xl border border-[#A3BFFA] transition-transform duration-300 hover:shadow-lg transform hover:-translate-y-1 max-w-full flex flex-col ${
                  pinnedNotes.has(note.id) ? "bg-[#E0E7FF]" : ""
                }`}
              >
                <div className="relative">
                  <img
                    src={note.image_url}
                    alt={note.title}
                    className="w-full h-32 object-cover rounded-xl mb-2"
                  />
                  <h3 className="font-semibold inline text-gray-800">{note.title}</h3>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`absolute top-0 right-0 text-lg ${
                      pinnedNotes.has(note.id)
                        ? "text-[#A78BFA]"
                        : "text-gray-400"
                    } hover:text-[#A78BFA]`}
                    title={pinnedNotes.has(note.id) ? "Bỏ ghim" : "Ghim"}
                  >
                    📌
                  </button>
                </div>
                <p className="text-gray-600 line-clamp-2 min-h-[40px]">
                  {note.content}
                </p>
                <button
                  onClick={() => setViewDetailNoteId(note.id)}
                  className="text-[#A78BFA] mt-2 text-left"
                >
                  Xem chi tiết →
                </button>
                <div className="flex sm:flex-wrap overflow-x-auto gap-1 mt-2">
                  <button
                    onClick={() => handleEdit(note)}
                    className="min-w-[60px] px-2 py-1 text-sm bg-[#A78BFA] text-white rounded-xl transition-all duration-300 hover:bg-[#D6BCFA] hover:text-gray-800 hover:shadow-md sm:px-1 sm:text-xs"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="min-w-[60px] px-2 py-1 text-sm bg-[#A78BFA] text-white rounded-xl transition-all duration-300 hover:bg-[#D6BCFA] hover:text-gray-800 hover:shadow-md sm:px-1 sm:text-xs"
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => handleShare(note)}
                    className="min-w-[60px] px-2 py-1 text-sm bg-[#A78BFA] text-white rounded-xl transition-all duration-300 hover:bg-[#D6BCFA] hover:text-gray-800 hover:shadow-md sm:px-1 sm:text-xs"
                  >
                    Chia sẻ
                  </button>
                  <button
                    onClick={() => handleDownload(note)}
                    className="min-w-[60px] px-2 py-1 text-sm bg-[#A78BFA] text-white rounded-xl transition-all duration-300 hover:bg-[#D6BCFA] hover:text-gray-800 hover:shadow-md sm:px-1 sm:text-xs"
                  >
                    Tải xuống
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Whiteboard Notes */}
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4 text-left text-gray-800">
            Ghi chú danh sách công việc
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortNotes(
              filteredNotes.filter((note) => note.note_type === "whiteboard")
            ).map((note) => (
              <div
                key={note.id}
                className={`bg-white p-4 shadow-md rounded-xl border border-[#A3BFFA] transition-transform duration-300 hover:shadow-lg transform hover:-translate-y-1 max-w-full flex flex-col ${
                  pinnedNotes.has(note.id) ? "bg-[#E0E7FF]" : ""
                }`}
              >
                <div className="relative">
                  <h3 className="font-semibold inline text-gray-800">📝 {note.title}</h3>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`absolute top-0 right-0 text-lg ${
                      pinnedNotes.has(note.id)
                        ? "text-[#A78BFA]"
                        : "text-gray-400"
                    } hover:text-[#A78BFA]`}
                    title={pinnedNotes.has(note.id) ? "Bỏ ghim" : "Ghim"}
                  >
                    📌
                  </button>
                </div>
                <p className="text-gray-600 line-clamp-2 min-h-[40px]">
                  {note.content}
                </p>
                {note.todos && note.todos.length > 0 && (
                  <ul className="list-disc pl-5 min-h-[60px] line-clamp-3">
                    {note.todos.map((todo, index) => (
                      <li
                        key={index}
                        className={
                          todo.completed ? "line-through text-gray-500" : ""
                        }
                      >
                        {todo.text}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={() => setViewDetailNoteId(note.id)}
                  className="text-[#A78BFA] mt-2 text-left"
                >
                  Xem chi tiết công việc →
                </button>
                <div className="flex sm:flex-wrap overflow-x-auto gap-1 mt-2">
                  <button
                    onClick={() => handleEdit(note)}
                    className="min-w-[60px] px-2 py-1 text-sm bg-[#A78BFA] text-white rounded-xl transition-all duration-300 hover:bg-[#D6BCFA] hover:text-gray-800 hover:shadow-md sm:px-1 sm:text-xs"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="min-w-[60px] px-2 py-1 text-sm bg-[#A78BFA] text-white rounded-xl transition-all duration-300 hover:bg-[#D6BCFA] hover:text-gray-800 hover:shadow-md sm:px-1 sm:text-xs"
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => handleShare(note)}
                    className="min-w-[60px] px-2 py-1 text-sm bg-[#A78BFA] text-white rounded-xl transition-all duration-300 hover:bg-[#D6BCFA] hover:text-gray-800 hover:shadow-md sm:px-1 sm:text-xs"
                  >
                    Chia sẻ
                  </button>
                  <button
                    onClick={() => handleDownload(note)}
                    className="min-w-[60px] px-2 py-1 text-sm bg-[#A78BFA] text-white rounded-xl transition-all duration-300 hover:bg-[#D6BCFA] hover:text-gray-800 hover:shadow-md sm:px-1 sm:text-xs"
                  >
                    Tải xuống
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spreadsheet Notes */}
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4 text-left text-gray-800">
            Ghi chú bảng tính
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortNotes(
              filteredNotes.filter((note) => note.note_type === "spreadsheet")
            ).map((note) => (
              <div
                key={note.id}
                className={`bg-white p-4 shadow-md rounded-xl border border-[#A3BFFA] transition-transform duration-300 hover:shadow-lg transform hover:-translate-y-1 max-w-full flex flex-col ${
                  pinnedNotes.has(note.id) ? "bg-[#E0E7FF]" : ""
                }`}
              >
                <div className="relative">
                  <h3 className="font-semibold inline text-gray-800">📊 {note.title}</h3>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`absolute top-0 right-0 text-lg ${
                      pinnedNotes.has(note.id)
                        ? "text-[#A78BFA]"
                        : "text-gray-400"
                    } hover:text-[#A78BFA]`}
                    title={pinnedNotes.has(note.id) ? "Bỏ ghim" : "Ghim"}
                  >
                    📌
                  </button>
                </div>
                <p className="text-gray-600 line-clamp-2 min-h-[40px]">
                  {note.content}
                </p>
                {note.spreadsheet_data &&
                  note.spreadsheet_data.length > 0 && (
                    <div className="overflow-x-auto min-h-[80px]">
                      <table className="border-collapse border border-[#A3BFFA] text-sm">
                        <tbody>
                          {note.spreadsheet_data
                            .slice(0, 3)
                            .map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {row.slice(0, 3).map((cell, colIndex) => (
                                  <td
                                    key={colIndex}
                                    className="border border-[#A3BFFA] p-1"
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      <small className="text-gray-600">
                        (Hiển thị 3x3, tổng {note.spreadsheet_data.length}x
                        {note.spreadsheet_data[0]?.length || 0})
                      </small>
                    </div>
                  )}
                <button
                  onClick={() => setViewDetailNoteId(note.id)}
                  className="text-[#A78BFA] mt-2 text-left"
                >
                  Đi đến bảng →
                </button>
                <div className="flex sm:flex-wrap overflow-x-auto gap-1 mt-2">
                  <button
                    onClick={() => handleEdit(note)}
                    className="min-w-[60px] px-2 py-1 text-sm bg-[#A78BFA] text-white rounded-xl transition-all duration-300 hover:bg-[#D6BCFA] hover:text-gray-800 hover:shadow-md sm:px-1 sm:text-xs"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="min-w-[60px] px-2 py-1 text-sm bg-[#A78BFA] text-white rounded-xl transition-all duration-300 hover:bg-[#D6BCFA] hover:text-gray-800 hover:shadow-md sm:px-1 sm:text-xs"
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => handleShare(note)}
                    className="min-w-[60px] px-2 py-1 text-sm bg-[#A78BFA] text-white rounded-xl transition-all duration-300 hover:bg-[#D6BCFA] hover:text-gray-800 hover:shadow-md sm:px-1 sm:text-xs"
                  >
                    Chia sẻ
                  </button>
                  <button
                    onClick={() => handleDownload(note)}
                    className="min-w-[60px] px-2 py-1 text-sm bg-[#A78BFA] text-white rounded-xl transition-all duration-300 hover:bg-[#D6BCFA] hover:text-gray-800 hover:shadow-md sm:px-1 sm:text-xs"
                  >
                    Tải xuống
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="text-gray-800 mt-[96px] p-5 max-w-8xl mx-auto border-2 border-[#A3BFFA] rounded-xl shadow-lg bg-white">
      {/* Main Header */}
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">
        🛠️ Quản lý Ghi Chú
      </h1>

      {/* Categories Section - First Row and Menu */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">📂 Danh Mục Ghi Chú</h2>
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-800 hover:bg-gray-200 rounded-full transition-all duration-300"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v.01M12 12v.01M12 18v.01"
                />
              </svg>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <ul className="py-2">
                  <li
                    onClick={handleCreateCategory}
                    className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-lg">➕</span> Thêm Danh Mục
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Hiển thị tất cả các hàng danh mục */}
        {categoryRows.map((row, rowIndex) => (
          <div key={rowIndex} className="mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {row.map((category) => (
                <div
                  key={category}
                  className={`p-4 shadow-lg rounded-xl border border-[#A3BFFA] cursor-pointer transition-transform duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-r ${
                    selectedCategory === category
                      ? "from-[#A3BFFA] to-[#D6BCFA] border-2 border-[#7F9CF5]"
                      : "from-[#E0E7FF] to-[#E0E7FF]"
                  }`}
                  onClick={() => handleCategoryClick(category)}
                >
                  <h3 className="font-semibold text-gray-800">
                    📒 {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h3>
                </div>
              ))}
            </div>
            {/* Hiển thị ghi chú ngay dưới hàng chứa danh mục được chọn */}
            {row.includes(selectedCategory) && selectedCategory && (
              <NotesDisplay category={selectedCategory} />
            )}
          </div>
        ))}
      </div>

      {/* Modal hiển thị chi tiết ghi chú */}
      {viewDetailNoteId && (
        <ChiTiet
          noteId={viewDetailNoteId}
          onClose={() => setViewDetailNoteId(null)}
        />
      )}
            <ThemeSettings />
    </div>
  );
}