// detail/page.js
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { ArrowLeftOutlined } from "@ant-design/icons";

export default function PostDetail() {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const postId = searchParams.get("postId");
  const type = searchParams.get("type");

  useEffect(() => {
    const fetchPostDetails = async () => {
      if (!postId || !type) {
        setError("Thiếu thông tin bài viết hoặc loại bài viết.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const table = type === "post" ? "posts" : "demos";
        const { data, error } = await supabase
          .from(table)
          .select("id, title, content, created_at, name")
          .eq("id", postId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Không tìm thấy bài viết.");

        setPost(data);
      } catch (err) {
        setError(`Lỗi khi lấy dữ liệu: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId, type]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toISOString().split("T")[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-200">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-200 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-xl font-semibold text-red-600 mb-4">Lỗi</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center"
          >
            <ArrowLeftOutlined className="mr-2" /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-blue-200 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Không tìm thấy</h3>
          <p className="text-gray-600 mb-6">Bài viết không tồn tại.</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center"
          >
            <ArrowLeftOutlined className="mr-2" /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-200 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center"
        >
          <ArrowLeftOutlined className="mr-2" /> Quay lại
        </button>
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">{post.title || "Không có tiêu đề"}</h3>
        <p className="text-gray-600 mb-4">
          <span className="font-medium">Trạng thái:</span> {type === "post" ? "Đã đăng" : "Nháp"}
        </p>
        <p className="text-gray-600 mb-4">
          <span className="font-medium">Thời gian:</span> {formatDate(post.created_at)}
        </p>
        <p className="text-gray-600 mb-4">
          <span className="font-medium">Tác giả:</span> {post.name || "Không xác định"}
        </p>
        <p className="text-gray-600 mb-6">
          <span className="font-medium">Nội dung:</span> {post.content || "Không có nội dung"}
        </p>
      </div>
    </div>
  );
}