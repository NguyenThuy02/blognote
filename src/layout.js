import Sidebar from "./components/Sidebar";
import Header from "./components/Header"; 
import Footer from "./components/Footer";

import { Geist, Geist_Mono } from "next/font/google";
"use client";
import React, { useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "./components/Sidebar";
import Login from "./components/login/login";
import Register from "./components/login/register";
import Link from "next/link";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function Layout({ children }) {
  const [showLogin, setShowLogin] = useState(false); // Di chuyển useState vào đây

  const toggleLogin = () => {
    setShowLogin(!showLogin);
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="mr-0">
          <button onClick={toggleLogin}>
            {showLogin}
            Login
          </button>

          {showLogin && (
            <div>
              <Link href="/login">
                <Register />
              </Link>
            </div>
          )}
        </div>
        <div className="flex">
          {/* Sidebar */}
          <Sidebar />

          {/* Sidebar */}

            {/* Sidebar */}
            <Sidebar />

            {/* Main content */}
            <main className="flex-1 p-6">{children}</main>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </body>
    </html>
  );
}

export default Layout;