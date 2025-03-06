import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white text-black p-5 rounded-lg shadow-md border border-gray-200 min-h-fit ml-4 mt-6 font-roboto">
      <h2 className="text-xl font-semibold mb-5">📌 Quản lý nội dung</h2>
      <nav className="space-y-4">
        {/* Bài viết */}
        <div>
          <h3 className="text-gray-400 text-sm mb-2">📚 Bài viết</h3>
          <ul className="space-y-2">
            <li>
            <Link href="/post_list" className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded">
                📄 Danh sách bài viết
              </Link>
            </li>
            <li>
            <Link href="/post_category" className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded">
                🏷️ Phân loại bài viết
              </Link>
            </li>
            <li>
            <Link href="/manage_post" className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded">
                ✍️ Quản lý bài viết
              </Link>
            </li>
          </ul>
        </div>




        {/* Ghi chú */}
        <div>
          <h3 className="text-gray-400 text-sm mb-2">📝 Ghi chú</h3>
          <ul className="space-y-2">
            <li>
            <Link href="/note_list" className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded">
                📌 Danh sách ghi chú
              </Link>
            </li>
            <li>
            <Link href="/create_notes" className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded">
                ➕ Tạo ghi chú
              </Link>
            </li>
            <li>
            <Link href="/manage_note" className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded">
                🛠️ Quản lý ghi chú
              </Link>
            </li>
            <li>
            <Link href="/search_notes" className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded">
                🔍 Tìm kiếm ghi chú
              </Link>
            </li>
          </ul>
        </div>




        {/* Công cụ khác */}
        <div>
          <h3 className="text-gray-400 text-sm mb-2">📊 Công cụ</h3>
          <ul className="space-y-2">
            <li>
            <Link href="/calendar_page" className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded">
                📅 Trang lịch
              </Link>
            </li>
            <li>
            <Link href="/report" className="block hover:bg-gradient-to-r hover:from-[#A1C4FD] hover:to-[#C2B9E3] px-3 py-2 rounded">
                📈 Thống kê ghi chú
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}
