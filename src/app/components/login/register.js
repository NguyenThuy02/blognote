// pages/register.js
import { useForm } from "react-hook-form";

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    console.log(data);
    // Gửi yêu cầu đến API
    // await axios.post('/api/register', data);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 rounded-lg shadow-md w-80"
      >
        <h2 className="text-2xl font-bold mb-4">Đăng Ký</h2>
        <div className="mb-4">
          <label>Email:</label>
          <input
            type="email"
            {...register("email", { required: true })}
            className="border w-full p-2 mt-1"
          />
          {errors.email && (
            <span className="text-red-500">Email là bắt buộc</span>
          )}
        </div>
        <div className="mb-4">
          <label>Mật khẩu:</label>
          <input
            type="password"
            {...register("password", { required: true })}
            className="border w-full p-2 mt-1"
          />
          {errors.password && (
            <span className="text-red-500">Mật khẩu là bắt buộc</span>
          )}
        </div>
        {/* Thêm các trường khác tương tự */}
        <button className="w-full bg-blue-500 text-white p-2 rounded">
          Đăng Ký
        </button>
      </form>
    </div>
  );
}
