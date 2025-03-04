import Link from "next/link";
import NotePreview from "./NotePreview";
import { fetchNotes } from "@/app/api/notes";

export default async function HomePage() {
  const notes = await fetchNotes(); // Lấy danh sách ghi chú từ API

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Tiêu đề chính */}
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Chào mừng đến với Smart Notes 📒
      </h1>

      {/* Điều hướng */}
      <div className="flex justify-center gap-4 mb-6">
        <Link href="/manage_note" className="bg-blue-500 text-white px-4 py-2 rounded shadow">
          Quản lý ghi chú
        </Link>
        <Link href="/create_notes" className="bg-green-500 text-white px-4 py-2 rounded shadow">
          Tạo ghi chú mới
        </Link>
        <Link href="/search_notes" className="bg-yellow-500 text-white px-4 py-2 rounded shadow">
          Tìm kiếm
        </Link>
        <Link href="/report" className="bg-red-500 text-white px-4 py-2 rounded shadow">
          Báo cáo
        </Link>
      </div>

      {/* Danh sách ghi chú mới nhất */}
      <h2 className="text-xl font-semibold text-gray-700 mb-3">📌 Ghi chú mới nhất</h2>
      {notes.length === 0 ? (
        <p className="text-gray-500">Không có ghi chú nào.</p>
      ) : (
        <div className="grid gap-4">
          {notes.slice(0, 3).map((note) => (
            <NotePreview key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
