import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white text-black mt-[120px] p-5 mb-4 rounded-lg shadow-md border border-gray-200 min-h-fit ml-4 mt-6 font-roboto">
      <h2 className="text-xl font-semibold mb-5">📌 Quản lý nội dung</h2>
      <nav className="space-y-4">
        {/* Bài viết */}
        <div>
          <h3 className="text-gray-400 text-sm mb-2">📚 Bài viết</h3>
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
          <h3 className="text-gray-400 text-sm mb-2">📝 Ghi chú</h3>
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
                🔍 Tìm kiếm ghi chú
              </Link>
            </li>
            <li>
              <Link
                href="/note"
                className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded"
              >
                Nháp
              </Link>
            </li>
          </ul>
        </div>

        {/* Công cụ khác */}
        <div>
          <h3 className="text-gray-400 text-sm mb-2">📊 Công cụ</h3>
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
    </aside>
  );
}
