
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold font-montserrat text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-400">
          Smart Notes Dashboard
          </h1>
          {/* Search Bar */}
          <div className="relative w-1/2">
            <input
              type="text"
              placeholder="Tìm ghi chú của bạn..."
              className="border border-gray-300 rounded-full px-4 py-2 pr-10 focus:outline-none focus:border-blue-400 focus:ring focus:ring-blue-300 transition duration-200 w-full shadow-md"
            />
            <button className="absolute right-0 top-0 mt-2 mr-2 bg-gradient-to-r from-blue-500 to-purple-400 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gradient-to-l transition duration-200">
              🔍
            </button>
          </div>
        </div>


        {/* Introduction Section */}
        <div className="p-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Chào mừng bạn đến với BlogNote</h2>
          <p className="text-gray-600 mt-2">
            Người bạn thông minh của bạn trong việc quản lý ghi chú. Tổ chức, tìm kiếm và tạo ghi chú một cách dễ dàng.
            Tăng cường năng suất của bạn với các công cụ thân thiện với người dùng được thiết kế cho việc học tập tối ưu.
          </p>
        </div>


        {/* Courses Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Note Card */}
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-lg shadow transition-transform duration-200 hover:shadow-xl hover:-translate-y-1"
            >
              <Image src="/note_image.svg" alt="Hình Ảnh" width={150} height={100} />
              <h3 className="text-lg font-semibold text-gray-800 mt-2">Tiêu đề bài viết {index + 1}</h3>
              <p className="text-gray-600">Mô tả ngắn gọn...</p>
              <p className="mt-2 font-semibold">Được tạo bởi: Người dùng {index + 1}</p>
            </div>
          ))}
        </div>


        {/* New Section at the Bottom */}
        <div className="bg-white p-4 rounded-lg shadow mt-10 transition-transform duration-200 hover:shadow-xl">
          <h2 className="text-lg font-bold text-gray-800">Tùy Chọn</h2>
          <ul className="mt-4">
            <li className="flex justify-between items-center py-2 border-b border-gray-200 transition duration-200 hover:bg-blue-50 hover:text-blue-600">
              <span className="text-gray-700">Bài viết</span>
              <span className="text-gray-500">›</span>
            </li>
            <li className="flex justify-between items-center py-2 border-b border-gray-200 transition duration-200 hover:bg-blue-50 hover:text-blue-600">
              <span className="text-gray-700">Ghi chú</span>
              <span className="text-gray-500">›</span>
            </li>
            <li className="flex justify-between items-center py-2 transition duration-200 hover:bg-blue-50 hover:text-blue-600">
              <span className="text-gray-700">Thống kê</span>
              <span className="text-gray-500">›</span>
            </li>
          </ul>
        </div>

          {/* Calendar Section */}
          <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-800">Sự Kiện Sắp Đến</h2>
          <div className="bg-white p-4 rounded-lg shadow mt-4">
            <p className="text-gray-500">[Thành Phần Lịch Ở Đây]</p>
          </div>
        </div>
      </main>
    </div>
  );
}
