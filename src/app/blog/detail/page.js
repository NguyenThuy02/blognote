"use client";
import React from "react";
import Image from "next/image";

const PostDetail = ({ post }) => {
  return (
    <div className="container mx-auto p-5">
      {/* Tiêu đề bài viết */}
      <h1 className="text-4xl font-bold">{post.title}</h1>

      {/* Thông tin tác giả và ngày đăng */}
      <div className="flex items-center mt-2">
        <Image
          src={post.authorImage}
          alt={post.author}
          width={50}
          height={50}
          className="rounded-full"
        />
        <div className="ml-3">
          <p className="font-semibold">{post.author}</p>
          <p className="text-gray-600">{post.date}</p>
        </div>
      </div>

      {/* Nội dung bài viết */}
      <div className="mt-5">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>

      {/* Tùy chọn chia sẻ bài viết */}
      <div className="mt-5">
        <p>Chia sẻ bài viết:</p>
        <div className="flex space-x-4">
          <a href={`https://facebook.com/sharer/sharer.php?u=${post.url}`}>
            Facebook
          </a>
          <a href={`https://twitter.com/intent/tweet?url=${post.url}`}>
            Twitter
          </a>
          <a
            href={`https://www.linkedin.com/shareArticle?mini=true&url=${post.url}`}
          >
            LinkedIn
          </a>
        </div>
      </div>

      {/* Bình luận */}
      <div className="mt-5">
        <h2 className="text-2xl">Bình luận</h2>
        {/* Thêm mã cho mục bình luận ở đây */}
      </div>

      {/* Các bài viết liên quan */}
      <div className="mt-5">
        <h2 className="text-2xl">Bài viết liên quan</h2>
        {/* Danh sách bài viết liên quan */}
      </div>

      {/* Nút quay lại */}
      <div className="mt-5">
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          Quay lại danh sách bài viết
        </button>
      </div>
    </div>
  );
};

export default PostDetail;
