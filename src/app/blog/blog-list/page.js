"use client";
import { useState } from "react";
import Image from "next/image"; // Nhập Image từ Next.js

const articles = [
  {
    id: 1,
    title: "Bài viết 1",
    summary: "Tóm tắt nội dung bài viết 1.",
    author: "Tác giả 1",
    date: "01/01/2023",
    tags: ["tag1", "tag2"],
    src: "/path/to/image1.jpg", // Đường dẫn hình ảnh hợp lệ
  },
  {
    id: 2,
    title: "Bài viết 2",
    summary: "Tóm tắt nội dung bài viết 2.",
    author: "Tác giả 2",
    date: "02/01/2023",
    tags: ["tag3", "tag4"],
    src: "/path/to/image2.jpg", // Đường dẫn hình ảnh hợp lệ
  },
  {
    id: 3,
    title: "Bài viết 3",
    summary: "Tóm tắt nội dung bài viết 3.",
    author: "Tác giả 3",
    date: "03/01/2023",
    tags: ["tag5", "tag6"],
    src: "/path/to/image3.jpg", // Đường dẫn hình ảnh hợp lệ
  },
  {
    id: 4,
    title: "Bài viết 4",
    summary: "Tóm tắt nội dung bài viết 4.",
    author: "Tác giả 4",
    date: "04/01/2023",
    tags: ["tag7", "tag8"],
    src: "/path/to/image4.jpg", // Đường dẫn hình ảnh hợp lệ
  },
  {
    id: 5,
    title: "Bài viết 5",
    summary: "Tóm tắt nội dung bài viết 5.",
    author: "Tác giả 5",
    date: "05/01/2023",
    tags: ["tag9", "tag10"],
    src: "/path/to/image5.jpg", // Đường dẫn hình ảnh hợp lệ
  },
];

export default function BlogList() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className="mt-[97px] p-5 mb-[-7px] rounded-lg shadow-md border border-gray-200 bg-gray-100 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold font-montserrat text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-400">
          Danh sách bài viết
        </h1>
        {/* Thanh tìm kiếm */}
        <div className="relative w-1/2">
          <input
            type="text"
            placeholder="Nhập từ khóa..."
            value={searchTerm}
            onChange={handleSearchChange} // Gọi hàm để thay đổi giá trị tìm kiếm
            className="border border-gray-300 rounded-full px-4 py-2 pr-10 focus:outline-none focus:border-blue-400 focus:ring focus:ring-blue-300 transition duration-200 w-full shadow-md"
          />
          <Image
            src="/search.svg" // Đường dẫn tới biểu tượng tìm kiếm
            alt="Search Icon"
            width={24}
            height={24}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
            onClick={() => console.log("Search clicked:", searchTerm)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Thẻ cho mỗi bài viết */}
        {articles
          .filter((article) =>
            article.title.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((article) => (
            <div
              key={article.id}
              className="bg-white p-4 rounded-lg shadow transition-transform duration-200 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full"
            >
              <Image
                src={article.src}
                alt={article.title}
                width={150}
                height={100}
                className="rounded-md"
              />
              <h3 className="text-lg font-semibold text-gray-800 mt-2 flex-grow">
                {article.title}
              </h3>
              <p className="text-gray-600">{article.summary}</p>
              <p className="mt-2 font-semibold">
                Được tạo bởi: {article.author}
              </p>
              <p className="mt-2 font-semibold">Ngày: {article.date}</p>
              <div className="mt-2 flex flex-wrap">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm mr-2 mb-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
      </div>

      <div className="mt-6 flex justify-center">
        <button className="bg-gradient-to-r from-blue-400 to-purple-400 px-4 py-2 rounded transition duration-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500">
          Xem thêm
        </button>
      </div>
    </div>
  );
}
