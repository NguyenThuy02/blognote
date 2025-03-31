"use client";
import { useState } from "react";
import Image from "next/image";

const initialArticles = [
  {
    id: 1,
    title: "Bài viết 1",
    summary: "Tóm tắt nội dung bài viết 1.",
    author: "Tác giả 1",
    date: "2023-01-01",
    src: "/path/to/image1.jpg",
    topics: "Công nghệ",
    tags: ["Tech", "AI"],
  },
  {
    id: 2,
    title: "Bài viết 2",
    summary: "Tóm tắt nội dung bài viết 2.",
    author: "Tác giả 2",
    date: "2023-01-02",
    src: "/path/to/image2.jpg",
    topics: "Khoa học",
    tags: ["Science", "Research"],
  },
];

export default function ManageApp() {
  const [articles, setArticles] = useState(initialArticles);
  const [newArticle, setNewArticle] = useState({
    title: "",
    summary: "",
    author: "",
    date: "",
    src: "",
    topics: "",
    tags: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [expandedArticleId, setExpandedArticleId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [deletingArticleId, setDeletingArticleId] = useState(null);
  const [tagInput, setTagInput] = useState("");

  const loadArticleToForm = (article) => {
    setNewArticle(article);
  };

  const handleEdit = (article) => {
    loadArticleToForm(article);
    setIsEditing(true);
    setDeletingArticleId(null);
  };

  const handleToggleDetails = (id) => {
    setExpandedArticleId(expandedArticleId === id ? null : id);
  };

  const handleDelete = (id) => {
    const articleToDelete = articles.find((article) => article.id === id);
    loadArticleToForm(articleToDelete);
    setIsEditing(false);
    setDeletingArticleId(id);
  };

  const confirmDelete = () => {
    setArticles(articles.filter((article) => article.id !== deletingArticleId));
    setSuccessMessage("Bài viết đã được xóa thành công!");
    resetForm();
  };

  const handleSaveChanges = () => {
    if (
      !newArticle.title ||
      !newArticle.summary ||
      !newArticle.author ||
      !newArticle.date ||
      !newArticle.src ||
      !newArticle.topics ||
      newArticle.tags.length === 0
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
      setSuccessMessage("Bài viết đã được cập nhật thành công!");
      resetForm();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewArticle({ ...newArticle, [name]: value });
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      setNewArticle({
        ...newArticle,
        tags: [...newArticle.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setNewArticle({
      ...newArticle,
      tags: newArticle.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const resetForm = () => {
    setNewArticle({
      title: "",
      summary: "",
      author: "",
      date: "",
      src: "",
      topics: "",
      tags: [],
    });
    setIsEditing(false);
    setDeletingArticleId(null);
    setError("");
    setTagInput("");
  };

  return (
    <div className="flex mt-[97px] p-5 mb-[-7px] rounded-lg shadow-md border border-gray-200">
      <div className="w-2/3 p-5 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg border-r border-gray-200">
        <h1 className="text-2xl text-gray-700 font-bold mb-5 animate-fade-in-down">
          Quản lý bài viết
        </h1>
        <ul>
          {articles.map((article) => (
            <div key={article.id}>
              <li className="flex justify-between items-center text-gray-700 mb-4 animate-slide-in-left">
                <div
                  onClick={() => handleToggleDetails(article.id)}
                  className="cursor-pointer flex items-center"
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
                    className="text-green-500 hover:text-green-600 text-base mr-2 underline"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="text-red-500 hover:text-red-600 text-base underline"
                  >
                    Xóa
                  </button>
                </div>
              </li>
              {expandedArticleId === article.id && (
                <div className="ml-2 mb-4 bg-gray-50 p-2 rounded border border-gray-300 animate-fade-in">
                  <h2 className="text-xl font-bold">{article.title}</h2>
                  <p className="text-gray-600">{article.summary}</p>
                  <p className="mt-2 font-semibold text-gray-800">
                    Được tạo bởi: {article.author}
                  </p>
                  <p className="mt-1 text-gray-500">Ngày: {article.date}</p>
                  <p className="mt-1 text-gray-500">Chủ đề: {article.topics}</p>
                  <p className="mt-1 text-gray-500">
                    Tags: {article.tags.join(", ")}
                  </p>
                </div>
              )}
            </div>
          ))}
        </ul>
        {successMessage && (
          <p className="text-green-500 mt-4 animate-fade-in">
            {successMessage}
          </p>
        )}
      </div>

      <div className="flex-1 p-5 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg ml-2 text-gray-700 animate-slide-in-right">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-700">
            {deletingArticleId ? "Xóa bài viết" : "Chỉnh sửa bài viết"}
          </h2>
        </div>
        {error && <p className="text-red-500 mb-4 animate-shake">{error}</p>}

        <div className="mb-4">
          <label className="block mb-1">Tiêu đề:</label>
          <input
            type="text"
            name="title"
            value={newArticle.title}
            onChange={handleChange}
            className="border focus:outline-none focus:border-purple-500 border-gray-300 hover:border-blue-500 bg-white rounded px-2 py-2 w-full text-base transition-all duration-300"
            disabled={deletingArticleId !== null}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Tóm tắt:</label>
          <textarea
            name="summary"
            value={newArticle.summary}
            onChange={handleChange}
            className="border focus:outline-none focus:border-purple-500 border-gray-300 hover:border-blue-500 bg-white rounded px-2 py-2 w-full text-base transition-all duration-300"
            disabled={deletingArticleId !== null}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Tác giả:</label>
          <input
            type="text"
            name="author"
            value={newArticle.author}
            onChange={handleChange}
            className="border focus:outline-none focus:border-purple-500 border-gray-300 hover:border-blue-500 bg-white rounded px-2 py-2 w-full text-base transition-all duration-300"
            disabled={deletingArticleId !== null}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Ngày:</label>
          <input
            type="date"
            name="date"
            value={newArticle.date}
            onChange={handleChange}
            className="border focus:outline-none focus:border-purple-500 border-gray-300 hover:border-blue-500 bg-white rounded px-2 py-2 w-full text-base transition-all duration-300"
            disabled={deletingArticleId !== null}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Đường dẫn hình ảnh:</label>
          <input
            type="text"
            name="src"
            value={newArticle.src}
            onChange={handleChange}
            className="border focus:outline-none focus:border-purple-500 border-gray-300 hover:border-blue-500 bg-white rounded px-2 py-2 w-full text-base transition-all duration-300"
            disabled={deletingArticleId !== null}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Chủ đề:</label>
          <input
            type="text"
            name="topics"
            value={newArticle.topics}
            onChange={handleChange}
            className="border focus:outline-none focus:border-purple-500 border-gray-300 hover:border-blue-500 bg-white rounded px-2 py-2 w-full text-base transition-all duration-300"
            disabled={deletingArticleId !== null}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Thẻ tag:</label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleAddTag}
            className="border focus:outline-none focus:border-purple-500 border-gray-300 hover:border-blue-500 bg-white rounded px-2 py-2 w-full text-base transition-all duration-300"
            placeholder="Nhấn Enter để thêm tag"
            disabled={deletingArticleId !== null}
          />
          {newArticle.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {newArticle.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center animate-fade-in"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-red-500 hover:text-red-700"
                    disabled={deletingArticleId !== null}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          {deletingArticleId !== null ? (
            <>
              <button
                onClick={confirmDelete}
                className="bg-red-400 hover:bg-red-500 text-black px-4 py-2 rounded text-base transition-all duration-300 animate-pulse"
              >
                Xóa bài viết
              </button>
              <button
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded text-base transition-all duration-300"
              >
                Hủy
              </button>
            </>
          ) : (
            <>
              {isEditing && (
                <button
                  onClick={handleSaveChanges}
                  className="bg-green-400 hover:bg-green-500 text-black px-4 py-2 rounded text-base transition-all duration-300 animate-bounce"
                >
                  Lưu thay đổi
                </button>
              )}
              <button
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded text-base transition-all duration-300"
              >
                Hủy
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
