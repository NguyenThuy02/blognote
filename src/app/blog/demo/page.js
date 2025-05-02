
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
  const [selectedKeyword, setSelectedKeyword] = useState("");
  const [sortOption, setSortOption] = useState(""); // none, a-z, z-a, newest, oldest
  const [viewMode, setViewMode] = useState("grid"); // grid, list
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [itemsPerPage] = useState(9);
  const [errorMessage, setErrorMessage] = useState(null);
  const [theme, setTheme] = useState("light");
  const [searchQuery, setSearchQuery] = useState("");
  const detailRef = useRef(null);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme") || "light";
      setTheme(savedTheme);
    } catch (err) {
      setErrorMessage("Không thể tải giao diện: " + err.message);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("theme", theme);
    } catch (err) {
      setErrorMessage("Không thể lưu giao diện: " + err.message);
    }
  }, [theme]);

  const truncateText = (text, maxLength) => {
    if (!text) return "Không có nội dung";
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  const isValidUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    try {
      new URL(url);
      return url.startsWith("http://") || url.startsWith("https://");
    } catch {
      return false;
    }
  };

  const isJsonString = (str) => {
    if (typeof str !== "string") return false;
    return str.trim().startsWith("{") || str.trim().startsWith("[");
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (isValidUrl(path)) return path;
    const { data } = supabase.storage
      .from("postpurpose-images")
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const getDescriptionContent = (article) => {
    if (
      article.events_timeline?.title &&
      Array.isArray(article.events_timeline.milestones) &&
      article.events_timeline.milestones.some((m) => m.description)
    ) {
      const firstMilestone =
        article.events_timeline.milestones.find((m) => m.description) || {};
      return (
        <div className="description-content events-timeline">
          <strong className="description-label animate-fade-in">
            Mô tả nội dung:
          </strong>{" "}
          <span className="animate-fade-in delay-1">
            {article.events_timeline.title}
          </span>
          <br />
          {firstMilestone.time && (
            <>
              <span className="animate-fade-in delay-2">
                Thời gian:{" "}
                <span className="text-blue-600">
                  {new Date(firstMilestone.time).toLocaleDateString("vi-VN")}
                </span>
              </span>
              <br />
              <span className="animate-fade-in delay-3">
                Mô tả: {firstMilestone.description}
              </span>
              <br />
            </>
          )}
          <span className="animate-fade-in delay-4">
            Trạng thái:{" "}
            <span className="text-purple-600">
              {firstMilestone.status || "Không xác định"}
            </span>
          </span>
        </div>
      );
    }

    if (
      Array.isArray(article.quiz_questions) &&
      article.quiz_questions.some((q) => q.question && q.options.some((o) => o))
    ) {
      const firstQuestion =
        article.quiz_questions.find(
          (q) => q.question && q.options.some((o) => o)
        ) || {};
      return (
        <div className="description-content quiz-questions">
          <strong className="description-label animate-fade-in">
            Câu hỏi:
          </strong>{" "}
          <span className="animate-fade-in delay-1">
            {firstQuestion.question || "Không có câu hỏi"}
          </span>
          <ul className="list-disc list-inside mt-1">
            {Array.isArray(firstQuestion.options) &&
              firstQuestion.options
                .filter((o) => o)
                .map((option, i) => (
                  <li
                    key={i}
                    className="text-gray-600"
                    style={{ animationDelay: `${0.2 * (i + 1)}s` }}
                  >
                    {String.fromCharCode(65 + i)}: {option}
                  </li>
                ))}
          </ul>
        </div>
      );
    }

    if (
      article.survey?.title &&
      Array.isArray(article.survey.options) &&
      article.survey.options.some((o) => o)
    ) {
      return (
        <div className="description-content poll">
          <strong className="description-label animate-fade-in">
            Cuộc bình chọn:
          </strong>{" "}
          <span className="animate-fade-in delay-1">
            {article.survey.title}
          </span>
          <ul className="list-disc list-inside mt-1">
            {article.survey.options
              .filter((o) => o)
              .map((option, i) => (
                <li
                  key={i}
                  className="text-gray-600"
                  style={{ animationDelay: `${0.2 * (i + 1)}s` }}
                >
                  {option}
                </li>
              ))}
          </ul>
        </div>
      );
    }

    if (
      article.story_type &&
      article.story_type.toLowerCase().includes("truyện tranh") &&
      article.description
    ) {
      return (
        <div className="description-content comics">
          <strong className="description-label animate-fade-in">
            Mô tả nội dung:
          </strong>{" "}
          <span className="animate-fade-in delay-1">{article.description}</span>
          <br />
          <span className="animate-fade-in delay-2">
            <span className="text-orange-600">{article.story_type}</span>
          </span>
        </div>
      );
    }

    if (
      Array.isArray(article.short_quizzes) &&
      article.short_quizzes.some((q) => q.question && q.answer)
    ) {
      const firstQuiz =
        article.short_quizzes.find((q) => q.question && q.answer) || {};
      return (
        <div className="description-content short-quiz">
          <strong className="description-label animate-fade-in">
            Tóm tắt câu đố:
          </strong>{" "}
          <span className="text-purple-600 animate-fade-in delay-1">
            {firstQuiz.question || "Không có câu đố"}
          </span>
          <br />
          <span className="animate-fade-in delay-2">
            Đáp án:{" "}
            <span className="text-blue-600">
              {firstQuiz.answer || "Không có đáp án"}
            </span>
          </span>
        </div>
      );
    }

    return (
      <div className="description-content default-content animate-shake">
        Không có nội dung
      </div>
    );
  };

  useEffect(() => {
    const fetchArticlesAndVotes = async () => {
      try {
        setErrorMessage(null);

        const { data: purposesData, error: purposesError } = await supabase
          .from("postpurpose")
          .select("*");
        if (purposesError) throw new Error(purposesError.message);

        const defaultFormData = {
          quiz_questions: [
            {
              question: "",
              options: ["", ""],
              multipleChoice: false,
              correctOptions: [],
            },
          ],
          survey: { title: "", options: ["", ""], multipleChoice: false },
          short_quizzes: [{ question: "", answer: "" }],
          events_timeline: {
            title: "",
            milestones: [
              {
                time: new Date().toISOString().split("T")[0],
                description: "",
                status: "Hoàn thành",
              },
            ],
          },
        };

        const cleanedArticles = purposesData.map((purpose) => {
          let images = [];
          if (typeof purpose.images === "string") {
            if (isJsonString(purpose.images)) {
              try {
                images = JSON.parse(purpose.images)
                  .map((img) => getImageUrl(img))
                  .filter(isValidUrl);
              } catch (e) {
                console.error(
                  `Failed to parse images JSON for purpose ${purpose.id}:`,
                  e
                );
                images = [];
              }
            } else if (isValidUrl(purpose.images)) {
              images = [getImageUrl(purpose.images)];
            }
          } else if (Array.isArray(purpose.images)) {
            images = purpose.images
              .map((img) => getImageUrl(img))
              .filter(isValidUrl);
          }

          const tags =
            typeof purpose.tags === "string"
              ? purpose.tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter((tag) => tag)
              : Array.isArray(purpose.tags)
              ? purpose.tags.filter((tag) => tag)
              : [];
          const topics =
            typeof purpose.topics === "string"
              ? purpose.topics
                  .split(",")
                  .map((topic) => topic.trim())
                  .filter((topic) => topic)
              : Array.isArray(purpose.topics)
              ? purpose.topics.filter((topic) => topic)
              : [];

          const storyDoc = purpose.story_doc || purpose.storyDoc;
          const documentUrl =
            storyDoc && !isValidUrl(storyDoc)
              ? supabase.storage
                  .from("postpurpose-images")
                  .getPublicUrl(storyDoc).data.publicUrl
              : storyDoc;

          return {
            id: purpose.id,
            title: purpose.purpose || purpose.topics || "Không có tiêu đề",
            author: purpose.name || "Ẩn danh",
            story_type: purpose.purpose || "Không xác định",
            description: purpose.story_description || "",
            document: documentUrl || null,
            categories: topics,
            keywords: tags,
            media_images: images,
            quiz_questions: Array.isArray(purpose.questions)
              ? purpose.questions.map((q) => ({
                  ...q,
                  image: q.image ? getImageUrl(q.image) : null,
                  correctOptions: Array.isArray(q.correctOptions)
                    ? q.correctOptions
                    : [],
                }))
              : defaultFormData.quiz_questions,
            survey: purpose.poll || defaultFormData.survey,
            short_quizzes: Array.isArray(purpose.quizzes)
              ? purpose.quizzes.map((q) => ({
                  ...q,
                  image: q.image ? getImageUrl(q.image) : null,
                }))
              : defaultFormData.short_quizzes,
            events_timeline:
              purpose.timeline || defaultFormData.events_timeline,
            created_at: purpose.created_at
              ? new Date(purpose.created_at)
              : new Date(),
          };
        });

        setArticles(cleanedArticles);
        setCategories([
          ...new Set(cleanedArticles.flatMap((article) => article.categories)),
        ]);
        setKeywords([
          ...new Set(cleanedArticles.flatMap((article) => article.keywords)),
        ]);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error.message);
        setErrorMessage("Không thể tải bài viết. Vui lòng thử lại sau.");
      }
    };

    fetchArticlesAndVotes();
  }, []);

  const filteredArticles = articles
    .filter((article) => {
      const matchesCategory = selectedCategory
        ? article.categories.includes(selectedCategory)
        : true;
      const matchesKeyword = selectedKeyword
        ? article.keywords.includes(selectedKeyword)
        : true;
      const matchesSearch = searchQuery
        ? article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          article.author?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesCategory && matchesKeyword && matchesSearch;
    })
    .sort((a, b) => {
      if (sortOption === "newest") return b.created_at - a.created_at;
      else if (sortOption === "oldest") return a.created_at - b.created_at;
      else if (sortOption === "a-z") return a.title.localeCompare(b.title);
      else if (sortOption === "z-a") return b.title.localeCompare(a.title);
      return 0;
    });

  const featuredArticles = articles
    .filter(
      (article) => article.media_images.length + (article.document ? 1 : 0) >= 2
    )
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, 5);

  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
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
      className={`mt-[97px] p-5 mb-[-7px] max-w-7xl text-gray-800 mx-auto rounded-lg shadow-md border border-blue-200 relative ${themes[theme]} animate-fade-in`}
    >
      <div
        className={`p-6 rounded-lg shadow-lg border border-gray-200 ${getThemeClasses(
          theme,
          "container"
        )}`}
      >
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
                  {article.media_images.length > 0 ? (
                    <Image
                      src={article.media_images[0]}
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
                      {truncateText(article.description, 80)}
                    </p>
                  </div>
                </div>
              ))}
            </Carousel>
          </div>
        )}

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
                setSelectedKeyword("");
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
              Chọn danh mục:
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
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
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
              Chọn từ khóa:
            </label>
            <select
              value={selectedKeyword}
              onChange={(e) => setSelectedKeyword(e.target.value)}
              className={`w-full border-2 border-purple-400 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:border-purple-600 rounded-xl px-4 py-2 text-sm transition-all duration-300 shadow-sm ${getThemeClasses(
                theme,
                "select"
              )}`}
            >
              <option value="">Tất cả</option>
              {keywords.map((keyword) => (
                <option key={keyword} value={keyword}>
                  {keyword}
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
              className={`p-4 border border-blue-300 rounded-lg shadow-md transition-transform duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer relative bg-white flex ${
                viewMode === "grid" ? "flex-col h-[400px]" : "flex-row h-[150px]"
              } ${getThemeClasses(theme, "preview")}`}
            >
              {viewMode === "list" && (
                <div className="relative w-[150px] h-[100px] mr-2 flex-shrink-0">
                  {article.media_images.length > 0 ? (
                    <Image
                      src={article.media_images[0]}
                      alt={`Hình ảnh xem trước cho ${article.title}`}
                      width={150}
                      height={100}
                      className="w-full h-full rounded-md object-cover"
                      loading="lazy"
                      onError={() =>
                        console.warn(
                          `Không thể tải hình ảnh: ${article.media_images[0]}`
                        )
                      }
                    />
                  ) : article.document ? (
                    <a
                      href={article.document}
                      className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition-all duration-300 wrap-text w-full"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Mở tài liệu ${getFileName(
                        article.document
                      )} trong tab mới`}
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
                      <span className="truncate text-xs">
                        {getFileName(article.document)}
                      </span>
                    </a>
                  ) : (
                    <div className="w-[150px] h-[100px] bg-gray-200 flex items-center justify-center rounded-md">
                      <p className="text-gray-500 text-xs wrap-text">
                        Không có media
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div
                className={viewMode === "list" ? "flex-1 relative" : "flex-1 flex flex-col relative"}
              >
                <div className="absolute top-4 right-4 flex gap-2 h-[1.7rem]">
                  {article.categories.map((category) => (
                    <span
                      key={category}
                      className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm wrap-text line-clamp-1"
                    >
                      {category}
                    </span>
                  ))}
                </div>

                <h3
                  className={`text-lg font-bold text-gray-800 wrap-text line-clamp-2 h-[3rem] mt-1 ${
                    viewMode === "grid" ? "pr-20" : "pr-0"
                  }`}
                >
                  {truncateText(article.title, viewMode === "grid" ? 50 : 100)}
                </h3>

                <div
                  className={`mt-1 flex items-baseline h-[6rem] overflow-hidden`}
                >
                  <div className="wrap-text text-sm text-gray-700 flex-1">
                    {getDescriptionContent(article)}
                  </div>
                </div>

                {viewMode === "grid" && (
                  <div className="mt-1 flex justify-center h-[100px]">
                    {article.media_images.length > 0 ? (
                      <div className="relative w-[150px] h-[100px]">
                        <Image
                          src={article.media_images[0]}
                          alt={`Hình ảnh xem trước cho ${article.title}`}
                          width={150}
                          height={100}
                          className="rounded-md object-cover w-full h-full"
                          loading="lazy"
                          onError={() =>
                            console.warn(
                              `Không thể tải hình ảnh: ${article.media_images[0]}`
                            )
                          }
                        />
                      </div>
                    ) : article.document ? (
                      <a
                        href={article.document}
                        className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition-all duration-300 wrap-text w-[150px] h-[36px]"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Mở tài liệu ${getFileName(
                          article.document
                        )} trong tab mới`}
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
                        <span className="truncate text-xs">
                          {getFileName(article.document)}
                        </span>
                      </a>
                    ) : (
                      <div className="w-[150px] h-[100px] bg-gray-200 flex items-center justify-center rounded-md">
                        <p className="text-gray-500 text-xs wrap-text">
                          Không có media
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className={`mt-0.5 flex flex-wrap gap-2 h-[2rem] overflow-hidden ${viewMode === "list" ? "mt-1" : ""}`}>
                  {article.keywords.length > 0 ? (
                    article.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm wrap-text line-clamp-1"
                      >
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm wrap-text">
                      Không có từ khóa
                    </p>
                  )}
                </div>

                {viewMode === "grid" ? (
                  <>
                    <p
                      className="absolute bottom-2 right-4 text-blue-500 font-bold text-sm wrap-text line-clamp-1 h-[1.5rem]"
                      style={{ zIndex: 10 }}
                    >
                      {article.author}
                    </p>
                    {article.media_images.length > 1 && (
                      <div className="mt-0.5 h-[1.5rem]">
                        <span className="inline-block bg-blue-500 bg-opacity-60 text-white text-xs rounded px-1 py-0.5 wrap-text">
                          +{article.media_images.length - 1} hình ảnh
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p
                      className="absolute bottom-2 right-2 text-blue-500 font-bold text-sm wrap-text line-clamp-1 h-[1.5rem]"
                      style={{ zIndex: 10 }}
                    >
                      {article.author}
                    </p>
                    {article.media_images.length > 1 && (
                      <div className="mt-1 h-[1.5rem]">
                        <span className="inline-block bg-blue-500 bg-opacity-60 text-white text-xs rounded px-1 py-0.5 wrap-text">
                          +{article.media_images.length - 1} hình ảnh
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

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
                {selectedArticle.categories.map((category) => (
                  <span
                    key={category}
                    className="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm wrap-text"
                  >
                    {category}
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
                    {selectedArticle.title || "Không có tiêu đề"}
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
                    {selectedArticle.description || "Không có nội dung"}
                  </p>
                </div>
                <div>
                  <strong
                    className={`text-xl font-bold text-gray-800 relative inline-block wrap-text mb-4 ${getThemeClasses(
                      theme,
                      "subtitle"
                    )}`}
                  >
                    Từ khóa
                    <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                  </strong>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.keywords.length > 0 ? (
                      selectedArticle.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm transition-all duration-300 hover:bg-blue-200 wrap-text"
                        >
                          {keyword}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-700 wrap-text">
                        Không có từ khóa
                      </p>
                    )}
                  </div>
                </div>
                {selectedArticle.media_images.length > 0 && (
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
                      {selectedArticle.media_images.map((image, index) => (
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
                {selectedArticle.document && (
                  <div>
                    <strong
                      className={`text-xl font-bold text-gray-800 relative inline-block wrap-text ${getThemeClasses(
                        theme,
                        "subtitle"
                      )}`}
                    >
                      Tài liệu
                      <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                    </strong>
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      <a
                        href={selectedArticle.document}
                        className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition-all duration-300 wrap-text"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Mở tài liệu ${getFileName(
                          selectedArticle.document
                        )} trong tab mới`}
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
                        <span className="truncate">
                          {getFileName(selectedArticle.document)}
                        </span>
                      </a>
                    </div>
                  </div>
                )}
                {selectedArticle.quiz_questions.some(
                  (q) => q.question && q.options.some((o) => o)
                ) && (
                  <div>
                    <strong
                      className={`text-xl font-bold text-gray-800 relative inline-block wrap-text ${getThemeClasses(
                        theme,
                        "subtitle"
                      )}`}
                    >
                      Câu hỏi trắc nghiệm
                      <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                    </strong>
                    <div className="mt-3 space-y-4">
                      {selectedArticle.quiz_questions.map(
                        (q, index) =>
                          q.question &&
                          q.options.some((o) => o) && (
                            <div
                              key={index}
                              className="p-4 bg-blue-50 rounded-lg shadow-sm"
                            >
                              <p className="font-semibold text-gray-800 wrap-text">
                                {q.question}
                              </p>
                              <ul className="mt-2 list-disc list-inside text-gray-700">
                                {q.options.map(
                                  (option, i) =>
                                    option && (
                                      <li key={i} className="wrap-text">
                                        {String.fromCharCode(65 + i)}: {option}{" "}
                                        {q.correctOptions.includes(i)
                                          ? "(Đúng)"
                                          : ""}
                                      </li>
                                    )
                                )}
                              </ul>
                              <p className="mt-2 text-sm text-gray-600 wrap-text">
                                Loại:{" "}
                                {q.multipleChoice
                                  ? "Trắc nghiệm nhiều lựa chọn"
                                  : "Trắc nghiệm một lựa chọn"}
                              </p>
                            </div>
                          )
                      )}
                    </div>
                  </div>
                )}
                {selectedArticle.survey.title &&
                  selectedArticle.survey.options.some((o) => o) && (
                    <div>
                      <strong
                        className={`text-xl font-bold text-gray-800 relative inline-block wrap-text ${getThemeClasses(
                          theme,
                          "subtitle"
                        )}`}
                      >
                        Khảo sát
                        <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                      </strong>
                      <div className="mt-3 p-4 bg-blue-50 rounded-lg shadow-sm">
                        <p className="font-semibold text-gray-800 wrap-text">
                          {selectedArticle.survey.title}
                        </p>
                        <ul className="mt-2 list-disc list-inside text-gray-700">
                          {selectedArticle.survey.options.map(
                            (option, i) =>
                              option && (
                                <li key={i} className="wrap-text">
                                  {option}
                                </li>
                              )
                          )}
                        </ul>
                        <p className="mt-2 text-sm text-gray-600 wrap-text">
                          Loại:{" "}
                          {selectedArticle.survey.multipleChoice
                            ? "Khảo sát nhiều lựa chọn"
                            : "Khảo sát một lựa chọn"}
                        </p>
                      </div>
                    </div>
                  )}
                {selectedArticle.short_quizzes.some(
                  (q) => q.question && q.answer
                ) && (
                  <div>
                    <strong
                      className={`text-xl font-bold text-gray-800 relative inline-block wrap-text ${getThemeClasses(
                        theme,
                        "subtitle"
                      )}`}
                    >
                      Câu đố ngắn
                      <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                    </strong>
                    <div className="mt-3 space-y-4">
                      {selectedArticle.short_quizzes.map(
                        (q, index) =>
                          q.question &&
                          q.answer && (
                            <div
                              key={index}
                              className="p-4 bg-blue-50 rounded-lg shadow-sm"
                            >
                              <p className="font-semibold text-gray-800 wrap-text">
                                {q.question}
                              </p>
                              <p className="mt-2 text-gray-700 wrap-text">
                                Đáp án: {q.answer}
                              </p>
                            </div>
                          )
                      )}
                    </div>
                  </div>
                )}
                {selectedArticle.events_timeline.title &&
                  selectedArticle.events_timeline.milestones.some(
                    (m) => m.description
                  ) && (
                    <div>
                      <strong
                        className={`text-xl font-bold text-gray-800 relative inline-block wrap-text ${getThemeClasses(
                          theme,
                          "subtitle"
                        )}`}
                      >
                        Dòng thời gian sự kiện
                        <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                      </strong>
                      <div className="mt-3 p-4 bg-blue-50 rounded-lg shadow-sm">
                        <p className="font-semibold text-gray-800 wrap-text">
                          {selectedArticle.events_timeline.title}
                        </p>
                        <div className="mt-3 space-y-3">
                          {selectedArticle.events_timeline.milestones.map(
                            (m, index) =>
                              m.description && (
                                <div
                                  key={index}
                                  className="flex items-start gap-3"
                                >
                                  <span className="text-blue-500 font-semibold wrap-text min-w-[100px]">
                                    {m.time}
                                  </span>
                                  <div>
                                    <p className="text-gray-700 wrap-text">
                                      {m.description}
                                    </p>
                                    <p className="text-gray-600 text-sm wrap-text">
                                      Trạng thái: {m.status}
                                    </p>
                                  </div>
                                </div>
                              )
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                <p className="text-blue-500 font-bold wrap-text text-right mt-2">
                  Tác giả: {selectedArticle.author}
                </p>
              </div>
            </div>
          </div>
        )}

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
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-2px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(2px);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-shake {
          animation: shake 1s ease-in-out;
        }
        .delay-1 {
          animation-delay: 0.2s;
        }
        .delay-2 {
          animation-delay: 0.4s;
        }
        .delay-3 {
          animation-delay: 0.6s;
        }
        .delay-4 {
          animation-delay: 0.8s;
        }
        .wrap-text {
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .grid > div {
          display: flex;
          flex-direction: column;
          height: 400px;
          justify-content: flex-start;
        }
        .flex-row {
          display: flex;
          flex-direction: row;
          height: 150px;
          justify-content: flex-start;
          align-items: center;
        }
        .grid .flex-1,
        .flex-row .flex-1 {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          position: relative;
        }
        .grid .h-\[1\.5rem\],
        .flex-row .h-\[1\.5rem\] {
          height: 1.5rem;
          overflow: hidden;
        }
        .grid .h-\[3rem\],
        .flex-row .h-\[3rem\] {
          height: 3rem;
          overflow: hidden;
        }
        .grid .h-\[6rem\],
        .flex-row .h-\[6rem\] {
          height: 6rem;
          overflow: hidden;
        }
        .grid .h-\[100px\] {
          height: 100px;
          overflow: hidden;
        }
        .grid .h-\[36px\] {
          height: 36px;
          overflow: hidden;
        }
        .grid .h-\[2rem\],
        .flex-row .h-\[2rem\] {
          height: 2rem;
          overflow: hidden;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .flex.items-baseline {
          display: flex;
          align-items: baseline;
        }
        .description-content {
          background: linear-gradient(
            to right,
            rgba(219, 234, 254, 0.5),
            rgba(233, 213, 255, 0.5)
          );
          padding: 8px;
          border-radius: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .description-content:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          background: linear-gradient(
            to right,
            rgba(191, 219, 254, 0.7),
            rgba(221, 214, 254, 0.7)
          );
        }
        .events-timeline:hover {
          border: 1px solid #3b82f6;
        }
        .quiz-questions:hover {
          border: 1px solid #a855f7;
        }
        .poll:hover {
          border: 1px solid #10b981;
        }
        .comics:hover {
          border: 1px solid #f97316;
        }
        .short-quiz:hover {
          border: 1px solid #2563eb;
          box-shadow: 0 0 8px rgba(37, 99, 235, 0.5);
        }
        .default-content {
          color: #6b7280;
        }
        .default-content:hover {
          color: #1f2937;
          background: linear-gradient(
            to right,
            rgba(191, 219, 254, 0.9),
            rgba(221, 214, 254, 0.9)
          );
        }
        .description-label {
          background: linear-gradient(to right, #3b82f6, #a855f7);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
