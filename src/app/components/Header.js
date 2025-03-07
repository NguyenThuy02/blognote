import React from "react";
import Link from "next/link";
import Image from "next/image";  


function Header() {
  return (
    <header className="bg-gradient-to-r from-white/80 via-purple-200 to-blue-200 text-white p-6 shadow-lg transition-shadow duration-300 flex items-center justify-between h-25">
      <Link href="/" className="flex items-center">
        <Image
          src="/BlogNote.png" 
          alt="Blog & Notes Logo"
          width={130} 
          height={40}  
          className="h-auto mx-15 transition-transform duration-200 transform hover:scale-105 active:scale-95"
        />
      </Link>

      <nav className="flex space-x-6">
        {/* Nhắc nhở và thông báo + Dropdown */}
        <div className="relative group">
          <button className="text-black font-semibold hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:bg-clip-text hover:text-transparent focus:outline-none transition-all">
            Nhắc nhở và thông báo 
          </button>
          <div className="absolute left-0 mt-2 w-56 bg-white shadow-md rounded-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <Link href="/reminders" className="block px-4 py-2 text-black hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:bg-clip-text hover:text-transparent transition-all">
              Danh sách nhắc nhở
            </Link>
            <Link href="/reminder-settings" className="block px-4 py-2 text-black hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:bg-clip-text hover:text-transparent transition-all">
              Cài đặt nhắc nhở
            </Link>
          </div>
        </div>

        {/* Thông tin cá nhân + Dropdown */}
        <div className="relative group">
          <button className="text-black font-semibold hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:bg-clip-text hover:text-transparent focus:outline-none transition-all">
            Thông tin cá nhân ⌵
          </button>
          <div className="absolute left-0 mt-2 w-56 bg-white shadow-md rounded-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <Link href="/profile" className="block px-4 py-2 text-black hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:bg-clip-text hover:text-transparent transition-all">
              Hồ sơ
            </Link>
            <Link href="/account-settings" className="block px-4 py-2 text-black hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:bg-clip-text hover:text-transparent transition-all">
              Cập nhật thông tin tài khoản
            </Link>
            <Link href="/change-password" className="block px-4 py-2 text-black hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:bg-clip-text hover:text-transparent transition-all">
              Quản lý mật khẩu
            </Link>
          </div>
        </div>

        <Link 
          href="/register" 
          className="text-black font-semibold hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:bg-clip-text hover:text-transparent transition-all"
        >
          Đăng ký
        </Link>
        <Link href="/auth/login" className="text-black font-semibold hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:bg-clip-text hover:text-transparent transition-all">
          Đăng nhập
        </Link> 
      </nav>
    </header>
  );
}

export default Header;
