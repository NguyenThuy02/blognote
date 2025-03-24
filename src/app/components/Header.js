"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserOutlined } from "@ant-design/icons";

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true); // Trạng thái đang tải
  const [username, setUsername] = useState(""); // Thêm trạng thái để lưu tên người dùng

  useEffect(() => {
    const checkLogin = () => {
      // Kiểm tra thông tin người dùng trong localStorage
      const user = localStorage.getItem("user");

      if (user) {
        const userData = JSON.parse(user); // Parse lại dữ liệu người dùng
        setUsername(userData.name); // Lưu tên người dùng vào state
        setIsLoggedIn(true); // Nếu có thông tin người dùng, người dùng đã đăng nhập
      }

      setLoading(false); // Dừng tải khi hoàn thành
    };

    checkLogin();
  }, []);

  const handleLogout = () => {
    // Xóa thông tin người dùng khỏi localStorage khi đăng xuất
    localStorage.removeItem("user");
    setIsLoggedIn(false); // Đánh dấu người dùng đã đăng xuất
  };

  return (
    <header className="fixed top-0 w-full bg-gradient-to-r from-white/80 via-purple-200 to-blue-200 text-white p-7 shadow-lg transition-shadow duration-300 flex items-center justify-between h-25 z-10">
      <Link href="/" className="flex items-center" aria-label="Trang chủ">
        <Image
          src="http://res.cloudinary.com/dlaoxrnad/image/upload/v1741593256/amhe1oz6r08s3lpemoqj.png"
          alt="Logo Blog & Ghi chú"
          width={130}
          height={40}
          className="h-auto transition-transform duration-200 transform hover:scale-105 active:scale-95"
        />
      </Link>
      <nav className="flex space-x-6">
        {loading ? (
          <span className="text-black font-semibold">Đang tải...</span>
        ) : isLoggedIn ? (
          <div className="relative group">
            <button className="text-black font-semibold flex items-center">
              {username}
              <UserOutlined className="ml-2" />{" "}
              {/* Thêm khoảng cách bên trái cho biểu tượng */}
            </button>

            <div className="absolute right-0 mt-2 w-40 bg-white text-black shadow-lg rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ul className="space-y-2 p-2">
                <li>
                  <Link
                    href="/auth/profile"
                    className="block px-4 py-2 hover:bg-blue-300"
                  >
                    Hồ sơ
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-red-300"
                  >
                    Đăng xuất
                  </button>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="text-black font-semibold hover:text-blue-500 transition-all"
            aria-label="Đăng nhập"
          >
            Đăng nhập
          </Link>
        )}
      </nav>
    </header>
  );
}

export default Header;
