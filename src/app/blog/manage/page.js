"use client";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import Notification from "../../../utils/notification";
import Confirm from "../../../utils/error";
import ThemeSelector, { themes, getThemeClasses } from "../../../utils/color";

// Debounce hook to limit frequent updates
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

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
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showPreview, setShowPreview] = useState(false);
  const [favoriteArticles, setFavoriteArticles] = useState([]);
  const [recentActions, setRecentActions] = useState([]);
  const [theme, setTheme] = useState("light");
  const [error, setError] = useState(null);
  const router = useRouter();

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filteredArticles = useMemo(() => {
    let result = articles;

    if (debouncedSearchQuery) {
      result = result.filter(
        (article) =>
          article.title?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          article.summary?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    if (filterTopic) {
      result = result.filter((article) => article.topics === filterTopic);
    }

    if (filterTag) {
      result = result.filter((article) => article.tags?.includes(filterTag));
    }

    return [...result].sort((a, b) => {
      if (sortBy === "created_at") {
        return sortOrder === "desc"
          ? new Date(b.date) - new Date(a.date)
          : new Date(a.date) - new Date(b.date);
      } else if (sortBy === "title") {
        return sortOrder === "desc"
          ? b.title.localeCompare(a.title)
          : a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [debouncedSearchQuery, filterTopic, filterTag, sortBy, sortOrder, articles]);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme") || "light";
      setTheme(savedTheme);
    } catch (err) {
      setNotification({
        message: "Không thể tải giao diện: " + err.message,
        type: "error",
      });
    }
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        if (userData && (userData.name || userData.email)) {
          setIsLoggedIn(true);
          setShowLoginModal(false);
          await fetchArticles(userData);
        } else {
          setIsLoggedIn(false);
          setArticles([]);
          setFavoriteArticles([]);
          setShowLoginModal(true);
          resetForm();
        }
      } catch (err) {
        setError("Lỗi khi kiểm tra trạng thái đăng nhập: " + err.message);
        setNotification({
          message: "Lỗi khi kiểm tra đăng nhập: " + err.message,
          type: "error",
        });
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

  useEffect(() => {
    try {
      const savedFavorites = JSON.parse(localStorage.getItem("favoriteArticles") || "[]");
      setFavoriteArticles(
        savedFavorites.filter((id) => articles.some((article) => article.id === id))
      );
    } catch (err) {
      setNotification({
        message: "Lỗi khi cập nhật bài yêu thích: " + err.message,
        type: "error",
      });
    }
  }, [articles]);

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
              ? post.tags.split(",").map((tag) => tag.trim())
              : Array.isArray(post.tags)
              ? post.tags
              : []
            : [],
        };
      });

      setArticles(formattedArticles);
    } catch (err) {
      setError("Lỗi khi tải bài viết: " + err.message);
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
    try {
      setNewArticle(article);
      setIsEditing(true);
      setDeletingArticleId(null);
      setRecentActions((prev) => [
        {
          action: "Chỉnh sửa",
          title: article.title,
          timestamp: new Date().toLocaleString(),
        },
        ...prev.slice(0, 4),
      ]);
    } catch (err) {
      setNotification({
        message: "Lỗi khi chỉnh sửa: " + err.message,
        type: "error",
      });
    }
  };

  const handleToggleDetails = (id) => {
    setExpandedArticleId(expandedArticleId === id ? null : id);
  };

  const handleDelete = (id) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    try {
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
    } catch (err) {
      setNotification({
        message: "Lỗi khi chuẩn bị xóa: " + err.message,
        type: "error",
      });
    }
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
      setSelectedArticles(
        selectedArticles.filter((id) => id !== deletingArticleId)
      );
      setFavoriteArticles(
        favoriteArticles.filter((id) => id !== deletingArticleId)
      );
      localStorage.setItem(
        "favoriteArticles",
        JSON.stringify(
          favoriteArticles.filter((id) => id !== deletingArticleId)
        )
      );
      setRecentActions((prev) => [
        {
          action: "Xóa",
          title: newArticle.title,
          timestamp: new Date().toLocaleString(),
        },
        ...prev.slice(0, 4),
      ]);
      setNotification({
        message: `Bài viết "${
          newArticle.title || "Không có tiêu đề"
        }" đã được xóa thành công!`,
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

  const handleBulkDelete = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    if (selectedArticles.length === 0) {
      setNotification({
        message: "Vui lòng chọn ít nhất một bài viết để xóa!",
        type: "error",
      });
      return;
    }
    setConfirmMessage(
      `Bạn có chắc chắn muốn xóa ${selectedArticles.length} bài viết đã chọn không?`
    );
    setConfirmAction(() => confirmBulkDelete);
    setShowConfirm(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .in("id", selectedArticles);
      if (error) throw error;

      setArticles(
        articles.filter((article) => !selectedArticles.includes(article.id))
      );
      setFavoriteArticles(
        favoriteArticles.filter((id) => !selectedArticles.includes(id))
      );
      localStorage.setItem(
        "favoriteArticles",
        JSON.stringify(
          favoriteArticles.filter((id) => !selectedArticles.includes(id))
        )
      );
      setRecentActions((prev) => [
        {
          action: "Xóa hàng loạt",
          title: `${selectedArticles.length} bài viết`,
          timestamp: new Date().toLocaleString(),
        },
        ...prev.slice(0, 4),
      ]);
      setSelectedArticles([]);
      setNotification({
        message: `${selectedArticles.length} bài viết đã được xóa thành công!`,
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
      !newArticle.topics
    ) {
      setNotification({
        message: "Tất cả các trường (trừ tags) đều là bắt buộc!",
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
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const articleData = {
        title: newArticle.title,
        content: newArticle.summary,
        created_at: newArticle.date,
        images: [newArticle.src],
        topics: newArticle.topics,
        tags: newArticle.tags.join(","),
        name: userData.name || userData.email || "",
      };

      const { error } = await supabase
        .from("posts")
        .update(articleData)
        .eq("id", newArticle.id);
      if (error) throw error;

      const updatedArticle = {
        ...newArticle,
        summary: newArticle.summary.slice(0, 100) + "...",
      };
      setArticles(
        articles.map((article) =>
          article.id === newArticle.id ? updatedArticle : article
        )
      );

      setRecentActions((prev) => [
        {
          action: "Cập nhật",
          title: newArticle.title,
          timestamp: new Date().toLocaleString(),
        },
        ...prev.slice(0, 4),
      ]);
      setNotification({
        message: `Bài viết "${newArticle.title}" đã được cập nhật thành công!`,
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

  const handleSelectArticle = (id) => {
    setSelectedArticles((prev) =>
      prev.includes(id)
        ? prev.filter((articleId) => articleId !== id)
        : [...prev, id]
    );
  };

  const toggleFavorite = (id) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    try {
      const newFavorites = favoriteArticles.includes(id)
        ? favoriteArticles.filter((favId) => favId !== id)
        : [...favoriteArticles, id];
      setFavoriteArticles(newFavorites);
      localStorage.setItem("favoriteArticles", JSON.stringify(newFavorites));
      setRecentActions((prev) => [
        {
          action: favoriteArticles.includes(id)
            ? "Bỏ yêu thích"
            : "Thêm yêu thích",
          title: articles.find((a) => a.id === id)?.title || "Unknown",
          timestamp: new Date().toLocaleString(),
        },
        ...prev.slice(0, 4),
      ]);
    } catch (err) {
      setNotification({
        message: "Lỗi khi cập nhật yêu thích: " + err.message,
        type: "error",
      });
    }
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
    setShowPreview(false);
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

  const handlePreview = () => {
    if (
      !newArticle.title ||
      !newArticle.summary ||
      !newArticle.date ||
      !newArticle.src ||
      !newArticle.topics
    ) {
      setNotification({
        message: "Vui lòng điền đầy đủ thông tin (trừ tags) để xem trước!",
        type: "error",
      });
      return;
    }
    setShowPreview(true);
  };

  const exportArticles = () => {
    try {
      const dataStr = JSON.stringify(filteredArticles, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "articles.json";
      link.click();
      URL.revokeObjectURL(url);
      setNotification({
        message: "Danh sách bài viết đã được xuất thành công!",
        type: "success",
      });
    } catch (err) {
      setNotification({
        message: "Lỗi khi xuất bài viết: " + err.message,
        type: "error",
      });
    }
  };

  const getTopTags = () => {
    try {
      const tagCount = {};
      articles.forEach((article) => {
        article.tags?.forEach((tag) => {
          const normalizedTag = tag.toLowerCase();
          tagCount[normalizedTag] = (tagCount[normalizedTag] || 0) + 1;
        });
      });
      return Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));
    } catch (err) {
      setNotification({
        message: "Lỗi khi tính toán thẻ: " + err.message,
        type: "error",
      });
      return [];
    }
  };

  const getActionSuggestion = () => {
    try {
      const currentDate = new Date();
      const date45DaysAgo = new Date(currentDate);
      date45DaysAgo.setDate(currentDate.getDate() - 45);
      const date14DaysAgo = new Date(currentDate);
      date14DaysAgo.setDate(currentDate.getDate() - 14);

      const oldArticles45Days = articles.filter(
        (article) => new Date(article.date) < date45DaysAgo
      );
      const oldArticles14Days = articles.filter(
        (article) => new Date(article.date) < date14DaysAgo
      );

      let suggestions = [];
      if (oldArticles45Days.length > 5) {
        suggestions.push(
          "Bạn có nhiều bài viết cũ (>45 ngày). Hãy xem xét xóa bớt!"
        );
      }
      if (oldArticles14Days.length > 5) {
        suggestions.push(
          "Bạn có nhiều bài viết cũ (>14 ngày). Hãy xem xét xóa bớt!"
        );
      }
      if (
        articles.length > 0 &&
        articles.every((article) => article.tags?.length === 0)
      ) {
        suggestions.push(
          "Bài viết của bạn chưa có tag. Hãy thêm tag để dễ quản lý!"
        );
      }
      if (suggestions.length === 0) {
        return "Mọi thứ đang ổn! Tiếp tục quản lý bài viết nhé.";
      }
      return suggestions.join(" ");
    } catch (err) {
      setNotification({
        message: "Lỗi khi tạo gợi ý: " + err.message,
        type: "error",
      });
      return "Không thể tạo gợi ý.";
    }
  };

  if (error) {
    return (
      <div className="p-5 text-red-500">
        <h1>Lỗi ứng dụng</h1>
        <p>{error}</p>
        <button
          onClick={() => setError(null)}
          className="bg-blue-500 text-white pv-4 py-2 rounded"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div
      className={`mt-[97px] p-5 mb-[-7px] rounded-lg shadow-md border border-gray-200 relative ${themes[theme]}`}
    >
      <style jsx>{`
        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .wrap-text {
          word-break: break-word;
          overflow-wrap: break-word;
        }
      `}</style>

      <div className="flex flex-col lg:flex-row gap-5">
        <div
          className={`w-full lg:w-2/3 p-6 rounded-lg shadow-lg border border-gray-200 ${getThemeClasses(
            theme,
            "container"
          )}`}
        >
          <div className="flex justify-between items-center mb-5 flex-wrap">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent wrap-text">
              Quản lý bài viết
            </h1>
            <span className="text-sm text-green-500 wrap-text">
              Tổng: {filteredArticles.length} bài viết
            </span>
          </div>
          <div className="mb-4 flex flex-col sm:flex-row gap-4 flex-wrap">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`border border-purple-400 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:border-purple-600 rounded-xl px-4 py-2 text-sm transition-all duration-300 min-w-0 flex-1 wrap-text ${getThemeClasses(
                theme,
                "select"
              )}`}
            />
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className={`border border-purple-400 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:border-purple-600 rounded-xl px-4 py-2 text-sm transition-all duration-300 min-w-0 flex-1 wrap-text ${getThemeClasses(
                theme,
                "select"
              )}`}
            >
              <option value="">Tất cả chủ đề</option>
              {[...new Set(articles.map((a) => a.topics).filter(Boolean))].map(
                (topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                )
              )}
            </select>
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className={`border border-purple-400 bg-purple-100 hover:bg-purple-200 focus:outline W-none focus:border-purple-600 rounded-xl px-4 py-2 text-sm transition-all duration-300 min-w-0 flex-1 wrap-text ${getThemeClasses(
                theme,
                "select"
              )}`}
            >
              <option value="">Tất cả thẻ</option>
              {[
                ...new Set(
                  articles.flatMap((a) => a.tags || []).filter(Boolean)
                ),
              ].map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split(":");
                setSortBy(by);
                setSortOrder(order);
              }}
              className={`border border-purple-400 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:border-purple-600 rounded-xl px-4 py-2 text-sm transition-all duration-300 min-w-0 flex-1 wrap-text ${getThemeClasses(
                theme,
                "select"
              )}`}
            >
              <option value="created_at:desc">Mới nhất trước</option>
              <option value="created_at:asc">Cũ nhất trước</option>
              <option value="title:asc">Tiêu đề A-Z</option>
              <option value="title:desc">Tiêu đề Z-A</option>
            </select>
            {selectedArticles.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm transition-all duration-300 min-w-0 wrap-text"
                disabled={!isLoggedIn}
              >
                Xóa {selectedArticles.length} bài viết
              </button>
            )}
          </div>
          <div className="flex items-center mb-4 flex-wrap">
            <input
              type="checkbox"
              checked={
                filteredArticles.length > 0 &&
                selectedArticles.length === filteredArticles.length
              }
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedArticles(
                    filteredArticles.map((article) => article.id)
                  );
                } else {
                  setSelectedArticles([]);
                }
              }}
              className="mr-2"
              disabled={!isLoggedIn}
            />
            <label className="wrap-text">
              Chọn tất cả ({selectedArticles.length}/{filteredArticles.length})
            </label>
          </div>
          <div className="max-h-[500px] overflow-y-auto scrollbar-hidden">
            <ul>
              {filteredArticles.map((article) => (
                <div key={article.id} className="flex items-center mb-6 flex-wrap">
                  <input
                    type="checkbox"
                    checked={selectedArticles.includes(article.id)}
                    onChange={() => handleSelectArticle(article.id)}
                    className="mr-3 flex-shrink-0 self-center"
                    disabled={!isLoggedIn}
                  />
                  <li
                    className={`flex justify-between items-center w-full shadow-md border border-gray-200 rounded-lg p-3 flex-wrap ${getThemeClasses(
                      theme,
                      "preview"
                    )}`}
                  >
                    <div
                      onClick={() => handleToggleDetails(article.id)}
                      className="cursor-pointer flex items-center flex-1 min-w-0"
                    >
                      <Image
                        src={article.src || "/default-image.jpg"}
                        alt={article.title || "No title"}
                        width={50}
                        height={50}
                        className="rounded-md mr-3 flex-shrink-0"
                        onError={(e) => (e.target.src = "/default-image.jpg")}
                      />
                      <span className="wrap-text">{article.title}</span>
                    </div>
                    <div className="flex space-x-2 flex-wrap mt-2 sm:mt-0">
                      <button
                        onClick={() => toggleFavorite(article.id)}
                        className={`text-sm underline wrap-text ${
                          favoriteArticles.includes(article.id)
                            ? "text-yellow-500 hover:text-yellow-600"
                            : "text-gray-500 hover:text-gray-600"
                        }`}
                        disabled={!isLoggedIn}
                      >
                        {favoriteArticles.includes(article.id)
                          ? "Bỏ yêu thích"
                          : "Yêu thích"}
                      </button>
                      <button
                        onClick={() => handleEdit(article)}
                        className="text-green-500 hover:text-green-600 text-sm underline wrap-text"
                        disabled={!isLoggedIn}
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="text-red-500 hover:text-red-600 text-sm underline wrap-text"
                        disabled={!isLoggedIn}
                      >
                        Xóa
                      </button>
                    </div>
                  </li>
                </div>
              ))}
            </ul>
          </div>
        </div>

        <div
          className={`w-full lg:w-1/3 p-6 rounded-lg shadow-lg border border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50 overflow-x-hidden ${getThemeClasses(
            theme,
            "editor"
          )}`}
        >
          <div className="flex justify-between items-center mb-4 flex-wrap">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent wrap-text">
              {deletingArticleId ? "Xóa bài viết" : "Chỉnh sửa bài viết"}
            </h2>
          </div>

          {showPreview ? (
            <div
              className={`p-4 rounded border

 border-gray-300 mb-4 shadow-sm bg-gradient-to-br from-purple-50 to-blue-50 ${getThemeClasses(
                theme,
                "preview"
              )}`}
            >
              <h3 className="text-xl font-bold wrap-text">{newArticle.title}</h3>
              <Image
                src={newArticle.src || "/default-image.jpg"}
                alt={newArticle.title || "No title"}
                width={200}
                height={200}
                className="rounded-md my-2"
                onError={(e) => (e.target.src = "/default-image.jpg")}
              />
              <p className="text-gray-600 wrap-text">{newArticle.summary}</p>
              <p className="mt-1 text-gray-500 wrap-text">Ngày: {newArticle.date}</p>
              <p className="mt-1 text-gray-500 wrap-text">Chủ đề: {newArticle.topics}</p>
              <p className="mt-1 text-gray-500 wrap-text">
                Tags: {newArticle.tags?.join(", ") || "None"}
              </p>
              <button
                onClick={() => setShowPreview(false)}
                className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded mt-4 transition-all duration-300 wrap-text"
              >
                Đóng xem trước
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block mb-1 wrap-text">Tiêu đề:</label>
                <input
                  type="text"
                  name="title"
                  value={newArticle.title}
                  onChange={handleChange}
                  className={`border focus:outline-none focus:border-purple-500 border-gray-300 hover:border-blue-500 hover:bg-blue-100 rounded px-3 py-2 w-full text-base transition-all duration-300 wrap-text ${getThemeClasses(
                    theme,
                    "input"
                  )}`}
                  disabled={!isLoggedIn || deletingArticleId !== null}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 wrap-text">Tóm tắt:</label>
                <textarea
                  name="summary"
                  value={newArticle.summary}
                  onChange={handleChange}
                  className={`border focus:outline-none focus:border-purple-500 border-gray-300 hover:border-blue-500 hover:bg-blue-100 rounded px-3 py-2 w-full text-base transition-all duration-300 wrap-text ${getThemeClasses(
                    theme,
                    "input"
                  )}`}
                  disabled={!isLoggedIn || deletingArticleId !== null}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 wrap-text">Ngày:</label>
                <input
                  type="date"
                  name="date"
                  value={newArticle.date}
                  onChange={handleChange}
                  className={`border focus:outline-none focus:border-purple-500 border-gray-300 hover:border-blue-500 hover:bg-blue-100 rounded px-3 py-2 w-full text-base transition-all duration-300 wrap-text ${getThemeClasses(
                    theme,
                    "input"
                  )}`}
                  disabled={!isLoggedIn || deletingArticleId !== null}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 wrap-text">Đường dẫn hình ảnh:</label>
                <input
                  type="text"
                  name="src"
                  value={newArticle.src}
                  onChange={handleChange}
                  className={`border focus:outline-none focus:border-purple-500 border-gray-300 hover:border-blue-500 hover:bg-blue-100 rounded px-3 py-2 w-full text-base transition-all duration-300 wrap-text ${getThemeClasses(
                    theme,
                    "input"
                  )}`}
                  disabled={!isLoggedIn || deletingArticleId !== null}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 wrap-text">Chủ đề:</label>
                <input
                  type="text"
                  name="topics"
                  value={newArticle.topics}
                  onChange={handleChange}
                  className={`border focus:outline-none focus:border-purple-500 border-gray-300 hover:border-blue-500 hover:bg-blue-100 rounded px-3 py-2 w-full text-base transition-all duration-300 wrap-text ${getThemeClasses(
                    theme,
                    "input"
                  )}`}
                  disabled={!isLoggedIn || deletingArticleId !== null}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 wrap-text">Thẻ tag:</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleAddTag}
                  className={`border focus:outline-none focus:border-purple-500 border-gray-300 hover:border-blue-500 hover:bg-blue-100 rounded px-3 py-2 w-full text-base transition-all duration-300 wrap-text ${getThemeClasses(
                    theme,
                    "input"
                  )}`}
                  placeholder="Nhấn Enter để thêm tag"
                  disabled={!isLoggedIn || deletingArticleId !== null}
                />
                {newArticle.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 max-w-full">
                    {newArticle.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full flex items-center animate-fade-in wrap-text min-w-fit max-w-[150px]"
                      >
                        <span className="truncate">{tag}</span>
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
              <div className="flex space-x-2 flex-wrap">
                {deletingArticleId !== null ? (
                  <>
                    <button
                      onClick={() => handleDelete(deletingArticleId)}
                      className="bg-red-400 hover:bg-red-500 text-black px-4 py-2 rounded text-base transition-all duration-300 animate-pulse wrap-text"
                      disabled={!isLoggedIn}
                    >
                      Xóa bài viết
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded text-base transition-all duration-300 wrap-text"
                      disabled={!isLoggedIn}
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <>
                    {isEditing && (
                      <>
                        <button
                          onClick={handleSaveChanges}
                          className="bg-green-400 hover:bg-green-500 text-black px-4 py-2 rounded text-base transition-all duration-300 animate-bounce wrap-text"
                          disabled={!isLoggedIn}
                        >
                          Lưu thay đổi
                        </button>
                        <button
                          onClick={handlePreview}
                          className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded text-base transition-all duration-300 wrap-text"
                          disabled={!isLoggedIn}
                        >
                          Xem trước
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleCancel}
                      className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded text-base transition-all duration-300 wrap-text"
                      disabled={!isLoggedIn}
                    >
                      Hủy
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div
        className={`mt-5 p-6 rounded-lg shadow-lg border border-gray-200 flex flex-col gap-4 ${getThemeClasses(
          theme,
          "support"
        )}`}
      >
        <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent wrap-text">
          Công cụ phân tích nhanh
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`p-4 rounded-lg shadow-sm border flex-1 ${getThemeClasses(
              theme,
              "favorites"
            )}`}
          >
            <h3 className="text-lg font-semibold text-green-700 wrap-text">
              Bài viết yêu thích
            </h3>
            {favoriteArticles.length > 0 ? (
              <ul className="list-disc pl-5 text-gray-600">
                {favoriteArticles.slice(0, 5).map((id) => {
                  const article = articles.find((a) => a.id === id);
                  return article ? (
                    <li key={id} className="truncate wrap-text">
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => handleEdit(article)}
                      >
                        {article.title}
                      </span>
                    </li>
                  ) : null;
                })}
              </ul>
            ) : (
              <p className="text-gray-600 wrap-text">Chưa có bài viết yêu thích nào.</p>
            )}
          </div>
          <div
            className={`p-4 rounded-lg shadow-sm border flex-1 ${getThemeClasses(
              theme,
              "favorites"
            )}`}
          >
            <h3 className="text-lg font-semibold text-teal-700 wrap-text">
              Thống kê nhanh
            </h3>
            <ul className="list-disc pl-5 text-gray-600">
              <li className="wrap-text">
                Tổng bài viết:{" "}
                <span className="font-semibold">{articles.length}</span>
              </li>
              <li className="wrap-text">
                Bài yêu thích:{" "}
                <span className="font-semibold">{favoriteArticles.length}</span>
              </li>
              <li className="wrap-text">
                Bài đã chọn:{" "}
                <span className="font-semibold">{selectedArticles.length}</span>
              </li>
            </ul>
          </div>
          <div
            className={`p-4 rounded-lg shadow-sm border flex-1 ${getThemeClasses(
              theme,
              "recent"
            )}`}
          >
            <h3 className="text-lg font-semibold text-blue-700 wrap-text">
              Hoạt động gần đây
            </h3>
            {recentActions.length > 0 ? (
              <ul className="list-disc pl-5 text-gray-600">
                {recentActions.map((action, index) => (
                  <li key={index} className="wrap-text">
                    {action.action}:{" "}
                    <span className="font-semibold">{action.title}</span> (
                    {action.timestamp})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 wrap-text">Chưa có hoạt động nào.</p>
            )}
          </div>
        </div>
      </div>

      <div
        className={`mt-5 p-6 rounded-lg shadow-lg border border-gray-200 flex flex-col gap-4 ${getThemeClasses(
          theme,
          "support"
        )}`}
      >
        <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent wrap-text">
          Hỗ trợ quản lý bài viết
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`p-4 rounded-lg shadow-sm border flex-1 ${getThemeClasses(
              theme,
              "recent"
            )}`}
          >
            <h3 className="text-lg font-semibold text-orange-700 wrap-text">
              Từ khóa phổ biến
            </h3>
            {articles.length > 0 && getTopTags().length > 0 ? (
              <ul className="list-disc pl-5 text-gray-600">
                {getTopTags().map(({ tag, count }) => (
                  <li key={tag} className="wrap-text">
                    {tag}: <span className="font-semibold">{count}</span> lần
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 wrap-text">Chưa có dữ liệu từ khóa.</p>
            )}
          </div>
          <div
            className={`p-4 rounded-lg shadow-sm border flex-1 ${getThemeClasses(
              theme,
              "tips"
            )}`}
          >
            <h3 className="text-lg font-semibold text-purple-700 wrap-text">
              Mẹo quản lý nội dung
            </h3>
            <ul className="list-disc pl-5 text-gray-600">
              <li className="wrap-text">Sử dụng thẻ tag để phân loại bài viết dễ dàng hơn.</li>
              <li className="wrap-text">Cập nhật hình ảnh thường xuyên để thu hút người xem.</li>
              <li className="wrap-text">Lưu bài viết quan trọng vào danh sách yêu thích.</li>
              <li className="wrap-text">Xóa bài viết không cần thiết để giữ danh sách gọn gàng.</li>
            </ul>
          </div>
          <div
            className={`p-4 rounded-lg shadow-sm border flex-1 ${getThemeClasses(
              theme,
              "tips"
            )}`}
          >
            <h3 className="text-lg font-semibold text-pink-700 wrap-text">
              Gợi ý hành động
            </h3>
            <p className="text-gray-600 wrap-text">{getActionSuggestion()}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`p-4 rounded-lg shadow-sm border flex-1 ${getThemeClasses(
              theme,
              "export"
            )}`}
          >
            <h3 className="text-lg font-semibold text-yellow-700 wrap-text">
              Xuất danh sách
            </h3>
            <button
              onClick={exportArticles}
              className="bg-yellow-300 hover:bg-yellow-400 text-white px-4 py-2 rounded mt-2 transition-all duration-300 text-sm"
            >
              Tải về JSON
            </button>
          </div>
          <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
        </div>
      </div>

      {notification && (
        <div className="absolute top-5 right-5 z-50">
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        </div>
      )}

      {showConfirm && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <Confirm
            message={confirmMessage}
            onConfirm={confirmAction}
            onCancel={() => setShowConfirm(false)}
          />
        </div>
      )}

{showLoginModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent">

            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Yêu cầu đăng nhập</h3>
              <p className="text-gray-600 mb-6">Vui lòng đăng nhập để xem thống kê bài viết.</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleLoginRedirect}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition duration-200"
                >
                  Đăng nhập
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}