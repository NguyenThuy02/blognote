"use client";
import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header"; 
import Footer from "./components/Footer";
import Login from ".../components/login/login";
import Register from "./components/login/register";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Khai báo font chữ
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function Layout({ children }) {
  const [showLogin, setShowLogin] = useState(false);

  const toggleLogin = () => {
    setShowLogin(!showLogin);
  };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <Header />

          {/* Khu vực đăng nhập */}
          <div className="p-4 text-right">
            <button onClick={toggleLogin} className="bg-blue-500 text-white px-4 py-2 rounded">
              {showLogin ? "Close Login" : "Login"}
            </button>

            {showLogin && (
              <div className="absolute right-4 top-16 bg-white p-4 shadow-lg rounded">
                <Login />
                <p className="text-sm mt-2">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-blue-500 underline">
                    Register here
                  </Link>
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-1">
            {/* Sidebar */}
            <Sidebar />

            {/* Main content */}
            <main className="flex-1 p-6"><Register/></main>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </body>
    </html>
  );
}

export default Layout;
