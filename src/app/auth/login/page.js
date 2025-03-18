"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import { supabase1 } from "../../../lib/supabase"; // Ensure correct path configuration

export default function LoginApp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ username: "", password: "" });
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = { username: "", password: "" };

    // Kiểm tra tên đăng nhập và mật khẩu
    if (!username) newErrors.username = "Tên đăng nhập là bắt buộc!";
    if (!password) newErrors.password = "Mật khẩu là bắt buộc!";

    setErrors(newErrors);

    // Nếu có lỗi thì dừng lại
    if (newErrors.username || newErrors.password) {
      return;
    }

    try {
      // Kiểm tra thông tin đăng nhập với Supabase
      const { data: userData, error: fetchError } = await supabase1
        .from("users")
        .select("*")
        .or(`email.eq.${username},name.eq.${username}`)
        .single();

      // Nếu có lỗi khi lấy dữ liệu hoặc không có người dùng
      if (fetchError || !userData) {
        toast.error("Tên đăng nhập không chính xác!");
        return;
      }

      // Kiểm tra mật khẩu (giả sử mật khẩu đã được mã hóa trong cơ sở dữ liệu)
      if (userData.password !== password) {
        toast.error("Mật khẩu không chính xác!");
        return;
      }

      // Lưu thông tin người dùng vào localStorage sau khi đăng nhập thành công
      localStorage.setItem("user", JSON.stringify(userData));

      // Đăng nhập thành công
      toast.success("Đăng nhập thành công! Đang về trang chủ...");

      // Chuyển hướng sau 2 giây
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      // Xử lý lỗi nếu có
      toast.error("Có lỗi xảy ra. Vui lòng thử lại!");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-r from-blue-300 to-purple-300">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="w-full max-w-sm p-8 px-12 rounded-2xl shadow-lg bg-stone-50 relative m-4">
        {/* Logo and Title */}
        <div className="flex items-center justify-center mb-10">
          <h2 className="text-black text-2xl font-bold">Đăng Nhập</h2>
          <Image
            src="http://res.cloudinary.com/dlaoxrnad/image/upload/v1741681302/msvum6dk9ii7fvzewqan.gif"
            alt="Logo"
            width={50}
            height={50}
            className="w-12 h-12 object-cover mr-4"
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-base font-bold mb-2"
              htmlFor="username"
            >
              Tên đăng nhập hoặc Email
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.username ? "border-red-500" : ""
              }`}
              placeholder="Nhập tên đăng nhập hoặc email của bạn"
            />
            {errors.username && (
              <p className="text-red-500 text-xs italic">{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-base font-bold mb-2"
              htmlFor="password"
            >
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.password ? "border-red-500" : ""
              }`}
              placeholder="Nhập mật khẩu của bạn"
            />
            {errors.password && (
              <p className="text-red-500 text-xs italic">{errors.password}</p>
            )}
          </div>

          {/* Remember me */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2 leading-tight" />
              <span className="text-sm text-gray-700">Ghi nhớ tôi</span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-700 hover:to-purple-700 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Đăng nhập
            </button>
          </div>
        </form>

        {/* Register Link */}
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-700">
            hoặc{" "}
            <a
              href="./register"
              className="text-blue-500 text-base hover:text-blue-800"
            >
              Đăng ký ngay!
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
