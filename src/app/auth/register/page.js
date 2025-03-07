"use client";
import { useForm } from "react-hook-form";
import React from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function RegisterPage() {
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
          <h2 className="text-gray-700 text-2xl font-bold">Register</h2>
          <img
            src="https://i.pinimg.com/originals/30/0c/f8/300cf853bc75a98770f8eec308246993.gif"
            alt="Logo"
            className="w-12 h-12 object-cover ml-4"
          />
        </div>

        {/* Form fields */}
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="username"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            {...register("username", { required: "Username is required" })}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              errors.username ? "border-red-500" : ""
            }`}
            placeholder="Enter your username"
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
            {...register("email", { required: "Email is required" })}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              errors.email ? "border-red-500" : ""
            }`}
            placeholder="Enter your email"
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
            Password
          </label>
          <input
            type="password"
            id="password"
            {...register("password", { required: "Password is required" })}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              errors.password ? "border-red-500" : ""
            }`}
            placeholder="Enter your password"
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
            {...register("terms", { required: "You must accept the terms" })}
            className="mr-2 leading-tight"
          />
          <label htmlFor="terms" className="text-sm text-gray-700">
            I accept the terms and conditions
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
            Register
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-300 hover:bg-gray-500 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
        </div>

        <div className="mt-4 text-center">
          <span className="text-sm">
            Already have an account?{" "}
            <a href="./login" className="text-blue-500 hover:text-blue-800">
              Login now!
            </a>
          </span>
        </div>
      </form>
    </div>
  );
}
