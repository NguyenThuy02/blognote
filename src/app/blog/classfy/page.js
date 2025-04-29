"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabase } from "../../../lib/supabase";
import ThemeSelector, { themes, getThemeClasses } from "../../../utils/color";
import ScrollToTop from "../../../utils/scroll";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

export default function ClassfyApp() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sortOption, setSortOption] = useState(""); // none, a-z, z-a, newest, oldest
  const [viewMode, setViewMode] = useState("grid"); // grid, list
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

  // Tải chủ đề từ localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme") || "light";
      setTheme(savedTheme);
    } catch (err) {
      setErrorMessage("Không thể tải giao diện: " + err.message);
    }
  }, []);

  // Lưu chủ đề vào localStorage
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

  // Hàm chuyển đổi chuỗi/JSON thành mảng
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

  // Tải bài viết từ Supabase
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select(
            "id, title, content, topics, tags, name, images, videos, files, created_at"
          );

        if (error) throw error;

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

  // Lọc và sắp xếp bài viết
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
      if (sortOption === "newest") return b.created_at - a.created_at;
      else if (sortOption === "oldest") return a.created_at - b.created_at;
      else if (sortOption === "a-z") return a.title.localeCompare(b.title);
      else if (sortOption === "z-a") return b.title.localeCompare(a.title);
      return 0;
    });

  // Bài viết nổi bật cho carousel
  const featuredArticles = articles
    .filter(
      (article) =>
        article.images.length + article.videos.length + article.files.length >=
        2
    )
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, 5);

  // Gợi ý bài viết liên quan
  const getRelatedArticles = (article) => {
    if (!article) return [];
    return articles
      .filter(
        (a) =>
          a.id !== article.id &&
          (a.topics.some((t) => article.topics.includes(t)) ||
            a.tags.some((t) => article.tags.includes(t)))
      )
      .slice(0, 3);
  };

  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Xử lý phân trang
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  // Xử lý chọn bài viết
  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Đóng chi tiết bài viết
  const closeDetailForm = () => {
    setSelectedArticle(null);
  };

  // Lấy tên tệp từ URL
  const getFileName = (url) => {
    if (!url) return "Tệp không xác định";
    const fileName = url.split("/").pop();
    return fileName ? decodeURIComponent(fileName) : "Tệp không xác định";
  };

  return (
    <div
      className={`mt-[97px] p-5 mb-[-7px] max-w-7xl text-gray-800 mx-auto rounded-lg shadow-md border border-blue-200 relative ${themes[theme]} animate-fade-in`}
    >
      <div
        className={`p-6 rounded-lg shadow-lg border border-gray-200 ${getThemeClasses(
          theme,
          "container"
        )}`}
      >
        {/* Tiêu đề với hiệu ứng parallax */}
        <div className="relative h-32 mb-6 overflow-hidden rounded-xl parallax-header">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 transform translate-y-0 transition-transform duration-1000 ease-out"></div>
          <h1
            className={`relative text-3xl font-bold text-white text-center pt-10 z-10 wrap-text ${getThemeClasses(
              theme,
              "title"
            )}`}
          >
            Khám phá bài viết
          </h1>
        </div>

        {/* Carousel bài viết nổi bật */}
        {featuredArticles.length > 0 && (
          <div className="mb-8">
            <h2
              className={`text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500 wrap-text ${getThemeClasses(
                theme,
                "subtitle"
              )}`}
            >
              Bài viết nổi bật
            </h2>
            <Carousel
              showThumbs={false}
              autoPlay
              infiniteLoop
              interval={5000}
              showStatus={false}
              className="rounded-lg shadow-md"
            >
              {featuredArticles.map((article) => (
                <div
                  key={article.id}
                  className="relative h-64 cursor-pointer"
                  onClick={() => handleArticleClick(article)}
                >
                  {article.images.length > 0 ? (
                    <Image
                      src={article.images[0]}
                      alt={`Hình ảnh nổi bật cho ${article.title}`}
                      layout="fill"
                      className="object-cover rounded-lg"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full bg-gray-200 flex items-center justify-center rounded-lg">
                      <p className="text-gray-500 wrap-text">
                        Không có hình ảnh
                      </p>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-opacity-50 p-4 rounded-b-lg">
                    <h3 className="text-purple-700 font-bold wrap-text">
                      {truncateText(article.title, 50)}
                    </h3>
                    <p className="text-purple-600 text-sm wrap-text">
                      {truncateText(article.content, 80)}
                    </p>
                  </div>
                </div>
              ))}
            </Carousel>
          </div>
        )}

        {/* Thanh công cụ lọc */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 shadow-sm">
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`border-2 border-purple-400 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:border-purple-600 rounded-xl px-4 py-2 text-sm transition-all duration-300 shadow-sm ${getThemeClasses(
              theme,
              "input"
            )}`}
          />
          <div className="flex gap-4 items-center">
            <button
              onClick={() => {
                setSelectedCategory("");
                setSelectedTag("");
                setSortOption("");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className={`bg-gradient-to-r from-blue-400 to-purple-400 px-4 py-2 rounded-lg transition duration-200 hover:from-blue-500 hover:to-purple-500 text-white shadow-sm ${getThemeClasses(
                theme,
                "button"
              )}`}
            >
              Xóa bộ lọc
            </button>
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className={`bg-gradient-to-r from-blue-400 to-purple-400 px-4 py-2 rounded-lg transition duration-200 hover:from-blue-500 hover:to-purple-500 text-white shadow-sm ${getThemeClasses(
                theme,
                "button"
              )}`}
            >
              {viewMode === "grid" ? "Xem dạng danh sách" : "Xem dạng lưới"}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mx-8 mb-4 wrap-text">
            {errorMessage}
          </div>
        )}

        <div className="mb-6 flex flex-col sm:flex-row gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <label
              className={`block mb-1 text-lg font-bold text-gray-700 wrap-text ${getThemeClasses(
                theme,
                "subtitle"
              )}`}
            >
              Chọn chủ đề:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full border-2 border-purple-400 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:border-purple-600 rounded-xl px-4 py-2 text-sm transition-all duration-300 shadow-sm ${getThemeClasses(
                theme,
                "select"
              )}`}
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
            <label
              className={`block mb-1 text-lg font-bold text-gray-700 wrap-text ${getThemeClasses(
                theme,
                "subtitle"
              )}`}
            >
              Chọn tag:
            </label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className={`w-full border-2 border-purple-400 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:border-purple-600 rounded-xl px-4 py-2 text-sm transition-all duration-300 shadow-sm ${getThemeClasses(
                theme,
                "select"
              )}`}
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
            <label
              className={`block mb-1 text-lg font-bold text-gray-700 wrap-text ${getThemeClasses(
                theme,
                "subtitle"
              )}`}
            >
              Sắp xếp theo:
            </label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className={`w-full border-2 border-purple-400 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:border-purple-600 rounded-xl px-4 py-2 text-sm transition-all duration-300 shadow-sm ${getThemeClasses(
                theme,
                "select"
              )}`}
            >
              <option value="none">Không sắp xếp</option>
              <option value="a-z">A-Z</option>
              <option value="z-a">Z-A</option>
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
            </select>
          </div>
        </div>

        {/* Danh sách bài viết */}
        <div
          className={`mx-4 sm:mx-8 ${
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              : "flex flex-col gap-4"
          }`}
        >
          {paginatedArticles.length === 0 && (
            <p className="col-span-full text-center text-gray-500 wrap-text">
              Không tìm thấy bài viết nào.
            </p>
          )}
          {paginatedArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => handleArticleClick(article)}
              className={`p-4 border border-blue-300 rounded-lg shadow-md transition-transform duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer relative bg-white ${
                viewMode === "grid"
                  ? "flex flex-col h-full"
                  : "flex items-center gap-4"
              } ${getThemeClasses(theme, "preview")}`}
            >
              {/* Media (chỉ hiển thị bên trái trong chế độ list) */}
              {viewMode === "list" && (
                <div className="relative w-[150px] h-[100px] mx-auto flex-shrink-0">
                  {article.images.length > 0 ? (
                    <Image
                      src={article.images[0]}
                      alt={`Hình ảnh xem trước cho ${article.title}`}
                      width={150}
                      height={100}
                      className="w-full h-full rounded-md object-cover"
                      loading="lazy"
                      onError={() =>
                        console.warn(
                          `Không thể tải hình ảnh: ${article.images[0]}`
                        )
                      }
                    />
                  ) : article.videos.length > 0 ? (
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
                  ) : article.files.length > 0 ? (
                    <div className="relative w-[150px] h-[100px] mx-auto flex items-center justify-center rounded-md bg-gray-100">
                      <a
                        href={article.files[0]}
                        className="text-blue-500 hover:underline text-xs text-center wrap-text px-2"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {getFileName(article.files[0])}
                      </a>
                    </div>
                  ) : (
                    <div className="w-[150px] h-[100px] bg-gray-200 flex items-center justify-center rounded-md mx-auto">
                      <p className="text-gray-500 text-xs wrap-text">
                        Không có media
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Nội dung bài viết */}
              <div className={viewMode === "list" ? "flex-1" : ""}>
                {/* Chủ đề */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {article.topics.map((topic) => (
                    <span
                      key={topic}
                      className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm wrap-text"
                    >
                      {topic}
                    </span>
                  ))}
                </div>

                {/* Tiêu đề */}
                <h3
                  className={`text-lg font-bold text-gray-800 wrap-text ${
                    viewMode === "grid"
                      ? "pr-20 line-clamp-2 min-h-[3rem]"
                      : "pr-0"
                  }`}
                >
                  {truncateText(article.title, viewMode === "grid" ? 50 : 100)}
                </h3>

                {/* Mô tả */}
                <div
                  className={`mt-3 flex items-baseline ${
                    viewMode === "grid" ? "min-h-[4rem]" : ""
                  }`}
                >
                  <strong className="mr-2 whitespace-nowrap">Mô tả:</strong>
                  <p
                    className={`wrap-text ${
                      viewMode === "grid" ? "line-clamp-3" : ""
                    }`}
                  >
                    {truncateText(
                      article.content,
                      viewMode === "grid" ? 100 : 150
                    )}
                  </p>
                </div>

                {/* Media (chỉ hiển thị trong chế độ grid) */}
                {viewMode === "grid" && (
                  <div className="mt-3 flex justify-center">
                    {article.images.length > 0 ? (
                      <div className="relative w-[150px] h-[100px]">
                        <Image
                          src={article.images[0]}
                          alt={`Hình ảnh xem trước cho ${article.title}`}
                          width={150}
                          height={100}
                          className="rounded-md object-cover w-full h-full"
                          loading="lazy"
                          onError={() =>
                            console.warn(
                              `Không thể tải hình ảnh: ${article.images[0]}`
                            )
                          }
                        />
                      </div>
                    ) : article.videos.length > 0 ? (
                      <div className="relative w-[150px] h-[100px]">
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
                      <div className="relative w-[150px] h-[100px] flex items-center justify-center rounded-md bg-gray-100">
                        <a
                          href={article.files[0]}
                          className="text-blue-500 hover:underline text-xs text-center wrap-text px-2"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {getFileName(article.files[0])}
                        </a>
                      </div>
                    ) : (
                      <div className="relative w-[150px] h-[100px] bg-gray-200 flex items-center justify-center rounded-md">
                        <p className="text-gray-500 text-xs wrap-text">
                          Không có media
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags và tác giả */}
                <div
                  className={`mt-3 ${
                    viewMode === "grid"
                      ? "align-bottom-container flex-1 flex flex-col justify-end"
                      : "flex justify-between items-end"
                  }`}
                >
                  <div className="flex flex-wrap gap-2">
                    {article.tags.length > 0 ? (
                      article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm wrap-text"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm wrap-text">
                        Không có tags
                      </p>
                    )}
                  </div>
                  <p
                    className={`text-blue-500 font-bold wrap-text ${
                      viewMode === "grid" ? "text-right mt-2" : ""
                    }`}
                  >
                    {article.name || "Chưa có tác giả"}
                  </p>
                </div>

                {/* Badges media */}
                {(article.images.length > 1 ||
                  article.videos.length > 1 ||
                  article.files.length > 1) && (
                  <div className="mt-2 flex gap-2">
                    {article.images.length > 1 && (
                      <span className="inline-block bg-blue-500 bg-opacity-60 text-white text-xs rounded px-1 py-0.5 wrap-text">
                        +{article.images.length - 1} hình ảnh
                      </span>
                    )}
                    {article.videos.length > 1 && (
                      <span className="inline-block bg-blue-500 bg-opacity-60 text-white text-xs rounded px-1 py-0.5 wrap-text">
                        +{article.videos.length - 1} video
                      </span>
                    )}
                    {article.files.length > 1 && (
                      <span className="inline-block bg-blue-500 bg-opacity-60 text-white text-xs rounded px-1 py-0.5 wrap-text">
                        +{article.files.length - 1} tệp
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`bg-gradient-to-r from-blue-400 to-purple-400 px-4 py-2 rounded-lg transition duration-200 hover:from-blue-500 hover:to-purple-500 text-white disabled:opacity-50 ${getThemeClasses(
                theme,
                "button"
              )}`}
            >
              Trước
            </button>
            <span className="px-4 py-2 text-lg wrap-text">{`${currentPage} / ${totalPages}`}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`bg-gradient-to-r from-blue-400 to-purple-400 px-4 py-2 rounded-lg transition duration-200 hover:from-blue-500 hover:to-purple-500 text-white disabled:opacity-50 ${getThemeClasses(
                theme,
                "button"
              )}`}
            >
              Sau
            </button>
          </div>
        )}

        {/* Gợi ý bài viết liên quan */}
        {selectedArticle && getRelatedArticles(selectedArticle).length > 0 && (
          <div className="mt-8">
            <h2
              className={`text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 wrap-text ${getThemeClasses(
                theme,
                "subtitle"
              )}`}
            >
              Bài viết liên quan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mx-4 sm:mx-8">
              {getRelatedArticles(selectedArticle).map((article) => (
                <div
                  key={article.id}
                  onClick={() => handleArticleClick(article)}
                  className={`p-4 border border-blue-300 rounded-lg shadow-md transition-transform duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer relative bg-white flex flex-col h-full ${getThemeClasses(
                    theme,
                    "preview"
                  )}`}
                >
                  {/* Chủ đề */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    {article.topics.map((topic) => (
                      <span
                        key={topic}
                        className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm wrap-text"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>

                  {/* Tiêu đề */}
                  <h3 className="text-lg font-bold text-gray-800 pr-20 wrap-text line-clamp-2 min-h-[3rem]">
                    {truncateText(article.title, 50)}
                  </h3>

                  {/* Mô tả */}
                  <div className="mt-3 flex items-baseline min-h-[4rem]">
                    <strong className="mr-2 whitespace-nowrap">Mô tả:</strong>
                    <p className="wrap-text line-clamp-3">
                      {truncateText(article.content, 100)}
                    </p>
                  </div>

                  {/* Media */}
                  <div className="mt-3 flex justify-center">
                    {article.images.length > 0 ? (
                      <div className="relative w-[150px] h-[100px]">
                        <Image
                          src={article.images[0]}
                          alt={`Hình ảnh xem trước cho ${article.title}`}
                          width={150}
                          height={100}
                          className="rounded-md object-cover w-full h-full"
                          loading="lazy"
                          onError={() =>
                            console.warn(
                              `Không thể tải hình ảnh: ${article.images[0]}`
                            )
                          }
                        />
                      </div>
                    ) : (
                      <div className="relative w-[150px] h-[100px] bg-gray-200 flex items-center justify-center rounded-md">
                        <p className="text-gray-500 text-xs wrap-text">
                          Không có media
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Tags và tác giả */}
                  <div className="mt-3 align-bottom-container flex-1 flex flex-col justify-end">
                    <div className="flex flex-wrap gap-2">
                      {article.tags.length > 0 ? (
                        article.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm wrap-text"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm wrap-text">
                          Không có tags
                        </p>
                      )}
                    </div>
                    <p className="text-blue-500 font-bold wrap-text text-right mt-2">
                      {article.name || "Chưa có tác giả"}
                    </p>
                  </div>

                  {/* Badges media */}
                  {(article.images.length > 1 ||
                    article.videos.length > 1 ||
                    article.files.length > 1) && (
                    <div className="mt-2 flex gap-2">
                      {article.images.length > 1 && (
                        <span className="inline-block bg-blue-500 bg-opacity-60 text-white text-xs rounded px-1 py-0.5 wrap-text">
                          +{article.images.length - 1} hình ảnh
                        </span>
                      )}
                      {article.videos.length > 1 && (
                        <span className="inline-block bg-blue-500 bg-opacity-60 text-white text-xs rounded px-1 py-0.5 wrap-text">
                          +{article.videos.length - 1} video
                        </span>
                      )}
                      {article.files.length > 1 && (
                        <span className="inline-block bg-blue-500 bg-opacity-60 text-white text-xs rounded px-1 py-0.5 wrap-text">
                          +{article.files.length - 1} tệp
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
              <div className="absolute top-8 right-8 flex gap-2">
                {selectedArticle.topics.map((topic) => (
                  <span
                    key={topic}
                    className="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm wrap-text"
                  >
                    {topic}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center mb-8">
                <h2
                  className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 wrap-text ${getThemeClasses(
                    theme,
                    "title"
                  )}`}
                >
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
                  <strong
                    className={`text-xl font-bold text-gray-800 relative inline-block wrap-text ${getThemeClasses(
                      theme,
                      "subtitle"
                    )}`}
                  >
                    Tiêu đề
                    <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                  </strong>
                  <p className="mt-3 text-lg text-gray-700 wrap-text">
                    {selectedArticle.title}
                  </p>
                </div>
                <div>
                  <strong
                    className={`text-xl font-bold text-gray-800 relative inline-block wrap-text ${getThemeClasses(
                      theme,
                      "subtitle"
                    )}`}
                  >
                    Mô tả
                    <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                  </strong>
                  <p className="mt-3 text-gray-700 leading-relaxed wrap-text">
                    {selectedArticle.content || "Không có mô tả"}
                  </p>
                </div>
                <div>
                  <strong
                    className={`text-xl font-bold text-gray-800 relative inline-block wrap-text mb-4 ${getThemeClasses(
                      theme,
                      "subtitle"
                    )}`}
                  >
                    Tags
                    <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                  </strong>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.length > 0 ? (
                      selectedArticle.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm transition-all duration-300 hover:bg-blue-200 wrap-text"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-700 wrap-text">Không có tags</p>
                    )}
                  </div>
                </div>
                {selectedArticle.images.length > 0 && (
                  <div>
                    <strong
                      className={`text-xl font-bold text-gray-800 relative inline-block wrap-text ${getThemeClasses(
                        theme,
                        "subtitle"
                      )}`}
                    >
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
                    <strong
                      className={`text-xl font-bold text-gray-800 relative inline-block wrap-text ${getThemeClasses(
                        theme,
                        "subtitle"
                      )}`}
                    >
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
                    <strong
                      className={`text-xl font-bold text-gray-800 relative inline-block wrap-text ${getThemeClasses(
                        theme,
                        "subtitle"
                      )}`}
                    >
                      Tệp tin
                      <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                    </strong>
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      {selectedArticle.files.map((file, index) => (
                        <a
                          key={index}
                          href={file}
                          className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition-all duration-300 wrap-text"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg
                            className="w-5 h-5 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
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

                <p className="text-blue-500 font-bold wrap-text text-right mt-2">
                  Tác giả: {selectedArticle.name || "Chưa có tác giả"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Phần chọn giao diện */}
        <div className="grid grid-cols-1 gap-4">
          <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
          <ScrollToTop />
        </div>
      </div>

      <style jsx>{`
        .parallax-header {
          background-attachment: fixed;
          background-position: center;
          background-size: cover;
        }
        .parallax-header:hover .bg-gradient-to-r {
          transform: translateY(-10px);
        }
        .no-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        .wrap-text {
          word-break: break-word;
          overflow-wrap: break-word;
        }
        /* Class để căn lề dưới cho tags và tên tác giả */
        .align-bottom-container {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          min-height: 4rem; /* Chiều cao tối thiểu cho tags và tác giả trong grid */
        }
        .align-bottom-container > p {
          margin: 0; /* Loại bỏ margin mặc định của tên tác giả */
        }
        /* Đảm bảo thẻ bài viết trong grid có chiều cao đồng đều */
        .grid > div {
          display: flex;
          flex-direction: column;
          min-height: 350px; /* Chiều cao tối thiểu cho mỗi thẻ bài viết trong grid */
        }
        /* Giới hạn chiều cao của tags trong grid */
        .grid .align-bottom-container .flex {
          max-height: 2.5rem; /* Giới hạn chiều cao khu vực tags trong grid */
          overflow: hidden;
        }
        /* Đảm bảo chế độ list giữ nguyên UI */
        .flex.items-center {
          display: flex;
          align-items: center;
        }
        .flex.items-center .align-bottom-container {
          min-height: auto; /* Loại bỏ chiều cao tối thiểu trong list */
          flex-direction: row; /* Giữ layout ngang cho list */
          justify-content: space-between; /* Giữ căn lề giữa tags và tác giả */
        }
        .flex.items-center .align-bottom-container .flex {
          max-height: none; /* Loại bỏ giới hạn chiều cao tags trong list */
        }
      `}</style>
    </div>
  );
}
