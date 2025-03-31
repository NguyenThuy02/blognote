"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "../../../lib/supabase"; // Đường dẫn tới tệp khởi tạo Supabase

export default function ClassfyApp() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [articles, setArticles] = useState([]);
  const [topics, setTopics] = useState([]);
  const [tags, setTags] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // 9 bài mỗi trang để đạt 3x3

  useEffect(() => {
    const fetchArticles = async () => {
      const { data, error } = await supabase.from("posts").select("*");

      if (error) {
        console.error("Error fetching articles:", error);
      } else {
        console.log("Fetched articles:", data); // Debug: Xem dữ liệu gốc
        setArticles(data);
        const uniqueTopics = [
          ...new Set(data.flatMap((article) => article.topics || [])),
        ];
        const uniqueTags = [
          ...new Set(data.flatMap((article) => article.tags || [])),
        ];
        console.log("Unique topics:", uniqueTopics); // Debug: Xem topics
        console.log("Unique tags:", uniqueTags); // Debug: Xem tags
        setTopics(uniqueTopics);
        setTags(uniqueTags);
      }
    };

    fetchArticles();
  }, []);

  const filteredArticles = articles.filter((article) => {
    const matchesCategory = selectedCategory
      ? article.topics?.includes(selectedCategory)
      : true;
    const matchesTag = selectedTag ? article.tags?.includes(selectedTag) : true;
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

  return (
    <div className="mt-[97px] p-5 mb-[-7px] rounded-lg shadow-md border border-gray-200 bg-gray-100 flex flex-col">
      <h1 className="text-4xl font-bold mb-5 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Phân loại bài viết
      </h1>

      <div className="flex items-center mb-4">
        <div className="mr-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedArticles.map((article) => (
          <div
            key={article.id}
            className="bg-white p-4 text-gray-700 rounded-lg shadow transition-transform duration-200 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full"
          >
            <h3 className="text-lg font-semibold text-gray-800">
              {article.title}
            </h3>

            <div className="mt-3 flex items-baseline">
              <strong className="mr-2 whitespace-nowrap">Nội dung:</strong>
              <p>{article.content || "Không có nội dung"}</p>
            </div>

            {/* Chủ đề với hiệu ứng badge */}
            {article.topics &&
              Array.isArray(article.topics) &&
              article.topics.length > 0 && (
                <div className="mt-3">
                  <strong>Chủ đề:</strong>
                  <div className="mt-2 flex flex-wrap">
                    {article.topics.map((topic) => (
                      <span
                        key={topic}
                        className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm mr-2 mb-1"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            {!article.topics && (
              <div className="mt-3 flex items-baseline">
                <strong className="mr-2 whitespace-nowrap">Chủ đề:</strong>
                <p>Không có chủ đề</p>
              </div>
            )}

           {/* Tags với hiệu ứng badge */}
<div className="mt-3">
  <strong>Tags:</strong>
  {article.tags && Array.isArray(article.tags) && article.tags.length > 0 ? (
    <div className="mt-2 flex flex-wrap">
      {article.tags.map((tag) => (
        <span
          key={tag}
          className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm mr-2 mb-1"
        >
          {tag}
        </span>
      ))}
    </div>
  ) : (
    <p>Không có tags</p>
  )}
</div>


            {article.images &&
              Array.isArray(article.images) &&
              article.images.length > 0 && (
                <div className="mt-3">
                  <strong>Hình ảnh:</strong>
                  {article.images.map((image, index) => (
                    <Image
                      key={index}
                      src={image}
                      alt={`image-${index}`}
                      width={150}
                      height={100}
                      className="rounded-md mb-3"
                    />
                  ))}
                </div>
              )}

            {article.files &&
              Array.isArray(article.files) &&
              article.files.length > 0 && (
                <div className="mt-3">
                  <strong>Tệp tin:</strong>
                  {article.files.map((file, index) => (
                    <a key={index} href={file} className="block text-blue-500">
                      Tệp {index + 1}
                    </a>
                  ))}
                </div>
              )}

            {article.videos &&
              Array.isArray(article.videos) &&
              article.videos.length > 0 && (
                <div className="mt-3">
                  <strong>Video:</strong>
                  {article.videos.map((video, index) => (
                    <video key={index} controls className="w-full mt-2">
                      <source src={video} type="video/mp4" />
                      Không được hỗ trợ!
                    </video>
                  ))}
                </div>
              )}

            <p className="mt-2 font-semibold text-gray-800">
              Được tạo bởi: {article.author || "Không rõ tác giả"}
            </p>
            <p className="mt-1 text-gray-500">
              Ngày: {article.date || "Không có ngày"}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="bg-gradient-to-r from-blue-400 to-purple-400 px-4 py-2 rounded transition duration-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 mr-2"
        >
          Trước
        </button>
        <span className="px-4 py-2 text-lg">{`${currentPage} of ${totalPages}`}</span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="bg-gradient-to-r from-blue-400 to-purple-400 px-4 py-2 rounded transition duration-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 ml-2"
        >
          Sau
        </button>
      </div>
    </div>
  );
}
