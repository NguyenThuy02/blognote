"use client";
import { useState } from "react";
import Image from "next/image"; // Nhập Image từ Next.js

const initialArticles = [
  {
    id: 1,
    title: "Bài viết 1",
    summary: "Tóm tắt nội dung bài viết 1.",
    author: "Tác giả 1",
    date: "01/01/2023",
    src: "/path/to/image1.jpg", // Đường dẫn hình ảnh hợp lệ
  },
  {
    id: 2,
    title: "Bài viết 2",
    summary: "Tóm tắt nội dung bài viết 2.",
    author: "Tác giả 2",
    date: "02/01/2023",
    src: "/path/to/image2.jpg", // Đường dẫn hình ảnh hợp lệ
  },
  // Thêm các bài viết khác nếu cần
];

export default function ManageApp() {
  const [articles, setArticles] = useState(initialArticles);
  const [newArticle, setNewArticle] = useState({
    title: "",
    summary: "",
    author: "",
    date: "",
    src: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [expandedArticleId, setExpandedArticleId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const handleDelete = (id) => {
    setArticles(articles.filter((article) => article.id !== id));
    setSuccessMessage("Bài viết đã được xóa thành công!");
    setTimeout(() => {
      setSuccessMessage(""); // Ẩn thông báo sau 3 giây
    }, 3000);

    if (expandedArticleId === id) {
      setExpandedArticleId(null); // Ẩn thông tin chi tiết nếu bài viết bị xóa
    }
  };

  const handleEdit = (article) => {
    setNewArticle(article);
    setIsEditing(true);
  };

  const handleToggleDetails = (id) => {
    setExpandedArticleId(expandedArticleId === id ? null : id);
  };

  const handleAddArticle = () => {
    // Kiểm tra ràng buộc nhập liệu
    if (
      !newArticle.title ||
      !newArticle.summary ||
      !newArticle.author ||
      !newArticle.date ||
      !newArticle.src
    ) {
      setError("Tất cả các trường đều là bắt buộc!");
      return;
    }
    setError("");

    if (isEditing) {
      setArticles(
        articles.map((article) =>
          article.id === newArticle.id ? newArticle : article
        )
      );
    } else {
      setArticles([...articles, { ...newArticle, id: articles.length + 1 }]);
    }
    setNewArticle({ title: "", summary: "", author: "", date: "", src: "" });
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewArticle({ ...newArticle, [name]: value });
  };

  return (
    <div className="flex mt-[97px] p-5 mb-[-7px] rounded-lg shadow-md border border-gray-200">
      <div className="w-2/3 p-5 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg border-r border-gray-200">
        <h1 className="text-2xl font-bold mb-5">Quản lý bài viết</h1>
        <ul>
          {articles.map((article) => (
            <div key={article.id}>
              <li className="flex justify-between items-center mb-4">
                <div
                  onClick={() => handleToggleDetails(article.id)}
                  className="cursor-pointer"
                >
                  <Image
                    src={article.src}
                    alt={article.title}
                    width={50}
                    height={50}
                    className="rounded-md mr-3"
                  />
                  <span className="font-semibold">{article.title}</span>
                </div>
                <div>
                  <button
                    onClick={() => handleEdit(article)}
                    className="text-blue-500 mr-2 hover:underline"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="text-red-500 hover:underline"
                  >
                    Xóa
                  </button>
                </div>
              </li>
              {expandedArticleId === article.id && (
                <div className="ml-8 mb-4 bg-gray-50 p-2 rounded border border-gray-300">
                  <h2 className="text-xl font-bold">{article.title}</h2>
                  <p className="text-gray-600">{article.summary}</p>
                  <p className="mt-2 font-semibold text-gray-800">
                    Được tạo bởi: {article.author}
                  </p>
                  <p className="mt-1 text-gray-500">Ngày: {article.date}</p>
                </div>
              )}
            </div>
          ))}
        </ul>
        {successMessage && (
          <p className="text-green-500 mt-4">{successMessage}</p>
        )}{" "}
        {/* Thông báo xóa thành công */}
      </div>

      <div className="flex-1 p-5 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg ml-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            {isEditing ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}
          </h2>
          <button
            onClick={() => {
              setIsEditing(false);
              setNewArticle({
                title: "",
                summary: "",
                author: "",
                date: "",
                src: "",
              });
            }}
            className="bg-blue-400 text-black px-4 py-2 rounded transition duration-200 ease-in-out hover:bg-blue-500"
          >
            Thêm bài viết
          </button>
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block mb-1">Tiêu đề:</label>
          <input
            type="text"
            name="title"
            value={newArticle.title}
            onChange={handleChange}
            className="border border-gray-300 rounded px-2 py-2 w-full text-lg"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Tóm tắt:</label>
          <textarea
            name="summary"
            value={newArticle.summary}
            onChange={handleChange}
            className="border border-gray-300 rounded px-2 py-2 w-full text-lg h-24"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Tác giả:</label>
          <input
            type="text"
            name="author"
            value={newArticle.author}
            onChange={handleChange}
            className="border border-gray-300 rounded px-2 py-2 w-full text-lg"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Ngày:</label>
          <input
            type="date"
            name="date"
            value={newArticle.date}
            onChange={handleChange}
            className="border border-gray-300 rounded px-2 py-2 w-full text-lg"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Đường dẫn hình ảnh:</label>
          <input
            type="text"
            name="src"
            value={newArticle.src}
            onChange={handleChange}
            className="border border-gray-300 rounded px-2 py-2 w-full text-lg"
          />
        </div>
        <button
          onClick={handleAddArticle}
          className="bg-green-400 hover:bg-green-500 text-black px-4 py-2 rounded text-lg"
        >
          {isEditing ? "Lưu thay đổi" : "Thêm bài viết"}
        </button>
      </div>
    </div>
  );
}
