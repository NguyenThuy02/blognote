import Link from "next/link";
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">404 - Không tìm thấy trang</h1>
      <p className="text-gray-600 mb-4">
        Trang bạn đang tìm kiếm không tồn tại.
      </p>
      <Link href="/" className="text-blue-500 hover:text-blue-700 underline">
        Quay về trang chủ
      </Link>
    </div>
  );
}
