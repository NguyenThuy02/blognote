"use client";
import Link from "next/link";
import { useState } from "react";

export default function NoteList() {
  const [notes] = useState([
    { id: 1, title: "Ghi chú 1", description: "Mô tả ngắn gọn" },
    { id: 2, title: "Ghi chú 2", description: "Mô tả ngắn gọn" },
  ]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📌 Danh sách ghi chú</h1>
      <input
        type="text"
        placeholder="🔍 Tìm kiếm ghi chú..."
        className="w-full px-4 py-2 border rounded-md mb-4"
      />
      <div className="grid md:grid-cols-2 gap-4">
        {notes.map((note) => (
          <div key={note.id} className="bg-white p-4 shadow rounded-lg border">
            <h3 className="font-semibold">{note.title}</h3>
            <p className="text-gray-600">{note.description}</p>
            <Link href={`/note/${note.id}`} className="text-blue-500 mt-2 block">
              Xem chi tiết →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
