import Link from "next/link";

export default function NotePreview({ note }) {
  return (
    <div className="border p-4 rounded-lg shadow bg-white">
      <h2 className="text-lg font-semibold">{note.title}</h2>
      <p className="text-gray-600">{note.content.slice(0, 50)}...</p>
      <p className="text-sm text-gray-400">Ngày tạo: {new Date(note.createdAt).toLocaleDateString()}</p>

      <div className="mt-3">
        <Link href={`/manage_note/${note.id}`} className="text-blue-500">
          Xem chi tiết →
        </Link>
      </div>
    </div>
  );
}
