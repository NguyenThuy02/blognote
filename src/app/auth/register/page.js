"use client";
import { useForm } from "react-hook-form";
import React from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import Image from "next/image";
import { supabase } from "../../../lib/supabase";
import bcrypt from "bcryptjs"; // Thêm bcrypt

export default function RegisterApp() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const throttleEmailRequest = (callback) => {
    setTimeout(callback, 3000);
  };

  const onSubmit = async (data) => {
    if (loading) {
      toast.error("Vui lòng chờ trước khi thử lại.");
      return;
    }
    setLoading(true);
    try {
      const { data: existingUser, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", data.email.trim())
        .single();

      if (userError && userError.code !== "PGRST116") {
        throw userError;
      }

      if (existingUser) {
        toast.error("Email đã được sử dụng.");
        return;
      }

      // Mã hóa mật khẩu trước khi lưu
      const salt = await bcrypt.genSalt(10); // Tạo salt với độ dài 10
      const hashedPassword = await bcrypt.hash(data.password, salt);

      const { user, error } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password, // Supabase Auth vẫn cần mật khẩu gốc
      });

      if (error) {
        if (error.message.includes("rate limit exceeded")) {
          toast.error("Quá nhiều yêu cầu, vui lòng thử lại sau.");
        } else {
          toast.error("Đăng ký thất bại: " + error.message);
        }
        return;
      }

      // Lưu thông tin người dùng với mật khẩu đã mã hóa
      const { error: insertError } = await supabase.from("users").insert([
        {
          name: data.name,
          email: data.email,
          password: hashedPassword, // Lưu mật khẩu đã mã hóa
        },
      ]);

      if (insertError) {
        throw insertError;
      }

      toast.success("Đăng ký thành công! Vui lòng đăng nhập để tiếp tục...");
      throttleEmailRequest(() => {
        router.push("/auth/login");
      });
    } catch (error) {
      toast.error("Đăng ký thất bại: " + error.message);
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-black text-2xl font-bold">Đăng Ký</h2>
          <Image
            src="http://res.cloudinary.com/dlaoxrnad/image/upload/v1741681302/msvum6dk9ii7fvzewqan.gif"
            alt="Logo"
            width={50}
            height={50}
            className="w-12 h-12 object-cover ml-4"
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-base font-bold mb-2"
            htmlFor="name"
          >
            Tên đăng nhập
          </label>
          <input
            type="text"
            id="name"
            {...register("name", { required: "Tên đăng nhập là bắt buộc!" })}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              errors.name ? "border-red-500" : ""
            }`}
            placeholder="Nhập tên đăng nhập của bạn"
          />
          {errors.name && (
            <p className="text-red-500 text-xs italic">{errors.name.message}</p>
          )}
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-base font-bold mb-2"
            htmlFor="email"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            {...register("email", {
              required: "Email là bắt buộc!",
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: "Email không đúng định dạng",
              },
            })}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
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
            className="block text-gray-700 text-base font-bold mb-2"
            htmlFor="password"
          >
            Mật khẩu
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              {...register("password", { required: "Mật khẩu là bắt buộc!" })}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.password ? "border-red-500" : ""
              }`}
              placeholder="Nhập mật khẩu của bạn"
            />
            <span
              className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeInvisibleOutlined className="text-gray-500" />
              ) : (
                <EyeOutlined className="text-gray-500" />
              )}
            </span>
          </div>
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
              required: "Bạn phải chấp nhận các điều khoản!",
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
            disabled={loading}
            className={`bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Hủy
          </button>
        </div>

        <div className="mt-4 text-center">
          <span className="text-gray-700 text-sm">
            Đã có tài khoản?{" "}
            <a
              href="/auth/login"
              className="text-blue-500 hover:text-blue-800 text-base"
            >
              Đăng nhập ngay!
            </a>
          </span>
        </div>
      </form>
    </div>
  );
}
