"use client";
import { useState, useEffect } from "react";

export default function SearchNotes() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [filteredNotes, setFilteredNotes] = useState([]);
  const categories = ["Tất cả", "Công việc", "Cá nhân", "Học tập", "Khác"];

  // Giả lập dữ liệu ghi chú
  const notes = [
    { id: 1, title: "Ghi chú công việc 1", category: "Công việc" },
    { id: 2, title: "Ghi chú cá nhân 1", category: "Cá nhân" },
    { id: 3, title: "Ghi chú học tập 1", category: "Học tập" },
    { id: 4, title: "Ghi chú công việc 2", category: "Công việc" },
    { id: 5, title: "Ghi chú cá nhân 2", category: "Cá nhân" },
    // Thêm nhiều ghi chú ở đây
  ];

  useEffect(() => {
    // Tìm kiếm ghi chú dựa trên từ khóa và danh mục
    const results = notes.filter(note => 
      (category === "Tất cả" || note.category === category) &&
      note.title.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredNotes(results);
  }, [search, category]);

  return (
    <div className="mt-[97px] p-5 mb-[-7px] max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🔍 Tìm kiếm Ghi Chú</h1>
      <input
        type="text"
        placeholder="Nhập từ khóa..."
        className="w-full px-4 py-2 border rounded-md mb-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select 
        className="w-full mb-4 px-4 py-2 border rounded-md"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
      </select>
      <div className="mt-4">
        {search ? (
          <div>
            <p>🔎 Kết quả tìm kiếm cho: <strong>{search}</strong> trong danh mục: <strong>{category}</strong></p>
            {filteredNotes.length > 0 ? (
              <ul className="list-disc list-inside">
                {filteredNotes.map(note => (
                  <li key={note.id} className="py-1">{note.title}</li>
                ))}
              </ul>
            ) : (
              <p>Không tìm thấy ghi chú nào.</p>
            )}
          </div>
        ) : (
          <p>Nhập từ khóa để tìm...</p>
        )}
      </div>
    </div>
  );
}