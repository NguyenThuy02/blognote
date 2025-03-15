"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import { supabase } from "../../../lib/supabase"; // Đảm bảo rằng bạn đã cấu hình đúng đường dẫn

export default function Profile() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        toast.error("Không thể lấy thông tin người dùng!");
        return;
      }
      setUser(data.user);
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Đăng xuất không thành công!");
      return;
    }
    toast.success("Đăng xuất thành công!");
    router.push("/login"); // Chuyển về trang đăng nhập
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-r from-blue-300 to-purple-300">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="w-full max-w-sm p-8 px-12 rounded-2xl shadow-lg bg-stone-50 relative m-4">
        {/* Tiêu đề */}
        <div className="flex items-center justify-center mb-10">
          <h2 className="text-gray-700 text-2xl font-bold">Trang Hồ Sơ</h2>
        </div>

        {/* Thông tin người dùng */}
        {user ? (
          <div className="mb-4">
            <p className="text-gray-700 text-sm font-bold">
              Tên: {user.user_metadata.name}
            </p>
            <p className="text-gray-700 text-sm font-bold">
              Email: {user.email}
            </p>
            {/* Thêm các thông tin khác nếu cần */}
          </div>
        ) : (
          <p className="text-gray-700 text-sm">
            Đang tải thông tin người dùng...
          </p>
        )}

        {/* Nút Đăng Xuất */}
        <div className="mt-6">
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-700 hover:to-red-900 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Đăng Xuất
          </button>
        </div>
      </div>
    </div>
  );
}
