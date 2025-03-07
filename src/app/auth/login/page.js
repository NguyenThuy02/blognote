"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ username: "", password: "" });
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();

    let newErrors = { username: "", password: "" };

    if (!username) newErrors.username = "Username is required!";
    if (!password) newErrors.password = "Password is required!";

    setErrors(newErrors);

    if (!newErrors.username && !newErrors.password) {
      console.log("Logging in with:", { username, password });

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
        {/* Logo and Title */}
        <div className="flex items-center justify-center mb-10">
          <h2 className="text-gray-700 text-2xl font-bold">Login</h2>
          <img
            src="https://i.pinimg.com/originals/30/0c/f8/300cf853bc75a98770f8eec308246993.gif"
            alt="Logo"
            className="w-12 h-12 object-cover mr-4"
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="username"
            >
              Username or Email
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.username ? "border-red-500" : ""
              }`}
              placeholder="Enter your username or email"
            />
            {errors.username && (
              <p className="text-red-500 text-xs italic">{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.password ? "border-red-500" : ""
              }`}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-red-500 text-xs italic">{errors.password}</p>
            )}
          </div>

          {/* Remember me */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2 leading-tight" />
              <span className="text-sm">Remember me</span>
            </label>
          </div>

          {/* Login Button */}
          <div className="mt-6">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Log in
            </button>
          </div>
        </form>

        {/* Register Link */}
        <div className="mt-4 text-center">
          <span className="text-sm">
            or{" "}
            <a href="./register" className="text-blue-500 hover:text-blue-800">
              Register now!
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
