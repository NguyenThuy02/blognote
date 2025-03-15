"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true); // Trạng thái đang tải

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await fetch("/api/check-login", {
          credentials: "include",
        });

        if (!response.ok) return;
        const data = await response.json();
        if (data.success) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra trạng thái đăng nhập:", error);
      } finally {
        setLoading(false); // Dừng tải khi hoàn thành
      }
    };

    checkLogin();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
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
          <>
            <span className="text-black font-semibold">Hồ sơ</span>
            <button
              onClick={handleLogout}
              className="text-black font-semibold hover:text-red-500 transition-all"
              aria-label="Đăng xuất"
            >
              Đăng xuất
            </button>
            <Link href="/profile" aria-label="Trang cá nhân">
              <Image
                src="/path/to/user-icon.png" // Thay thế bằng đường dẫn tới biểu tượng người dùng
                alt="Biểu tượng người dùng"
                width={30}
                height={30}
                className="h-auto transition-transform duration-200 transform hover:scale-105 active:scale-95"
              />
            </Link>
          </>
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
