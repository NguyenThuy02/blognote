"use client"; // Add this line
import { useState } from "react";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username) {
      setError("Please input your Username!");
    } else {
      setError("");
      // Xử lý đăng nhập ở đây
    }
  };

  return (
    // đừng quên bỏ hình ảnh vào đây
    <div
      className="flex items-center justify-center h-screen"
      style={{
        backgroundImage: "url('')",
        width: "50%",
        height: "50%", // Chiều cao của phần tử
        backgroundSize: "cover",
        backgroundPosition: "center",
        //filter: "contrast(1.2) brightness(1.1)", // Làm nét hình ảnh
        height: "100vh", // Chiều cao của phần tử
        width: "100%", // Chiều rộng của phần tử
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-8 rounded-2xl shadow-lg bg-stone-50"
      >
        <div className="mb-4">
          <label
            className="block text-gray-700 text-2xl text-center font-bold mb-10"
            htmlFor="email"
          >
            Login
          </label>
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="username"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              error ? "border-red-500" : ""
            }`}
            placeholder="Username or Email"
          />
          {error && <p className="text-red-500 text-xs italic">{error}</p>}
        </div>

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
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Password"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2 leading-tight" />
            <span className="text-sm">Remember me</span>
          </label>
          {/*
            <a className="text-sm text-blue-500 hover:text-blue-800" href="#">
              Forgot password
            </a>
          */}
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Log in
          </button>
        </div>

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
