import { useState } from "react";

export default function CreateNote() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">➕ Tạo Ghi Chú</h1>
      <input
        type="text"
        placeholder="Tiêu đề ghi chú"
        className="w-full px-4 py-2 border rounded-md mb-4"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Nội dung ghi chú..."
        className="w-full px-4 py-2 border rounded-md h-40"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      ></textarea>
      <button className="mt-4 px-6 py-2 bg-blue-500 text-white rounded">
        Lưu ghi chú
      </button>
    </div>
  );
}
