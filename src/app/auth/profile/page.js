"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { supabase } from "../../../lib/supabase"; // Ensure the path is correct

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

  const handleBack = () => {
    // Navigate back to the previous page
    router.back();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-r from-blue-300 to-purple-300">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="w-full max-w-sm p-8 px-12 rounded-2xl shadow-lg bg-stone-50 relative m-4">
        {/* Title */}
        <div className="flex items-center justify-center mb-10">
          <h2 className="text-gray-700 text-2xl font-bold">Hồ sơ của bạn</h2>
        </div>

        {/* User Information */}
        {user ? (
          <div className="mb-4">
            <p className="text-gray-700 text-sm font-bold">
              Tên: {user.user_metadata?.name || "Chưa có tên"}
            </p>
            <p className="text-gray-700 text-sm font-bold">
              Email: {user.email || "Chưa có email"}
            </p>
            {/* Add more user info if necessary */}
          </div>
        ) : (
          <p className="text-gray-700 text-sm">
            Đang tải thông tin người dùng...
          </p>
        )}

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={handleBack}
            className="bg-gradient-to-r from-green-300 to-green-400 hover:from-green-400 hover:to-green-500 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}
