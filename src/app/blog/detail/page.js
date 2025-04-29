"use client";
import React from "react";
import Image from "next/image";
import { getThemeClasses } from "../../../../utils/color";

export default function DetailPage({ content, onClose, theme }) {
  if (!content) return null;

  const { type, data } = content;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`relative w-full max-w-3xl mx-4 p-6 rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto transition-all duration-300 transform translate-y-0 ${getThemeClasses(
          theme,
          "container"
        )}`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close modal"
        >
          &times;
        </button>

        {type === "article" && (
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
              {data.title}
            </h2>
            <div className="flex items-center mb-4">
              <div
                className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: "#A855F7" }}
              >
                {data.author[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="font-semibold text-blue-600 text-sm">{data.author}</p>
                <p className="text-sm text-gray-500">{data.created_at}</p>
              </div>
            </div>
            <p className="text-gray-700 text-base mb-4">{data.content}</p>
            {data.images && (
              <Image
                src={data.images}
                alt={data.title}
                width={527}
                height={435}
                className="rounded-md object-cover w-full h-auto mb-4"
              />
            )}
            {data.videos && (
              <video
                src={data.videos}
                controls
                width={527}
                height={435}
                className="rounded-md w-full h-auto mb-4 mx-auto"
              />
            )}
            {data.files && (
              <a
                href={data.files}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center text-sm mb-4"
              >
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Tải file
              </a>
            )}
            {data.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {data.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-blue-600 text-sm px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {type === "author" && (
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
              Thông tin tác giả
            </h2>
            <div className="flex items-center mb-4">
              <div
                className="w-12 h-12 bg-gray-200 rounded-full mr-3 flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: "#A855F7" }}
              >
                {data.name[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="font-semibold text-blue-600 text-sm">{data.name}</p>
                <p className="text-sm text-gray-500">{data.email}</p>
              </div>
            </div>
            {data.posts?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Bài viết của tác giả
                </h3>
                <ul className="space-y-2">
                  {data.posts.map((post) => (
                    <li key={post.id} className="border-b border-gray-200 pb-2">
                      <p className="text-gray-700 text-sm">{post.title}</p>
                      <p className="text-gray-500 text-xs">{post.created_at}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <style jsx>{`
          .scrollbar-hidden::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hidden {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </div>
  );
}