"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";

export default function LoginApp() {
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [loi, setLoi] = useState({ tenDangNhap: "", matKhau: "" });
  const router = useRouter();

  const xuLyGui = (e) => {
    e.preventDefault();

    let loiMoi = { tenDangNhap: "", matKhau: "" };

    if (!tenDangNhap) loiMoi.tenDangNhap = "Tên đăng nhập là bắt buộc!";
    if (!matKhau) loiMoi.matKhau = "Mật khẩu là bắt buộc!";

    setLoi(loiMoi);

    if (!loiMoi.tenDangNhap && !loiMoi.matKhau) {
      console.log("Đăng nhập với:", { tenDangNhap, matKhau });

      // Hiển thị thông báo nhỏ (toast)
      toast.success("Đăng nhập thành công! Đang về trang chủ...");

      // Chuyển trang sau 2 giây
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-r from-blue-300 to-purple-300">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="w-full max-w-sm p-8 px-12 rounded-2xl shadow-lg bg-stone-50 relative m-4">
        {/* Logo và Tiêu đề */}
        <div className="flex items-center justify-center mb-10">
          <h2 className="text-gray-700 text-2xl font-bold">Đăng Nhập</h2>
          <Image
            src="http://res.cloudinary.com/dlaoxrnad/image/upload/v1741681302/msvum6dk9ii7fvzewqan.gif"
            alt="Logo"
            width={50}
            height={50}
            className="w-12 h-12 object-cover mr-4"
          />
        </div>

        {/* Biểu mẫu */}
        <form onSubmit={xuLyGui}>
          {/* Tên đăng nhập */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="tenDangNhap"
            >
              Tên đăng nhập hoặc Email
            </label>
            <input
              type="text"
              id="tenDangNhap"
              value={tenDangNhap}
              onChange={(e) => setTenDangNhap(e.target.value)}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                loi.tenDangNhap ? "border-red-500" : ""
              }`}
              placeholder="Nhập tên đăng nhập hoặc email của bạn"
            />
            {loi.tenDangNhap && (
              <p className="text-red-500 text-xs italic">{loi.tenDangNhap}</p>
            )}
          </div>

          {/* Mật khẩu */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="matKhau"
            >
              Mật khẩu
            </label>
            <input
              type="password"
              id="matKhau"
              value={matKhau}
              onChange={(e) => setMatKhau(e.target.value)}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                loi.matKhau ? "border-red-500" : ""
              }`}
              placeholder="Nhập mật khẩu của bạn"
            />
            {loi.matKhau && (
              <p className="text-red-500 text-xs italic">{loi.matKhau}</p>
            )}
          </div>

          {/* Ghi nhớ tôi */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2 leading-tight" />
              <span className="text-sm">Ghi nhớ tôi</span>
            </label>
          </div>

          {/* Nút Đăng Nhập */}
          <div className="mt-6">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-700 hover:to-purple-700 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Đăng Nhập
            </button>
          </div>
        </form>

        {/* Liên kết Đăng Ký */}
        <div className="mt-4 text-center">
          <span className="text-sm">
            hoặc{" "}
            <a href="./register" className="text-blue-500 hover:text-blue-800">
              Đăng ký ngay!
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
