"use client";
import { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ username: "", password: "" });

  const handleSubmit = (e) => {
    e.preventDefault();

    let newErrors = { username: "", password: "" };

    if (!username) newErrors.username = "Username is required!";
    if (!password) newErrors.password = "Password is required!";

    setErrors(newErrors);

    if (!newErrors.username && !newErrors.password) {
      console.log("Logging in with:", { username, password });
      // Xử lý đăng nhập ở đây
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-blue-300 to-purple-300">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-8 rounded-2xl shadow-lg bg-stone-50"
      >
        {/* Logo and Title */}
        <div className="flex items-center justify-center mb-10">
          <h2 className="text-gray-700 text-2xl font-bold">Login</h2>
          <img
            src="https://i.pinimg.com/originals/30/0c/f8/300cf853bc75a98770f8eec308246993.gif" // Đường dẫn ảnh thực tế
            alt="Logo"
            className="w-12 h-12 object-cover mr-4"
          />
        </div>

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

        {/* Register Link */}
        <div className="mt-4 text-center">
          <span className="text-sm">
            or{" "}
            <a href="#" className="text-blue-500 hover:text-blue-800">
              Register now!
            </a>
          </span>
        </div>
      </form>
    </div>
  );
}
