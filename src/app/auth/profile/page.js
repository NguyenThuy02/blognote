"use client";

import React from "react";

export default function Profile() {
  return (
    <div>
      <h1>Profile</h1>
    </div>
  );
}
/*import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { supabase } from "../../../lib/supabase"; // Đảm bảo đường dẫn chính xác

export default function Profile() {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError) {
        toast.error("Không thể lấy thông tin người dùng!");
        return;
      }

      if (!authData.user) {
        toast.error("Người dùng chưa đăng nhập!");
        return;
      }

      setUser(authData.user);

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("name, email") // Chỉ lấy cột name và email
        .eq("id", authData.user.id)
        .single();

      if (userError) {
        toast.error("Không thể lấy dữ liệu người dùng từ bảng!");
        return;
      }

      setUserInfo(userData);
    };

    fetchUser();
  }, []);

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-r from-blue-300 to-purple-300">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="w-full max-w-sm p-8 px-12 rounded-2xl shadow-lg bg-stone-50 relative m-4">
       
        <div className="flex items-center justify-center mb-10">
          <h2 className="text-gray-700 text-2xl font-bold">Hồ sơ của bạn</h2>
        </div>

       
        {userInfo ? (
          <div className="mb-4">
            <p className="text-gray-700 text-sm font-bold">
              Tên: {userInfo.name || "Chưa có tên"}
            </p>
            <p className="text-gray-700 text-sm font-bold">
              Email: {userInfo.email || "Chưa có email"}
            </p>
          </div>
        ) : (
          <p className="text-gray-700 text-sm">
            Đang tải thông tin người dùng...
          </p>
        )}

      
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
}*/
