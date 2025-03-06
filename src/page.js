import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      {/* Logo */}
      <Image
        src="/next.svg"
        alt="Next.js logo"
        width={120}
        height={30}
        priority
      />

      {/* Tiêu đề */}
      <h1 className="text-3xl font-bold text-gray-800 mt-6">📒 Smart Notes</h1>
      <p className="text-gray-600 text-lg mt-2">
        Quản lý ghi chú thông minh và tiện lợi
      </p>

      {/* Điều hướng */}
      <div className="mt-6 flex flex-wrap gap-4">
        <Link
          href="/manage_note"
          className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
        >
          Quản lý ghi chú
        </Link>
        <Link
          href="/create_notes"
          className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600"
        >
          Tạo ghi chú mới
        </Link>
        <Link
          href="/search_notes"
          className="bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600"
        >
          Tìm kiếm
        </Link>
        <Link
          href="/report"
          className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600"
        >
          Báo cáo
        </Link>
      </div>

      {/* Thông tin hướng dẫn */}
      <ol className="mt-8 text-gray-700 text-sm list-decimal list-inside">
        <li>Chỉnh sửa ghi chú một cách nhanh chóng và dễ dàng.</li>
        <li>Lưu trữ và quản lý ghi chú của bạn một cách khoa học.</li>
      </ol>

      {/* Footer */}
      <footer className="mt-10 text-gray-500 text-sm">
        <p>© 2025 Smart Notes. All rights reserved.</p>
      </footer>
    </div>
  );
}
