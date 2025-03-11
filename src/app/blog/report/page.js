"use client";
import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement } from "chart.js";

Chart.register(CategoryScale, LinearScale, BarElement);

const initialArticles = [
  { id: 1, title: "Bài viết 1", status: "published", date: "2023-01-01" },
  { id: 2, title: "Bài viết 2", status: "draft", date: "2023-02-01" },
  { id: 3, title: "Bài viết 3", status: "deleted", date: "2023-03-01" },
  { id: 4, title: "Bài viết 4", status: "published", date: "2023-04-01" },
  { id: 5, title: "Bài viết 5", status: "published", date: "2023-05-01" },
];

export default function ReportApp() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Đếm số lượng bài viết theo trạng thái
  const publishedCount = initialArticles.filter(
    (article) => article.status === "published"
  ).length;
  const draftCount = initialArticles.filter(
    (article) => article.status === "draft"
  ).length;
  const deletedCount = initialArticles.filter(
    (article) => article.status === "deleted"
  ).length;

  /*
    const exportToExcel = () => {
    const data = initialArticles.map(({ id, title, status, date }) => ({
      id,
      title,
      status,
      date,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Articles');
    XLSX.writeFile(wb, 'articles.xlsx');
  };

  */

  // Dữ liệu cho biểu đồ
  const chartData = {
    labels: ["Đã đăng", "Nháp", "Đã xóa"],
    datasets: [
      {
        label: "Số lượng bài viết",
        data: [publishedCount, draftCount, deletedCount],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        barThickness: 60, // Độ dày của cột
        categoryPercentage: 0.6, // Khoảng cách giữa các nhóm
        barPercentage: 0.5, // Khoảng cách giữa các cột trong một nhóm
      },
    ],
  };

  const exportReport = () => {
    alert("Xuất báo cáo chưa được triển khai!");
  };

  return (
    <div className="mt-[97px] p-5 mb-[-7px] rounded-lg shadow-md border border-gray-200 bg-gray-100">
      <h1 className="text-4xl font-bold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-400">
        Thống kê Blog
      </h1>

      {/* Tổng quan bài viết */}
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-indigo-600">
          Tổng quan bài viết
        </h2>
        <p className="text-gray-800">
          Số lượng bài viết đã đăng:{" "}
          <span className="font-bold">{publishedCount}</span>
        </p>
        <p className="text-gray-800">
          Số lượng bài viết nháp:{" "}
          <span className="font-bold">{draftCount}</span>
        </p>
        <p className="text-gray-800">
          Số lượng bài viết đã xóa:{" "}
          <span className="font-bold">{deletedCount}</span>
        </p>
      </div>

      {/* Lọc theo thời gian */}
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-indigo-600">
          Lọc theo thời gian
        </h2>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border border-gray-300 rounded px-2 py-2 mr-2 focus:outline-none focus:border-blue-400"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border border-gray-300 rounded px-2 py-2 focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* Nút xuất báo cáo */}
      <div className="mb-5">
        <button
          onClick={exportReport}
          className="bg-blue-500 text-white px-4 py-2 rounded transition duration-200 hover:bg-blue-600"
        >
          Xuất báo cáo
        </button>
      </div>

      {/* Danh sách bài viết trong khoảng thời gian */}
      <div>
        <h2 className="text-xl font-semibold text-indigo-600">
          Bài viết trong khoảng thời gian
        </h2>
        <ul>
          {initialArticles
            .filter((article) => {
              const date = new Date(article.date);
              return (
                (!startDate || date >= new Date(startDate)) &&
                (!endDate || date <= new Date(endDate))
              );
            })
            .map((article) => (
              <li key={article.id} className="py-2 text-gray-700">
                {article.title} -{" "}
                <span
                  className={`font-bold ${
                    article.status === "published"
                      ? "text-green-500"
                      : article.status === "draft"
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {article.status}
                </span>{" "}
                - Ngày: {article.date}
              </li>
            ))}
        </ul>
      </div>

      {/* Biểu đồ thống kê */}
      <div className="max-w-3xl mx-auto p-6 mt-10">
        <h2 className="text-2xl font-bold mb-4">📈 Thống kê bài viết</h2>
        <Bar data={chartData} />
      </div>
    </div>
  );
}
