"use client";
import { useState, useEffect } from "react";
import { supabase2 } from "../../../lib/supabase";

export default function ManageNotes() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [notes, setNotes] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  
  const categories = ["personal", "study", "entertainment", "upload"];
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
            updated_at: new Date().toISOString()
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
      navigator.share({
        title: note.title,
        text: shareText,
        url: window.location.href,
      }).catch(err => console.error("Error sharing:", err));
    } else {
      navigator.clipboard.writeText(shareText)
        .then(() => alert("Note content copied to clipboard!"))
        .catch(err => {
          console.error("Error copying to clipboard:", err);
          alert("Failed to copy note content");
        });
    }
  };

  // Download function
  const handleDownload = (note) => {
    let content = `${note.title}\n\n${note.content}\n\nCategory: ${note.category}`;
    
    if (note.note_type === "whiteboard" && note.todos?.length) {
      content += "\n\nTodos:\n" + note.todos.map(todo => 
        `- [${todo.completed ? 'x' : ' '}] ${todo.text}`
      ).join("\n");
    }
    
    if (note.note_type === "spreadsheet" && note.spreadsheet_data?.length) {
      content += "\n\nSpreadsheet Data:\n" + 
        note.spreadsheet_data.map(row => row.join("\t")).join("\n");
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
    setSelectedCategory(category);
  };

  const filteredNotes = selectedCategory
    ? notes.filter((note) => note.category === selectedCategory)
    : [];

  return (
    <div className="mt-[96px] p-5 max-w-8xl mx-auto border-2 border-gray-300 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">🛠️ Quản lý Ghi Chú</h1>

      <div className="grid grid-cols-4 gap-4">
        {categories.map((category) => (
          <div
            key={category}
            className={`p-4 shadow-lg rounded-lg border cursor-pointer transition-transform duration-300 hover:scale-110 hover:shadow-xl ${
              category === "personal"
                ? "bg-gradient-to-r from-blue-200 to-blue-300"
                : category === "study"
                ? "bg-gradient-to-r from-green-200 to-green-300"
                : category === "entertainment"
                ? "bg-gradient-to-r from-purple-200 to-purple-300"
                : "bg-gradient-to-r from-yellow-200 to-yellow-300"
            }`}
            onClick={() => handleCategoryClick(category)}
          >
            <h3 className="font-semibold text-black">
              📒 {category.charAt(0).toUpperCase() + category.slice(1)}
            </h3>
          </div>
        ))}
      </div>

      {selectedCategory && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4 text-left">
            📌 Ghi chú -{" "}
            {selectedCategory.charAt(0).toUpperCase() +
              selectedCategory.slice(1)}
          </h2>

          {/* Plain Notes */}
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4 text-left">
              Ghi chú văn bản thuần
            </h2>
            <div className="flex flex-col gap-4">
              {filteredNotes
                .filter(
                  (note) => !note.image_url && note.note_type === "plain"
                )
                .map((note) => (
                  <div
                    key={note.id}
                    className="border border-gray-300 rounded-lg p-4 relative shadow-sm"
                  >
                    <h3 className="font-semibold">{note.title}</h3>
                    <p className="text-gray-500">{note.content}</p>
                    <a href="#" className="text-blue-500 hover:underline">
                      Xem chi tiết →
                    </a>
                    <div className="flex gap-2 mt-3 justify-end">
                      <button 
                        onClick={() => handleEdit(note)}
                        className="px-3 py-1 text-sm bg-blue-300 text-white rounded transition-all duration-300 hover:bg-gray-300 hover:text-black hover:shadow-md"
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleDelete(note.id)}
                        className="px-3 py-1 text-sm bg-purple-300 text-white rounded transition-all duration-300 hover:bg-gray-300 hover:text-black hover:shadow-md"
                      >
                        Xóa
                      </button>
                      <button 
                        onClick={() => handleShare(note)}
                        className="px-3 py-1 text-sm bg-green-300 text-white rounded transition-all duration-300 hover:bg-gray-300 hover:text-black hover:shadow-md"
                      >
                        Chia sẻ
                      </button>
                      <button 
                        onClick={() => handleDownload(note)}
                        className="px-3 py-1 text-sm bg-yellow-300 text-white rounded transition-all duration-300 hover:bg-gray-300 hover:text-black hover:shadow-md"
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
            <h2 className="text-xl font-bold mb-4 text-left">
              Ghi chú văn bản phong phú
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredNotes
                .filter((note) => note.image_url && note.note_type === "rich")
                .map((note) => (
                  <div
                    key={note.id}
                    className="bg-white p-4 shadow-md rounded-lg border transition-transform duration-300 hover:shadow-lg transform hover:-translate-y-1"
                  >
                    <img
                      src={note.image_url}
                      alt={note.title}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                    <h3 className="font-semibold">{note.title}</h3>
                    <p className="text-gray-500">{note.content}</p>
                    <a href="#" className="text-blue-500 hover:underline">
                      Xem chi tiết →
                    </a>
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => handleEdit(note)}
                        className="flex-1 px-4 py-1 bg-blue-300 text-white rounded transition-transform duration-300 hover:scale-105"
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleDelete(note.id)}
                        className="flex-1 px-4 py-1 bg-purple-300 text-white rounded transition-transform duration-300 hover:scale-105"
                      >
                        Xóa
                      </button>
                      <button 
                        onClick={() => handleShare(note)}
                        className="flex-1 px-4 py-1 bg-green-300 text-white rounded transition-transform duration-300 hover:scale-105"
                      >
                        Chia sẻ
                      </button>
                      <button 
                        onClick={() => handleDownload(note)}
                        className="flex-1 px-4 py-1 bg-yellow-300 text-white rounded transition-transform duration-300 hover:scale-105"
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
            <h2 className="text-xl font-bold mb-4 text-left">
              Ghi chú danh sách công việc
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredNotes
                .filter((note) => note.note_type === "whiteboard")
                .map((note) => (
                  <div
                    key={note.id}
                    className="bg-white p-4 shadow-md rounded-lg border transition-transform duration-300 hover:shadow-lg transform hover:-translate-y-1"
                  >
                    <h3 className="font-semibold">📝 {note.title}</h3>
                    <p>{note.content}</p>
                    {note.todos && note.todos.length > 0 && (
                      <ul className="list-disc pl-5">
                        {note.todos.map((todo, index) => (
                          <li
                            key={index}
                            className={
                              todo.completed
                                ? "line-through text-gray-500"
                                : ""
                            }
                          >
                            {todo.text}
                          </li>
                        ))}
                      </ul>
                    )}
                    <a href="#" className="text-blue-500 hover:underline">
                      Xem chi tiết công việc →
                    </a>
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => handleEdit(note)}
                        className="flex-1 px-4 py-1 bg-blue-300 text-white rounded transition-transform duration-300 hover:scale-105"
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleDelete(note.id)}
                        className="flex-1 px-4 py-1 bg-purple-300 text-white rounded transition-transform duration-300 hover:scale-105"
                      >
                        Xóa
                      </button>
                      <button 
                        onClick={() => handleShare(note)}
                        className="flex-1 px-4 py-1 bg-green-300 text-white rounded transition-transform duration-300 hover:scale-105"
                      >
                        Chia sẻ
                      </button>
                      <button 
                        onClick={() => handleDownload(note)}
                        className="flex-1 px-4 py-1 bg-yellow-300 text-white rounded transition-transform duration-300 hover:scale-105"
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
            <h2 className="text-xl font-bold mb-4 text-left">
              Ghi chú bảng tính
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredNotes
                .filter((note) => note.note_type === "spreadsheet")
                .map((note) => (
                  <div
                    key={note.id}
                    className="bg-white p-4 shadow-md rounded-lg border transition-transform duration-300 hover:shadow-lg transform hover:-translate-y-1"
                  >
                    <h3 className="font-semibold">📊 {note.title}</h3>
                    <p>{note.content}</p>
                    {note.spreadsheet_data && note.spreadsheet_data.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="border-collapse border border-gray-300 text-sm">
                          <tbody>
                            {note.spreadsheet_data
                              .slice(0, 3)
                              .map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                  {row.slice(0, 3).map((cell, colIndex) => (
                                    <td
                                      key={colIndex}
                                      className="border border-gray-300 p-1"
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        <small>
                          (Hiển thị 3x3, tổng {note.spreadsheet_data.length}x
                          {note.spreadsheet_data[0]?.length || 0})
                        </small>
                      </div>
                    )}
                    <a href="#" className="text-blue-500 hover:underline">
                      Đi đến bảng →
                    </a>
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => handleEdit(note)}
                        className="flex-1 px-4 py-1 bg-blue-300 text-white rounded transition-transform duration-300 hover:scale-105"
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleDelete(note.id)}
                        className="flex-1 px-4 py-1 bg-purple-300 text-white rounded transition-transform duration-300 hover:scale-105"
                      >
                        Xóa
                      </button>
                      <button 
                        onClick={() => handleShare(note)}
                        className="flex-1 px-4 py-1 bg-green-300 text-white rounded transition-transform duration-300 hover:scale-105"
                      >
                        Chia sẻ
                      </button>
                      <button 
                        onClick={() => handleDownload(note)}
                        className="flex-1 px-4 py-1 bg-yellow-300 text-white rounded transition-transform duration-300 hover:scale-105"
                      >
                        Tải xuống
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}