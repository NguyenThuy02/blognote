"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import Image from "next/image";
import { supabase } from "../../../lib/supabase";
import bcrypt from "bcryptjs"; // Thêm bcrypt

export default function LoginApp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ username: "", password: "" });
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = { username: "", password: "" };

    if (!username) newErrors.username = "Tên đăng nhập là bắt buộc!";
    if (!password) newErrors.password = "Mật khẩu là bắt buộc!";

    setErrors(newErrors);

    if (newErrors.username || newErrors.password) {
      return;
    }

    try {
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .or(`email.eq.${username},name.eq.${username}`)
        .single();

      if (fetchError || !userData) {
        toast.error("Tên đăng nhập không chính xác!");
        return;
      }

      // So sánh mật khẩu nhập vào với mật khẩu đã mã hóa
      const isPasswordValid = await bcrypt.compare(password, userData.password);
      if (!isPasswordValid) {
        toast.error("Mật khẩu không chính xác!");
        return;
      }

      // Lưu thông tin người dùng vào localStorage
      localStorage.setItem("user", JSON.stringify(userData));

      toast.success("Đăng nhập thành công! Đang về trang chủ...");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại!");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-r from-blue-300 to-purple-300">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="w-full max-w-sm p-8 px-12 rounded-2xl shadow-lg bg-stone-50 relative m-4">
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

        <form onSubmit={handleSubmit}>
          <div className="mb-7">
            <label
              className="block text-gray-700 text-base font-bold mb-3"
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

          <div className="mb-7 ">
            <label
              className="block text-gray-700 text-base font-bold mb-3"
              htmlFor="password"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.password ? "border-red-500" : ""
                }`}
                placeholder="Nhập mật khẩu của bạn"
              />
              <span
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeInvisibleOutlined className="text-gray-500" />
                ) : (
                  <EyeOutlined className="text-gray-500" />
                )}
              </span>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs italic">{errors.password}</p>
            )}
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Đăng nhập
            </button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm text-gray-700 space-y-3">
          <span className="block">hoặc</span>
          <a
            href="./register"
            className="block text-blue-500 hover:text-blue-800 text-lg font-medium"
          >
            Đăng ký ngay!
          </a>
        </div>
      </div>
    </div>
  );
}
