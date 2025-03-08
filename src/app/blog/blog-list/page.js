"use client";
import { useState } from "react";
import Image from "next/image";

const articles = [
  {
    id: 1,
    title: "Bài viết 1",
    summary: "Tóm tắt nội dung bài viết 1.",
    author: "Tác giả 1",
    date: "01/01/2023",
    tags: ["tag1", "tag2"],
    image: "",
  },
  {
    id: 2,
    title: "Bài viết 2",
    summary: "Tóm tắt nội dung bài viết 2.",
    author: "Tác giả 2",
    date: "02/01/2023",
    tags: ["tag3", "tag4"],
    image: "",
  },
  {
    id: 3,
    title: "Bài viết 3",
    summary: "Tóm tắt nội dung bài viết 3.",
    author: "Tác giả 3",
    date: "03/01/2023",
    tags: ["tag5", "tag6"],
    image: "",
  },
  // Thêm nhiều bài viết ở đây
];

// hiuhiuhiu

export default function BlogList() {
  return (
    <div className="container mx-2 p-5 rounded-lg shadow-md border border-gray-200 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Danh sách bài viết
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card cho từng bài viết */}
        {articles.map((article) => (
          <div
            key={article.id}
            className="bg-white p-4 rounded-lg shadow transition-transform duration-200 hover:shadow-xl hover:-translate-y-1"
          >
            <Image
              src={article.image}
              alt={article.title}
              width={150}
              height={100}
              className="rounded-md"
            />
            <h3 className="text-lg font-semibold text-gray-800 mt-2">
              {article.title}
            </h3>
            <p className="text-gray-600">{article.summary}</p>
            <p className="mt-2 font-semibold">Được tạo bởi: {article.author}</p>
            <p className="mt-2 font-semibold">Ngày: {article.date}</p>
            <div className="mt-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block bg-gray-200 rounded-full px-2 py-1 text-sm mr-2"
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
