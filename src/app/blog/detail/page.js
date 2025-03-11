"use client";
import { useRouter } from "next/navigation"; // Change this import
import Image from "next/image";

const articles = [
  {
    id: 1,
    title: "Bài viết 1",
    content: "Nội dung chi tiết của bài viết 1.",
    author: "Tác giả 1",
    date: "01/01/2023",
    tags: ["tag1", "tag2"],
    src: "/path/to/image1.jpg",
  },
];

export default function DetailApp() {
  const router = useRouter();
  const { id } = router.query; // Lấy id từ URL
  const article = articles.find((article) => article.id === parseInt(id));

  if (!article) {
    return <p>Đang tải...</p>; // Thông báo nếu không tìm thấy bài viết
  }

  return (
    <div className="p-5 mt-10 rounded-lg shadow-md border border-gray-200 bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
      <Image
        src={article.src}
        alt={article.title}
        width={600}
        height={400}
        className="rounded-md mb-4"
      />
      <p className="text-gray-600 mb-2">Được tạo bởi: {article.author}</p>
      <p className="text-gray-600 mb-4">Ngày: {article.date}</p>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Nội dung:</h2>
        <p className="text-gray-800">{article.content}</p>
      </div>
      <div className="mt-4 flex flex-wrap">
        {article.tags.map((tag) => (
          <span
            key={tag}
            className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm mr-2 mb-1"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
