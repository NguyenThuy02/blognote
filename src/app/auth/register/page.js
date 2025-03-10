"use client";
import { useForm } from "react-hook-form";
import React from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";

export default function TrangDangKy() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  const router = useRouter();

  const onSubmit = async (data) => {
    console.log(data);
    // Giả lập việc đăng ký thành công
    toast.success("Đăng ký thành công! Đang về trang chủ...");

    // Chuyển hướng sau 2 giây
    setTimeout(() => {
      router.push("/");
    }, 2000);
  };

  const handleCancel = () => {
    reset();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-300 to-purple-300">
      <Toaster position="top-right" reverseOrder={false} />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm p-8 px-12 rounded-2xl shadow-lg bg-stone-50 relative m-4"
      >
        <div className="flex items-center justify-center mb-10">
          <h2 className="text-gray-700 text-2xl font-bold">Đăng Ký</h2>
          <Image
            src="/login.gif"
            alt="Logo"
            width={50}
            height={50}
            className="w-12 h-12 object-cover ml-4"
          />
        </div>

        {/* Các trường biểu mẫu */}
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="username"
          >
            Tên đăng nhập
          </label>
          <input
            type="text"
            id="username"
            {...register("username", { required: "Tên đăng nhập là bắt buộc" })}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              errors.username ? "border-red-500" : ""
            }`}
            placeholder="Nhập tên đăng nhập của bạn"
          />
          {errors.username && (
            <p className="text-red-500 text-xs italic">
              {errors.username.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="email"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            {...register("email", { required: "Email là bắt buộc" })}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              errors.email ? "border-red-500" : ""
            }`}
            placeholder="Nhập email của bạn"
          />
          {errors.email && (
            <p className="text-red-500 text-xs italic">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="password"
          >
            Mật khẩu
          </label>
          <input
            type="password"
            id="password"
            {...register("password", { required: "Mật khẩu là bắt buộc" })}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              errors.password ? "border-red-500" : ""
            }`}
            placeholder="Nhập mật khẩu của bạn"
          />
          {errors.password && (
            <p className="text-red-500 text-xs italic">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="terms"
            {...register("terms", {
              required: "Bạn phải chấp nhận các điều khoản",
            })}
            className="mr-2 leading-tight"
          />
          <label htmlFor="terms" className="text-sm text-gray-700">
            Tôi chấp nhận các điều khoản và điều kiện
          </label>
        </div>
        {errors.terms && (
          <p className="text-red-500 text-xs italic">{errors.terms.message}</p>
        )}

        <div className="mt-6 flex justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Đăng Ký
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-300 hover:bg-gray-500 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Hủy
          </button>
        </div>

        <div className="mt-4 text-center">
          <span className="text-sm">
            Đã có tài khoản?{" "}
            <a href="./login" className="text-blue-500 hover:text-blue-800">
              Đăng nhập ngay!
            </a>
          </span>
        </div>
      </form>
    </div>
  );
}
