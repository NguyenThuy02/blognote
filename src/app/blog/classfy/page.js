"use client";
import { useState } from "react";
import Image from "next/image"; // Nhập Image từ Next.js

const articles = [
  {
    id: 1,
    title: "Câu đố 1",
    summary: "Tóm tắt nội dung câu đố 1.",
    author: "Tác giả 1",
    date: "01/01/2023",
    tags: ["Câu đố"],
    src: "/path/to/image1.jpg", // Đường dẫn hình ảnh hợp lệ
  },
  {
    id: 2,
    title: "Tài liệu học tập 1",
    summary: "Tóm tắt nội dung tài liệu học tập 1.",
    author: "Tác giả 2",
    date: "02/01/2023",
    tags: ["Tài liệu học tập"],
    src: "/path/to/image2.jpg", // Đường dẫn hình ảnh hợp lệ
  },
  {
    id: 3,
    title: "Kỹ năng sống 1",
    summary: "Tóm tắt nội dung kỹ năng sống 1.",
    author: "Tác giả 3",
    date: "03/01/2023",
    tags: ["Kỹ năng sống"],
    src: "/path/to/image3.jpg", // Đường dẫn hình ảnh hợp lệ
  },
  // Thêm các bài viết khác nếu cần
];

const categories = ["Câu đố", "Tài liệu học tập", "Kỹ năng sống"]; // Các chủ đề

export default function ClassfyApp() {
  const [selectedCategory, setSelectedCategory] = useState("");

  const filteredArticles = articles.filter((article) => {
    const matchesCategory = selectedCategory
      ? article.tags.includes(selectedCategory)
      : true;
    return matchesCategory;
  });

  return (
    <div className="mt-[97px] p-5 mb-[-7px] rounded-lg shadow-md border border-gray-200 bg-gray-100 flex flex-col">
      <h1 className="text-4xl font-bold mb-5 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Phân loại bài viết
      </h1>

      <div className="flex items-center mb-4">
        <label className="mr-2 text-xl font-semibold text-gray-700">
          Chọn chủ đề:
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-gray-700 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-400 focus:ring focus:ring-blue-300 transition duration-200 bg-white"
        >
          <option value="">Tất cả</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Thẻ cho từng bài viết */}
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className="bg-white p-4 text-gray-700 rounded-lg shadow transition-transform duration-200 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full"
          >
            <Image
              src={article.src}
              alt={article.title}
              width={150}
              height={100}
              className="rounded-md mb-3"
            />
            <h3 className="text-lg font-semibold text-gray-800">
              {article.title}
            </h3>
            <p className="text-gray-600 mt-1">{article.summary}</p>
            <p className="mt-2 font-semibold text-gray-800">
              Được tạo bởi: {article.author}
            </p>
            <p className="mt-1 text-gray-500">Ngày: {article.date}</p>
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
