"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserOutlined } from "@ant-design/icons";

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const checkLogin = () => {
      const user = localStorage.getItem("user");
      if (user) {
        const userData = JSON.parse(user);
        setUsername(userData.name || userData.email || "");
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setUsername("");
      }
      setLoading(false);
    };

    checkLogin();

    const handleStorageChange = (event) => {
      if (event.key === "user" || event.key === null) {
        checkLogin(); 
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUsername("");
    window.dispatchEvent(new CustomEvent("user-logout"));
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <header
      className="fixed top-0 w-full bg-gradient-to-r from-white/80 via-purple-200 to-blue-200 text-white p-7 shadow-lg transition-shadow duration-300 flex items-center justify-between h-25 z-50"
      style={{ zIndex: 50 }}
    >
      <Link href="/" className="flex items-center ml-11" aria-label="Trang chủ">
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
              {username || "Người dùng"}
              <UserOutlined className="ml-2" />
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-white text-black shadow-lg rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ul className="space-y-2 p-2">
                <li>
                  <button
                    onClick={handleLogout}
                    className="block rounded-lg w-full text-left px-4 py-2 hover:bg-red-300"
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