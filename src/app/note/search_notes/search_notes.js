import { useState } from "react";

export default function SearchNotes() {
  const [search, setSearch] = useState("");

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🔍 Tìm kiếm Ghi Chú</h1>
      <input
        type="text"
        placeholder="Nhập từ khóa..."
        className="w-full px-4 py-2 border rounded-md"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="mt-4">
        {search ? <p>🔎 Kết quả tìm kiếm cho: <strong>{search}</strong></p> : <p>Nhập từ khóa để tìm...</p>}
      </div>
    </div>
  );
}
