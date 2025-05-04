"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white text-black mt-[120px] p-5 mb-4 rounded-lg shadow-md border border-gray-200 min-h-fit ml-4 font-roboto">
      <h2 className="text-xl font-semibold mb-5">📌 Quản lý nội dung</h2>
      <nav className="space-y-4">
        {/* Bài viết */}
        <div>
          <h3 className="text-sm mb-2">📚 Bài viết</h3>
          <ul className="space-y-2">
            <li>
              <Link
                href="/blog/post"
                className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded"
              >
                📝 Đăng bài viết
              </Link>
            </li>
            <li>
              <Link
                href="/blog/blog-list"
                className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded"
              >
                📄 Danh sách bài viết
              </Link>
            </li>
            <li>
              <Link
                href="/blog/classfy"
                className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded"
              >
                🏷️ Phân loại bài viết
              </Link>
            </li>
            <li>
              <Link
                href="/blog/manage"
                className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded"
              >
                ✍️ Quản lý bài viết
              </Link>
            </li>
            <li>
              <Link
                href="/blog/report"
                className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded"
              >
                📈 Thống kê bài viết
              </Link>
            </li>
          </ul>
        </div>

        {/* Ghi chú */}
        <div>
          <h3 className="text-sm mb-2">📝 Ghi chú</h3>
          <ul className="space-y-2">
            <li>
              <Link
                href="/note/note_list"
                className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded"
              >
                📌 Danh sách ghi chú
              </Link>
            </li>
            <li>
              <Link
                href="/note/create_notes"
                className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded"
              >
                ➕ Tạo ghi chú
              </Link>
            </li>
            <li>
              <Link
                href="/note/manage_note"
                className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded"
              >
                🛠️ Quản lý ghi chú
              </Link>
            </li>
            <li>
              <Link
                href="/note/search_notes"
                className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded"
              >
                🔍 Tìm kiếm gợi ý ghi chú
              </Link>
            </li>
          </ul>
        </div>

        {/* Công cụ khác */}
        <div>
          <h3 className="text-sm mb-2">📊 Công cụ</h3>
          <ul className="space-y-2">
            <li>
              <Link
                href="/note/calendar_page"
                className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded"
              >
                🗓️ Trang lịch
              </Link>
            </li>
            <li>
              <Link
                href="/note/report"
                className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded"
              >
                📈 Thống kê ghi chú
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <style jsx>{`
        aside {
          background: var(--background);
          color: var(--text-color);
          border-color: var(--border-color);
          box-shadow: 0 4px 12px var(--shadow-color);
          transition: all 0.3s ease;
        }
        h2, h3 {
          color: var(--text-color);
        }
        h3 {
          opacity: 0.6;
        }
        a {
          color: var(--text-color);
          transition: all 0.3s ease;
        }
        a:hover {
          background: linear-gradient(to right, var(--accent-color), var(--border-color));
          color: white;
        }
      `}</style>
    </aside>
  );
}