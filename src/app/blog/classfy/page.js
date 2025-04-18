"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabase } from "../../../lib/supabase";
import ThemeSelector, { themes, getThemeClasses } from "../../../utils/color";

export default function ClassfyApp() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sortOption, setSortOption] = useState(""); // none, a-z, z-a, newest, oldest
  const [articles, setArticles] = useState([]);
  const [topics, setTopics] = useState([]);
  const [tags, setTags] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [itemsPerPage] = useState(9);
  const [errorMessage, setErrorMessage] = useState(null);
  const [theme, setTheme] = useState("light");
  const [searchQuery, setSearchQuery] = useState("");
  const detailRef = useRef(null);

  // Tải chủ đề từ localStorage khi khởi tạo
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme") || "light";
      setTheme(savedTheme);
    } catch (err) {
      setErrorMessage("Không thể tải giao diện: " + err.message);
    }
  }, []);

  // Lưu chủ đề vào localStorage khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem("theme", theme);
    } catch (err) {
      setErrorMessage("Không thể lưu giao diện: " + err.message);
    }
  }, [theme]);

  // Hàm rút gọn văn bản
  const truncateText = (text, maxLength) => {
    if (!text) return "Không có nội dung";
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  // Hàm hỗ trợ chuyển đổi chuỗi hoặc JSON thành mảng
  const parseArray = (data) => {
    if (Array.isArray(data))
      return data.filter((item) => item && typeof item === "string");
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed))
          return parsed.filter((item) => item && typeof item === "string");
      } catch (e) {
        return data
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item);
      }
    }
    return [];
  };

  // Hàm kiểm tra URL hợp lệ
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select(
            "id, title, content, topics, tags, name, images, videos, files, created_at"
          );

        if (error) {
          throw error;
        }

        const processedData = data.map((article) => {
          const images = parseArray(article.images).filter(isValidUrl);
          const videos = parseArray(article.videos).filter(isValidUrl);
          const files = parseArray(article.files).filter(isValidUrl);

          if (
            article.images &&
            images.length === 0 &&
            article.images.length > 0
          ) {
            console.warn(
              `URL hình ảnh không hợp lệ trong bài viết ${article.id}:`,
              article.images
            );
          }

          return {
            ...article,
            topics: parseArray(article.topics),
            tags: parseArray(article.tags),
            images,
            videos,
            files,
            created_at: article.created_at
              ? new Date(article.created_at)
              : new Date(),
          };
        });

        setArticles(processedData);
        setTopics([
          ...new Set(processedData.flatMap((article) => article.topics)),
        ]);
        setTags([...new Set(processedData.flatMap((article) => article.tags))]);
      } catch (error) {
        console.error("Lỗi khi tải bài viết:", error.message);
        setErrorMessage("Không thể tải bài viết. Vui lòng thử lại sau.");
      }
    };

    fetchArticles();
  }, []);

  const filteredArticles = articles
    .filter((article) => {
      const matchesCategory = selectedCategory
        ? article.topics.includes(selectedCategory)
        : true;
      const matchesTag = selectedTag
        ? article.tags.includes(selectedTag)
        : true;
      const matchesSearch = searchQuery
        ? article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesCategory && matchesTag && matchesSearch;
    })
    .sort((a, b) => {
      if (sortOption === "newest") {
        return b.created_at - a.created_at;
      } else if (sortOption === "oldest") {
        return a.created_at - b.created_at;
      } else if (sortOption === "a-z") {
        return a.title.localeCompare(b.title);
      } else if (sortOption === "z-a") {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const closeDetailForm = () => {
    setSelectedArticle(null);
  };

  const getFileName = (url) => {
    if (!url) return "Tệp không xác định";
    const fileName = url.split("/").pop();
    return fileName ? decodeURIComponent(fileName) : "Tệp không xác định";
  };

  return (
    <div
      className={`mt-[97px] p-5 mb-[-7px] rounded-lg shadow-md border border-blue-200 relative ${themes[theme]} animate-fade-in`}
    >
      <div
        className={`p-6 rounded-lg shadow-lg border border-gray-200 ${getThemeClasses(
          theme,
          "container"
        )}`}
      >
        {/* Thanh công cụ phía trên */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-lg">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent break-words">
            Phân loại bài viết
          </h1>
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-2 border-purple-400 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:border-purple-600 rounded-xl px-4 py-2 text-sm transition-all duration-300 shadow-sm"
            />
            <button
              onClick={() => {
                setSelectedCategory("");
                setSelectedTag("");
                setSortOption("");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="bg-gradient-to-r from-blue-400 to-purple-400 px-4 py-2 rounded-lg transition duration-200 hover:from-blue-500 hover:to-purple-500 text-white shadow-sm"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mx-8 mb-4 break-words">
            {errorMessage}
          </div>
        )}

        <div className="mb-6 flex flex-col sm:flex-row gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <label className="block mb-1 text-lg font-semibold text-gray-700 break-words">
              Chọn chủ đề:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border-2 border-purple-400 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:border-purple-600 rounded-xl px-4 py-2 text-sm transition-all duration-300 shadow-sm"
            >
              <option value="">Tất cả</option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-0">
            <label className="block mb-1 text-lg font-semibold text-gray-700 break-words">
              Chọn tag:
            </label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full border-2 border-purple-400 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:border-purple-600 rounded-xl px-4 py-2 text-sm transition-all duration-300 shadow-sm"
            >
              <option value="">Tất cả</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-0">
            <label className="block mb-1 text-lg font-semibold text-gray-700 break-words">
              Sắp xếp theo:
            </label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full border-2 border-purple-400 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:border-purple-600 rounded-xl px-4 py-2 text-sm transition-all duration-300 shadow-sm"
            >
              <option value="none">Không sắp xếp</option>
              <option value="a-z">A-Z</option>
              <option value="z-a">Z-A</option>
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16 mx-8">
          {paginatedArticles.length === 0 && (
            <p className="col-span-full text-center text-gray-500 break-words">
              Không tìm thấy bài viết nào.
            </p>
          )}
          {paginatedArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => handleArticleClick(article)}
              className={`p-4 border border-blue-300 rounded-lg shadow-md transition-transform duration-200 hover:shadow-xl hover:-translate-y-1 flex flex-col cursor-pointer relative ${getThemeClasses(
                theme,
                "preview"
              )}`}
            >
              {/* Chủ đề */}
              <div className="absolute top-4 right-4 flex gap-2">
                {article.topics.map((topic) => (
                  <span
                    key={topic}
                    className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm break-words"
                  >
                    {topic}
                  </span>
                ))}
              </div>

              <h3 className="text-lg font-semibold text-gray-800 pr-20 break-words">
                {truncateText(article.title, 50)}
              </h3>
              <div className="mt-3 flex items-baseline">
                <strong className="mr-2 whitespace-nowrap">Mô tả:</strong>
                <p className="break-words line-clamp-2">
                  {truncateText(article.content, 100)}
                </p>
              </div>

              {/* Hiển thị media */}
              <div className="mt-3">
                {article.images.length > 0 ? (
                  <div className="relative w-[150px] h-[100px] mx-auto">
                    <div className="flex justify-center items-center w-full h-full rounded-md overflow-hidden">
                      <Image
                        src={article.images[0]}
                        alt={`Hình ảnh xem trước cho ${article.title}`}
                        width={150}
                        height={100}
                        className="rounded-md object-cover"
                        loading="lazy"
                        onError={() =>
                          console.warn(
                            `Không thể tải hình ảnh: ${article.images[0]}`
                          )
                        }
                      />
                    </div>
                  </div>
                ) : article.videos.length > 0 ? (
                  <div className="relative w-[150px] h-[100px] mx-auto">
                    <video
                      className="w-full h-full rounded-md object-cover"
                      controls
                      loading="lazy"
                      onError={() =>
                        console.warn(
                          `Không thể tải video: ${article.videos[0]}`
                        )
                      }
                    >
                      <source src={article.videos[0]} type="video/mp4" />
                      Trình duyệt của bạn không hỗ trợ video.
                    </video>
                  </div>
                ) : article.files.length > 0 ? (
                  <div className="relative w-[150px] h-[100px] mx-auto flex items-center justify-center rounded-md">
                    <a
                      href={article.files[0]}
                      className="text-blue-500 hover:underline text-xs text-center px-2 break-words"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {getFileName(article.files[0])}
                    </a>
                  </div>
                ) : null}
              </div>

              {/* Tags và tác giả cùng hàng */}
              <div className="mt-3 flex justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  {article.tags.length > 0 ? (
                    article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm break-words"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm break-words">
                      Không có tags
                    </p>
                  )}
                </div>
                <p className="text-blue-500 font-semibold break-words">
                  {article.name || "Chưa có tác giả"}
                </p>
              </div>

              {/* Badges hiển thị số lượng video và tệp */}
              {(article.videos.length > 1 || article.files.length > 1) && (
                <div className="mt-2 flex gap-2">
                  {article.videos.length > 1 && (
                    <span className="inline-block bg-blue-500 bg-opacity-60 text-white text-xs rounded px-1 py-0.5 break-words">
                      +{article.videos.length - 1} video
                    </span>
                  )}
                  {article.files.length > 1 && (
                    <span className="inline-block bg-blue-500 bg-opacity-60 text-white text-xs rounded px-1 py-0.5 break-words">
                      +{article.files.length - 1} tệp
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-gradient-to-r from-blue-400 to-purple-400 px-4 py-2 rounded-lg transition duration-200 hover:from-blue-500 hover:to-purple-500 text-white disabled:opacity-50"
            >
              Trước
            </button>
            <span className="px-4 py-2 text-lg">{`${currentPage} / ${totalPages}`}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-gradient-to-r from-blue-400 to-purple-400 px-4 py-2 rounded-lg transition duration-200 hover:from-blue-500 hover:to-purple-500 text-white disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Chi tiết bài viết */}
      {selectedArticle && (
        <div
          ref={detailRef}
          className={`mt-5 p-8 rounded-lg shadow-lg border border-gray-200 animate-fade-in ${getThemeClasses(
            theme,
            "editor"
          )}`}
        >
          <div className="max-w-4xl mx-auto p-8 rounded-xl shadow-lg bg-white">
            {/* Chủ đề */}
            <div className="absolute top-8 right-8 flex gap-2">
              {selectedArticle.topics.map((topic) => (
                <span
                  key={topic}
                  className="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm break-words"
                >
                  {topic}
                </span>
              ))}
            </div>

            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent break-words">
                Chi tiết bài viết
              </h2>
              <button
                onClick={closeDetailForm}
                className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-500 transition-all duration-300"
                aria-label="Đóng chi tiết bài viết"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <strong className="text-xl font-semibold text-gray-800 relative inline-block break-words">
                  Tiêu đề
                  <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                </strong>
                <p className="mt-3 text-lg text-gray-700 break-words">
                  {selectedArticle.title}
                </p>
              </div>

              <div>
                <strong className="text-xl font-semibold text-gray-800 relative inline-block break-words">
                  Mô tả
                  <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                </strong>
                <p className="mt-3 text-gray-700 leading-relaxed break-words">
                  {selectedArticle.content || "Không có mô tả"}
                </p>
              </div>

              <div>
                <strong className="text-xl font-semibold text-gray-800 relative inline-block break-words mb-4">
                  Tags
                  <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                </strong>
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.tags.length > 0 ? (
                    selectedArticle.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm transition-all duration-300 hover:bg-blue-200 break-words"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-700 break-words">Không có tags</p>
                  )}
                </div>
              </div>

              {selectedArticle.images.length > 0 && (
                <div>
                  <strong className="text-xl font-semibold text-gray-800 relative inline-block break-words">
                    Hình ảnh
                    <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                  </strong>
                  <div className="mt-4 flex flex-wrap justify-center gap-4">
                    {selectedArticle.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative w-full max-w-[300px] h-[200px] rounded-lg overflow-hidden shadow-md transition-transform duration-300 hover:scale-105"
                      >
                        <Image
                          src={image}
                          alt={`Hình ảnh ${index + 1} cho ${
                            selectedArticle.title
                          }`}
                          layout="fill"
                          className="rounded-lg object-cover"
                          loading="lazy"
                          onError={() =>
                            console.warn(`Không thể tải hình ảnh: ${image}`)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedArticle.videos.length > 0 && (
                <div>
                  <strong className="text-xl font-semibold text-gray-800 relative inline-block break-words">
                    Video
                    <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                  </strong>
                  <div className="mt-4 flex flex-col gap-4">
                    {selectedArticle.videos.map((video, index) => (
                      <div
                        key={index}
                        className="relative w-full max-w-[600px] h-[400px] mx-auto rounded-lg overflow-hidden shadow-md"
                      >
                        <video
                          className="w-full h-full rounded-lg object-cover"
                          controls
                          loading="lazy"
                          onError={() =>
                            console.warn(`Không thể tải video: ${video}`)
                          }
                        >
                          <source src={video} type="video/mp4" />
                          Trình duyệt của bạn không hỗ trợ video.
                        </video>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedArticle.files.length > 0 && (
                <div>
                  <strong className="text-xl font-semibold text-gray-800 relative inline-block break-words">
                    Tệp tin
                    <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                  </strong>
                  <div className="mt-3 grid grid-cols-1 gap-3">
                    {selectedArticle.files.map((file, index) => (
                      <a
                        key={index}
                        href={file}
                        className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition-all duration-300 break-words"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg
                          className="w-5 h-5 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="truncate">{getFileName(file)}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-right">
                <p className="text-blue-500 font-semibold break-words">
                  Tác giả: {selectedArticle.name || "Chưa có tác giả"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phần chọn giao diện */}
      <div
        className={`mt-5 p-6 rounded-lg shadow-lg border border-gray-200 ${getThemeClasses(
          theme,
          "support"
        )}`}
      >
        <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent break-words">
          Cài đặt giao diện
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
        </div>
      </div>
    </div>
  );
}
