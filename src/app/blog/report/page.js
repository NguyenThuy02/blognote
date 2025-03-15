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

  const filterArticles = initialArticles.filter((article) => {
    const date = new Date(article.date);
    return (
      (!startDate || date >= new Date(startDate)) &&
      (!endDate || date <= new Date(endDate))
    );
  });

  const publishedCount = filterArticles.filter(
    (article) => article.status === "published"
  ).length;
  const draftCount = filterArticles.filter(
    (article) => article.status === "draft"
  ).length;
  const deletedCount = filterArticles.filter(
    (article) => article.status === "deleted"
  ).length;

  const chartData = {
    labels: ["Đã đăng", "Nháp", "Đã xóa"],
    datasets: [
      {
        label: "Số lượng bài viết",
        data: [publishedCount, draftCount, deletedCount],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        barThickness: 60,
        categoryPercentage: 0.6,
        barPercentage: 0.5,
      },
    ],
  };

  const maxCount = Math.max(publishedCount, draftCount, deletedCount);
  const stepSize = maxCount < 10 ? 1 : maxCount < 100 ? 5 : 10;

  const chartOptions = {
    scales: {
      y: {
        ticks: {
          stepSize: stepSize,
        },
        grid: {
          lineWidth: 1,
          color: "rgba(200, 200, 200, 0.5)",
        },
      },
    },
  };

  const exportReport = () => {
    alert("Xuất báo cáo chưa được triển khai!");
  };

  return (
    <div className="mt-[97px] p-5 mb-[-7px] rounded-lg shadow-md border border-gray-200 bg-gray-100">
      <h1 className="text-4xl font-bold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-400">
        Thống kê Blog
      </h1>

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

      <div className="mb-5">
        <h2 className="text-xl font-semibold text-indigo-600">
          Lọc theo thời gian
        </h2>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 mr-2 focus:outline-none focus:border-blue-400"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-400"
        />
      </div>

      <div className="mb-5">
        <button
          onClick={exportReport}
          className="bg-blue-500 text-white px-4 py-2 rounded transition duration-200 hover:bg-blue-600"
        >
          Xuất báo cáo
        </button>
      </div>

      <div className="mb-5">
        <h2 className="text-xl font-semibold text-indigo-600 mb-5">
          Kết quả lọc
        </h2>
        <table className="min-w-full border border-gray-300 bg-white rounded-lg shadow-md overflow-hidden">
          <thead className="bg-gray-200 rounded-t-lg">
            <tr>
              <th className="border border-gray-300 px-4 py-2">Tiêu đề</th>
              <th className="border border-gray-300 px-4 py-2">Trạng thái</th>
              <th className="border border-gray-300 px-4 py-2">Ngày</th>
            </tr>
          </thead>
          <tbody className="rounded-b-lg">
            {filterArticles.map((article) => (
              <tr key={article.id} className="hover:bg-gray-100">
                <td className="border border-gray-300 px-4 py-2">
                  {article.title}
                </td>
                <td
                  className={`border border-gray-300 px-4 py-2 ${
                    article.status === "published"
                      ? "text-green-500"
                      : article.status === "draft"
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {article.status}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {article.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="max-w-3xl mx-auto p-6 mt-10">
        <h2 className="text-2xl font-bold mb-4">📈 Thống kê bài viết</h2>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
