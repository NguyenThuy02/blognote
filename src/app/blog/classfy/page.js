"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabase } from "../../../lib/supabase";

export default function ClassfyApp() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [articles, setArticles] = useState([]);
  const [topics, setTopics] = useState([]);
  const [tags, setTags] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [itemsPerPage] = useState(9);
  const [errorMessage, setErrorMessage] = useState(null);
  const detailRef = useRef(null);

  // Hàm rút gọn văn bản
  const truncateText = (text, maxLength) => {
    if (!text) return "Không có nội dung";
    return text.length > maxLength
      ? text.slice(0, maxLength) + "..."
      : text;
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
          .filter((item) => item && isValidUrl(item));
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
            "id, title, content, topics, tags, name, images, videos, files"
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
              `Invalid image URLs in article ${article.id}:`,
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
          };
        });

        setArticles(processedData);
        setTopics([
          ...new Set(processedData.flatMap((article) => article.topics)),
        ]);
        setTags([...new Set(processedData.flatMap((article) => article.tags))]);
      } catch (error) {
        console.error("Error fetching articles:", error.message);
        setErrorMessage("Không thể tải bài viết. Vui lòng thử lại sau.");
      }
    };

    fetchArticles();
  });

  const filteredArticles = articles.filter((article) => {
    const matchesCategory = selectedCategory
      ? article.topics.includes(selectedCategory)
      : true;
    const matchesTag = selectedTag ? article.tags.includes(selectedTag) : true;
    return matchesCategory && matchesTag;
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
    <div className="mt-24 p-5 rounded-lg shadow-md border border-blue-200 text-gray-700 relative">
      <div className="min-h-screen rounded-lg bg-blue-100 flex flex-col">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 text-center my-5">
          Phân loại bài viết
        </h1>
        <style jsx>{`
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
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out;
          }
        `}</style>

        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mx-8 mb-4">
            {errorMessage}
          </div>
        )}

        <div className="p-5 rounded-lg shadow-md border border-gray-200 bg-gray-100 mx-8 flex-grow">
          <div className="flex items-center mb-6">
            <div className="mr-12">
              <label className="mr-2 text-xl font-semibold text-gray-700">
                Chọn chủ đề:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-gray-700 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-400 focus:ring focus:ring-blue-300 transition duration-200 bg-white"
              >
                <option value="">Tất cả</option>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mr-2 text-xl font-semibold text-gray-700">
                Chọn tag:
              </label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="text-gray-700 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-400 focus:ring focus:ring-blue-300 transition duration-200 bg-white"
              >
                <option value="">Tất cả</option>
                {tags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16 mx-8">
            {paginatedArticles.length === 0 && (
              <p className="col-span-full text-center text-gray-500">
                Không tìm thấy bài viết nào.
              </p>
            )}
            {paginatedArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => handleArticleClick(article)}
                className="bg-white p-4 text-gray-700 rounded-lg shadow transition-transform duration-200 hover:shadow-xl hover:-translate-y-1 flex flex-col cursor-pointer relative"
              >
                {/* Chủ đề ở góc trên bên phải */}
                {article.topics.length > 0 ? (
                  <div className="absolute top-4 right-4 text-blue-500">
                    {article.topics.map((topic) => (
                      <span
                        key={topic}
                        className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm mr-1 mb-1"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="absolute top-4 right-4 text-blue-500">
                    Không có chủ đề
                  </div>
                )}

                <h3 className="text-lg font-semibold text-gray-800 pr-20">
                  {truncateText(article.title, 50)}
                </h3>
                <div className="mt-3 flex items-baseline">
                  <strong className="mr-2 whitespace-nowrap">Mô tả:</strong>
                  <p>{truncateText(article.content, 100)}</p>
                </div>

                {/* Hiển thị media */}
                <div className="mt-3">
                  {article.images.length > 0 ? (
                    <div className="relative w-[150px] h-[100px] mx-auto">
                      <div className="flex justify-center items-center w-full h-full bg-gray-200 rounded-md overflow-hidden">
                        <Image
                          src={article.images[0]}
                          alt={`Preview image for ${article.title}`}
                          width={150}
                          height={100}
                          className="rounded-md object-cover"
                          loading="lazy"
                          onError={() =>
                            console.warn(
                              `Failed to load image: ${article.images[0]}`
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
                            `Failed to load video: ${article.videos[0]}`
                          )
                        }
                      >
                        <source src={article.videos[0]} type="video/mp4" />
                        Trình duyệt của bạn không hỗ trợ video.
                      </video>
                    </div>
                  ) : article.files.length > 0 ? (
                    <div className="relative w-[150px] h-[100px] mx-auto flex items-center justify-center bg-gray-200 rounded-md">
                      <a
                        href={article.files[0]}
                        className="text-blue-500 hover:underline text-xs text-center px-2"
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
                          className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">Không có tags</p>
                    )}
                  </div>
                  <p className="text-blue-500 font-semibold">
                    {article.name || "Chưa có tác giả"}
                  </p>
                </div>

                {/* Badges hiển thị số lượng video và tệp - dưới cùng */}
                {(article.videos.length > 1 || article.files.length > 1) && (
                  <div className="mt-2 flex gap-2">
                    {article.videos.length > 1 && (
                      <span className="inline-block bg-blue-500 bg-opacity-60 text-white text-xs rounded px-1 py-0.5">
                        +{article.videos.length - 1} video
                      </span>
                    )}
                    {article.files.length > 1 && (
                      <span className="inline-block bg-blue-500 bg-opacity-60 text-white text-xs rounded px-1 py-0.5">
                        +{article.files.length - 1} tệp
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-gradient-to-r from-blue-400 to-purple-400 px-4 py-2 rounded transition duration-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 mr-2 disabled:opacity-50"
              >
                Trước
              </button>
              <span className="px-4 py-2 text-lg">{`${currentPage} / ${totalPages}`}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="bg-gradient-to-r from-blue-400 to-purple-400 px-4 py-2 rounded transition duration-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 ml-2 disabled:opacity-50"
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
            className="p-8 bg-gradient-to-b from-gray-50 to-white mx-8 animate-fadeIn"
          >
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg relative">
              {/* Chủ đề ở góc trên bên phải */}
              {selectedArticle.topics.length > 0 && (
                <div className="absolute top-8 right-8 text-blue-500">
                  {selectedArticle.topics.map((topic) => (
                    <span
                      key={topic}
                      className="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm mr-2 mb-2"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
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
                  <strong className="text-xl font-semibold text-gray-800 relative inline-block">
                    Tiêu đề
                    <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                  </strong>
                  <p className="mt-3 text-lg text-gray-700">
                    {selectedArticle.title}
                  </p>
                </div>

                <div>
                  <strong className="text-xl font-semibold text-gray-800 relative inline-block">
                    Mô tả
                    <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                  </strong>
                  <p className="mt-3 text-gray-700 leading-relaxed">
                    {selectedArticle.content || "Không có mô tả"}
                  </p>
                </div>

                <div>
                  <strong className="text-xl font-semibold text-gray-800 relative inline-block">
                    Tags
                    <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                  </strong>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.length > 0 ? (
                      selectedArticle.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm transition-all duration-300 hover:bg-blue-200"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-700">Không có tags</p>
                    )}
                  </div>
                </div>

                {selectedArticle.images.length > 0 && (
                  <div>
                    <strong className="text-xl font-semibold text-gray-800 relative inline-block">
                      Hình ảnh
                      <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                    </strong>
                    <div className="mt-4 flex flex-col gap-4">
                      {selectedArticle.images.map((image, index) => (
                        <div
                          key={index}
                          className="relative w-[250px] h-[200px] mx-auto rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:scale-105"
                        >
                          <Image
                            src={image}
                            alt={`Image ${index + 1} for ${
                              selectedArticle.title
                            }`}
                            width={250}
                            height={200}
                            className="rounded-lg object-cover"
                            loading="lazy"
                            onError={() =>
                              console.warn(`Failed to load image: ${image}`)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedArticle.videos.length > 0 && (
                  <div>
                    <strong className="text-xl font-semibold text-gray-800 relative inline-block">
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
                              console.warn(`Failed to load video: ${video}`)
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
                    <strong className="text-xl font-semibold text-gray-800 relative inline-block">
                      Tệp tin
                      <span className="absolute left-0 bottom-0 h-0.5 w-12 bg-blue-400"></span>
                    </strong>
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      {selectedArticle.files.map((file, index) => (
                        <a
                          key={index}
                          href={file}
                          className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg text-blue-600 hover:bg-blue-50 transition-all duration-300"
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
                  <p className="text-blue-500 font-semibold">
                    Tác giả: {selectedArticle.name || "Chưa có tác giả"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}