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

        // Xử lý dữ liệu bài viết
        setArticles(data);

        // Lấy danh sách chủ đề
        const uniqueTopics = [
          ...new Set(
            data.flatMap((article) => {
              if (typeof article.topics === "string") {
                return article.topics
                  .split(",")
                  .map((topic) => topic.trim())
                  .filter((topic) => topic);
              }
              return article.topics || [];
            })
          ),
        ];

        // Lấy danh sách tag
        const uniqueTags = [
          ...new Set(
            data.flatMap((article) => {
              if (typeof article.tags === "string") {
                return article.tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter((tag) => tag);
              }
              return article.tags || [];
            })
          ),
        ];

        setTopics(uniqueTopics);
        setTags(uniqueTags);
      } catch (error) {
        console.error("Error fetching articles:", error.message);
        setErrorMessage("Không thể tải bài viết. Vui lòng thử lại sau.");
      }
    };

    fetchArticles();
  }, []);

  const filteredArticles = articles.filter((article) => {
    const articleTopics = Array.isArray(article.topics)
      ? article.topics
      : typeof article.topics === "string"
      ? article.topics.split(",").map((topic) => topic.trim())
      : [];
    const articleTags = Array.isArray(article.tags)
      ? article.tags
      : typeof article.tags === "string"
      ? article.tags.split(",").map((tag) => tag.trim())
      : [];

    const matchesCategory = selectedCategory
      ? articleTopics.includes(selectedCategory)
      : true;
    const matchesTag = selectedTag ? articleTags.includes(selectedTag) : true;
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

  return (
    <div className="text-gray-700 mt-[97px] flex flex-col min-h-screen">
      {/* Hiển thị thông báo lỗi nếu có */}
      {errorMessage && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mx-8 mb-4">
          {errorMessage}
        </div>
      )}

      {/* Background cho danh sách bài viết */}
      <div className="p-5 rounded-lg shadow-md border border-gray-200 bg-gray-100 mx-8 flex-grow">
        <h1 className="text-2xl font-bold mb-5 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Phân loại bài viết
        </h1>

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
              {article.topics &&
                (Array.isArray(article.topics) ||
                  typeof article.topics === "string") && (
                  <div className="absolute top-4 right-4 text-blue-500">
                    {(Array.isArray(article.topics)
                      ? article.topics
                      : article.topics.split(",").map((topic) => topic.trim())
                    ).map((topic) => (
                      <span
                        key={topic}
                        className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm mr-1 mb-1"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              {!article.topics && (
                <div className="absolute top-4 right-4 text-blue-500">
                  Không có chủ đề
                </div>
              )}

              <h3 className="text-lg font-semibold text-gray-800 pr-20">
                {article.title}
              </h3>
              <div className="mt-3 flex items-baseline">
                <strong className="mr-2 whitespace-nowrap">Mô tả:</strong>
                <p>{article.content || "Không có mô tả"}</p>
              </div>

              {/* Tags ở giữa */}
              <div className="mt-3 flex flex-wrap">
                {article.tags &&
                (Array.isArray(article.tags) ||
                  typeof article.tags === "string") ? (
                  (Array.isArray(article.tags)
                    ? article.tags
                    : article.tags.split(",").map((tag) => tag.trim())
                  ).map((tag) => (
                    <span
                      key={tag}
                      className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm mr-2 mb-1"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <p>Không có tags</p>
                )}
              </div>

              {/* Tác giả ở góc dưới bên phải */}
              <p className="absolute bottom-4 right-4 text-blue-500 font-semibold">
                {article.name || "Chưa có tác giả"}
              </p>
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

      {/* Background riêng cho chi tiết bài viết */}
      {selectedArticle && (
        <div
          ref={detailRef}
          className="p-5 bg-gray-50 border-t border-gray-200 mx-8"
        >
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 relative">
            {/* Chủ đề ở góc trên bên phải */}
            {selectedArticle.topics &&
              (Array.isArray(selectedArticle.topics) ||
                typeof selectedArticle.topics === "string") && (
                <div className="absolute top-6 right-6 text-blue-500">
                  {(Array.isArray(selectedArticle.topics)
                    ? selectedArticle.topics
                    : selectedArticle.topics
                        .split(",")
                        .map((topic) => topic.trim())
                  ).map((topic) => (
                    <span
                      key={topic}
                      className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm mr-1 mb-1"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 pr-20">
                Chi tiết bài viết
              </h2>
              <button
                onClick={closeDetailForm}
                className="text-gray-500 hover:text-red-500 transition duration-200"
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
            <div className="space-y-4">
              <div>
                <strong className="text-gray-700">Tiêu đề:</strong>
                <p className="mt-1">{selectedArticle.title}</p>
              </div>
              <div>
                <strong className="text-gray-700">Mô tả:</strong>
                <p className="mt-1">
                  {selectedArticle.content || "Không có mô tả"}
                </p>
              </div>

              {/* Tags ở giữa */}
              <div className="mt-3 flex flex-wrap">
                {selectedArticle.tags &&
                (Array.isArray(selectedArticle.tags) ||
                  typeof selectedArticle.tags === "string") ? (
                  (Array.isArray(selectedArticle.tags)
                    ? selectedArticle.tags
                    : selectedArticle.tags.split(",").map((tag) => tag.trim())
                  ).map((tag) => (
                    <span
                      key={tag}
                      className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm mr-2 mb-1"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <p>Không có tags</p>
                )}
              </div>

              {/* Hiển thị hình ảnh */}
              {selectedArticle.images &&
                Array.isArray(selectedArticle.images) &&
                selectedArticle.images.length > 0 && (
                  <div>
                    <strong className="text-gray-700">Hình ảnh:</strong>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedArticle.images.map((image, index) => (
                        <Image
                          key={index}
                          src={image}
                          alt={`image-${index}`}
                          width={150}
                          height={100}
                          className="rounded-md"
                        />
                      ))}
                    </div>
                  </div>
                )}

              {/* Hiển thị video */}
              {selectedArticle.videos &&
                Array.isArray(selectedArticle.videos) &&
                selectedArticle.videos.length > 0 && (
                  <div>
                    <strong className="text-gray-700">Video:</strong>
                    <div className="mt-2">
                      {selectedArticle.videos.map((video, index) => (
                        <video key={index} controls className="w-full mt-2">
                          <source src={video} type="video/mp4" />
                          Trình duyệt của bạn không hỗ trợ video.
                        </video>
                      ))}
                    </div>
                  </div>
                )}

              {/* Hiển thị file */}
              {selectedArticle.files &&
                Array.isArray(selectedArticle.files) &&
                selectedArticle.files.length > 0 && (
                  <div>
                    <strong className="text-gray-700">Tệp tin:</strong>
                    <div className="mt-2">
                      {selectedArticle.files.map((file, index) => (
                        <a
                          key={index}
                          href={file}
                          className="block text-blue-500 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Tệp {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              {/* Tác giả ở góc dưới bên phải */}
              <p className="absolute bottom-6 right-6 text-blue-500 font-semibold">
                {selectedArticle.name || "Chưa có tác giả"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
