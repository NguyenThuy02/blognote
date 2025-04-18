"use client";
import { useState } from "react";

export default function YoutubeEmbedPopup() {
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ"); // Mặc định là video YouTube nổi tiếng
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mở/đóng modal
  const toggleModal = () => setIsModalOpen((prev) => !prev);

  // Chọn video từ YouTube trang chủ
  const loadHomepageVideo = () => {
    // Đây là video ngẫu nhiên từ YouTube trang chủ mà bạn có thể thay đổi
    window.location.href = "https://www.youtube.com"; // Chuyển hướng đến trang chủ YouTube
  };

  return (
    <div className="mt-70 max-w-xl mx-auto p-4">
      {/* Nút mở popup với UI YouTube */}
      <button
        onClick={toggleModal}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-all duration-300 flex items-center space-x-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M22.54 6.42c-.24-.89-.94-1.56-1.83-1.83C19.6 4.17 12 4.17 12 4.17s-7.6 0-8.71.42c-.89.27-1.59.94-1.83 1.83C1.42 7.42 1.42 12 1.42 12s0 4.58.42 5.58c.24.89.94 1.56 1.83 1.83 1.11.42 8.71.42 8.71.42s7.6 0 8.71-.42c.89-.27 1.59-.94 1.83-1.83.42-1.01.42-5.58.42-5.58s0-4.58-.42-5.58zM9.5 14.5v-5l5.5 2.5-5.5 2.5z" />
        </svg>
        <span>Nhúng video YouTube ngẫu nhiên</span>
      </button>

      {/* Nút để chuyển hướng tới trang chủ YouTube */}
      <button
        onClick={loadHomepageVideo}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-300 flex items-center space-x-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10 18l6-6-6-6v12zm-8-6c0-8 6-8 8-8h4c2 0 8 0 8 8v0c0 8-6 8-8 8h-4c-2 0-8 0-8-8v0z" />
        </svg>
        <span>Trang Chủ YouTube</span>
      </button>

      {/* Popup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-full">
            <h3 className="text-xl font-semibold mb-4">Video YouTube Ngẫu Nhiên</h3>
            <button
              onClick={toggleModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            >
              ✖
            </button>

            {/* Nhúng video YouTube */}
            <div className="mt-4">
              <iframe
                width="100%"
                height="400"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
