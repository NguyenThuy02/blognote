"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import Notification from "../../../utils/notification";
import Confirm from "../../../utils/error";

export default function ManageApp() {
  const [articles, setArticles] = useState([]);
  const [newArticle, setNewArticle] = useState({
    id: null,
    title: "",
    summary: "",
    date: "",
    src: "",
    topics: "",
    tags: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [expandedArticleId, setExpandedArticleId] = useState(null);
  const [deletingArticleId, setDeletingArticleId] = useState(null);
  const [tagInput, setTagInput] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const router = useRouter();

  // Tự động ẩn thông báo sau 3 giây
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) {
        setIsLoggedIn(true);
        setShowLoginModal(false);
        await fetchArticles(userData);
      } else {
        setIsLoggedIn(false);
        setArticles([]);
        setShowLoginModal(true);
        resetForm();
      }
    };

    checkLoginStatus();

    const handleStorageChange = (event) => {
      if (event.key === "user" || event.key === null) {
        checkLoginStatus();
      }
    };

    const handleLogoutEvent = () => {
      checkLoginStatus();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("user-logout", handleLogoutEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-logout", handleLogoutEvent);
    };
  }, []);

  const fetchArticles = async (userData) => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, content, topics, tags, images, created_at, name")
        .eq("name", userData.name || userData.email)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedArticles = data.map((post) => {
        let imageSrc = "/default-image.jpg";
        if (post.images) {
          if (Array.isArray(post.images) && post.images.length > 0) {
            imageSrc = post.images[0];
          } else if (typeof post.images === "string") {
            try {
              const parsedImages = JSON.parse(post.images);
              if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                imageSrc = parsedImages[0];
              }
            } catch (e) {
              imageSrc =
                post.images.startsWith("/") || post.images.startsWith("http")
                  ? post.images
                  : "/default-image.jpg";
            }
          }
        }

        return {
          id: post.id,
          title: post.title || "Không có tiêu đề",
          summary: post.content?.slice(0, 100) + "..." || "Không có nội dung",
          date: new Date(post.created_at).toISOString().split("T")[0],
          src: imageSrc,
          topics: post.topics || "Chưa chọn",
          tags: post.tags
            ? typeof post.tags === "string"
              ? post.tags.split(",")
              : Array.isArray(post.tags)
              ? post.tags
              : []
            : [],
        };
      });

      setArticles(formattedArticles);
    } catch (err) {
      setNotification({
        message: `Không thể tải dữ liệu: ${err.message}`,
        type: "error",
      });
    }
  };

  const handleEdit = (article) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setNewArticle(article);
    setIsEditing(true);
    setDeletingArticleId(null);
  };

  const handleToggleDetails = (id) => {
    setExpandedArticleId(expandedArticleId === id ? null : id);
  };

  const handleDelete = (id) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    const articleToDelete = articles.find((article) => article.id === id);
    setNewArticle(articleToDelete);
    setIsEditing(false);
    setDeletingArticleId(id);
    setConfirmMessage(
      `Bạn có chắc chắn muốn xóa bài viết "${
        articleToDelete.title || "Không có tiêu đề"
      }" không?`
    );
    setConfirmAction(() => confirmDelete);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", deletingArticleId);
      if (error) throw error;

      setArticles(
        articles.filter((article) => article.id !== deletingArticleId)
      );
      setNotification({
        message: "Bài viết đã được xóa thành công!",
        type: "success",
      });
      resetForm();
    } catch (err) {
      setNotification({
        message: `Không thể xóa bài viết: ${err.message}`,
        type: "error",
      });
    } finally {
      setShowConfirm(false);
    }
  };

  const handleSaveChanges = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    if (
      !newArticle.title ||
      !newArticle.summary ||
      !newArticle.date ||
      !newArticle.src ||
      !newArticle.topics ||
      newArticle.tags.length === 0
    ) {
      setNotification({
        message: "Tất cả các trường đều là bắt buộc!",
        type: "error",
      });
      return;
    }

    setConfirmMessage(
      "Bạn có chắc chắn muốn lưu các thay đổi cho bài viết này?"
    );
    setConfirmAction(() => confirmSaveChanges);
    setShowConfirm(true);
  };

  const confirmSaveChanges = async () => {
    if (isEditing) {
      try {
        const updatedData = {
          title: newArticle.title,
          content: newArticle.summary,
          created_at: newArticle.date,
          images: [newArticle.src],
          topics: newArticle.topics,
          tags: newArticle.tags.join(","),
        };

        const { error } = await supabase
          .from("posts")
          .update(updatedData)
          .eq("id", newArticle.id);

        if (error) throw error;

        setArticles(
          articles.map((article) =>
            article.id === newArticle.id
              ? { ...article, ...newArticle }
              : article
          )
        );
        setNotification({
          message: "Bài viết đã được cập nhật thành công!",
          type: "success",
        });
        resetForm();
      } catch (err) {
        setNotification({
          message: `Không thể cập nhật bài viết: ${err.message}`,
          type: "error",
        });
      } finally {
        setShowConfirm(false);
      }
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
      id: null,
      title: "",
      summary: "",
      date: "",
      src: "",
      topics: "",
      tags: [],
    });
    setIsEditing(false);
    setDeletingArticleId(null);
    setNotification(null);
    setTagInput("");
    setShowConfirm(false);
  };

  const handleCancel = () => {
    setConfirmMessage("Bạn có chắc chắn muốn hủy chỉnh sửa?");
    setConfirmAction(() => resetForm);
    setShowConfirm(true);
  };

  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    router.push("/auth/login");
  };

  return (
    <div className="text-gray-700 flex mt-[97px] p-5 mb-[-7px] rounded-lg shadow-md border border-gray-200 relative bg-gradient-to-br from-blue-100 to-purple-100">
      <div className="w-2/3 p-5 rounded-lg border-r border-gray-200">
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
                    disabled={!isLoggedIn}
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="text-red-500 hover:text-red-600 text-base underline"
                    disabled={!isLoggedIn}
                  >
                    Xóa
                  </button>
                </div>
              </li>
              {expandedArticleId === article.id && (
                <div className="ml-2 mb-4 bg-gray-50 p-2 rounded border border-gray-300 animate-fade-in">
                  <h2 className="text-xl font-bold">{article.title}</h2>
                  <p className="text-gray-600">{article.summary}</p>
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
      </div>

      {/* Tăng khoảng cách bằng cách thay ml-2 thành ml-10 */}
      <div className="flex-1 p-5 rounded-lg ml-10 text-gray-700 animate-slide-in-right">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-700">
            {deletingArticleId ? "Xóa bài viết" : "Chỉnh sửa bài viết"}
          </h2>
        </div>

        <div className="mb-4">
          <label className="block mb-1">Tiêu đề:</label>
          <input
            type="text"
            name="title"
            value={newArticle.title}
            onChange={handleChange}
            className="border focus:outline-none focus:border-purple-500 border-gray-300 hover:border-blue-500 bg-white rounded px-2 py-2 w-full text-base transition-all duration-300"
            disabled={!isLoggedIn || deletingArticleId !== null}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Tóm tắt:</label>
          <textarea
            name="summary"
            value={newArticle.summary}
            onChange={handleChange}
            className="border focus:outline-none focus:border-purple-500 border-gray-300 hover:border-blue-500 bg-white rounded px-2 py-2 w-full text-base transition-all duration-300"
            disabled={!isLoggedIn || deletingArticleId !== null}
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
            disabled={!isLoggedIn || deletingArticleId !== null}
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
            disabled={!isLoggedIn || deletingArticleId !== null}
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
            disabled={!isLoggedIn || deletingArticleId !== null}
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
            disabled={!isLoggedIn || deletingArticleId !== null}
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
                    disabled={!isLoggedIn || deletingArticleId !== null}
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
                onClick={() => handleDelete(deletingArticleId)}
                className="bg-red-400 hover:bg-red-500 text-black px-4 py-2 rounded text-base transition-all duration-300 animate-pulse"
                disabled={!isLoggedIn}
              >
                Xóa bài viết
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded text-base transition-all duration-300"
                disabled={!isLoggedIn}
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
                  disabled={!isLoggedIn}
                >
                  Lưu thay đổi
                </button>
              )}
              <button
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded text-base transition-all duration-300"
                disabled={!isLoggedIn}
              >
                Hủy
              </button>
            </>
          )}
        </div>
      </div>

      {/* Thông báo nhanh không có nền đen */}
      {notification && (
        <div className="absolute top-5 right-5 z-50">
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        </div>
      )}

      {/* Modal xác nhận không có nền đen */}
      {showConfirm && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <Confirm
            message={confirmMessage}
            onConfirm={confirmAction}
            onCancel={() => setShowConfirm(false)}
          />
        </div>
      )}

      {/* Modal đăng nhập không có nền đen */}
      {showLoginModal && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full border border-gray-200">
            <h2 className="text-xl font-semibold text-black mb-4">
              Yêu cầu đăng nhập
            </h2>
            <p className="text-gray-700 mb-4">
              Bạn cần đăng nhập để quản lý bài viết.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleLoginRedirect}
                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => router.push("/")}
                className="bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
