export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-blue-400 to-purple-400 text-white text-center p-6 mt-auto">
      <div className="flex flex-col md:flex-row justify-center items-center mb-4 space-x-4">
        <p className="hover:underline cursor-pointer transition duration-200 hover:text-blue-200">
          Giới thiệu về công nghệ sử dụng
        </p>
        <p className="hover:underline cursor-pointer transition duration-200 hover:text-blue-200">
          Chính sách bảo mật
        </p>
        <p className="hover:underline cursor-pointer transition duration-200 hover:text-blue-200">
          Điều khoản sử dụng
        </p>
      </div>
      <p className="text-xs">
        &copy; {new Date().getFullYear()} Blog & Notes App. All rights reserved.
      </p>
    </footer>
  );
}
