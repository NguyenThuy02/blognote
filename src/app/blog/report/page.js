"use client";
import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement } from "chart.js";
import { BarChartOutlined } from "@ant-design/icons";
import { supabase } from "../../../lib/supabase";

Chart.register(CategoryScale, LinearScale, BarElement);

export default function ReportApp() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(""); // Tháng được chọn
  const [selectedYear, setSelectedYear] = useState(""); // Năm được chọn
  const [filterType, setFilterType] = useState("week"); // Mặc định lọc theo tuần
  const [posts, setPosts] = useState([]);
  const [demos, setDemos] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [filteredDemos, setFilteredDemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFiltered, setIsFiltered] = useState(false);

  // Thiết lập ngày mặc định cho tuần hiện tại
  useEffect(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Bắt đầu từ Chủ nhật
    setStartDate(startOfWeek.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  }, []);

  // Lấy dữ liệu từ Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("id, title, created_at");
        if (postsError) throw postsError;

        const { data: demosData, error: demosError } = await supabase
          .from("demos")
          .select("id, title, created_at");
        if (demosError) throw demosError;

        console.log("Dữ liệu từ posts:", postsData);
        console.log("Dữ liệu từ demos:", demosData);

        setPosts(postsData || []);
        setDemos(demosData || []);

        // Lấy danh sách năm từ dữ liệu
        const allYears = [
          ...new Set([
            ...postsData.map((p) => new Date(p.created_at).getFullYear()),
            ...demosData.map((d) => new Date(d.created_at).getFullYear()),
          ]),
        ].sort();
        if (allYears.length > 0 && !selectedYear) {
          setSelectedYear(allYears[allYears.length - 1].toString()); // Năm mới nhất mặc định
        }
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Hàm lọc dữ liệu theo thời gian
  const handleFilter = () => {
    let filterStartDate, filterEndDate;

    switch (filterType) {
      case "week":
        filterStartDate = new Date(startDate);
        filterEndDate = new Date(endDate);
        break;
      case "month":
        if (!selectedMonth || !selectedYear) return;
        filterStartDate = new Date(
          selectedYear,
          parseInt(selectedMonth) - 1,
          1
        );
        filterEndDate = new Date(selectedYear, parseInt(selectedMonth), 0);
        break;
      case "year":
        if (!selectedYear) return;
        filterStartDate = new Date(selectedYear, 0, 1);
        filterEndDate = new Date(selectedYear, 11, 31);
        break;
      default:
        return;
    }

    const filteredPostsResult = posts.filter((post) => {
      const createdAt = new Date(post.created_at);
      return (
        post.id && createdAt >= filterStartDate && createdAt <= filterEndDate
      );
    });

    const filteredDemosResult = demos.filter((demo) => {
      const createdAt = new Date(demo.created_at);
      return (
        demo.id && createdAt >= filterStartDate && createdAt <= filterEndDate
      );
    });

    setFilteredPosts(filteredPostsResult);
    setFilteredDemos(filteredDemosResult);
    setIsFiltered(true);
  };

  // Đếm số lượng bài viết theo tháng trong năm được chọn
  const getMonthlyCounts = () => {
    if (!selectedYear) return Array(12).fill(0);
    const monthlyCounts = Array(12).fill(0);

    posts.forEach((post) => {
      const date = new Date(post.created_at);
      if (date.getFullYear() === parseInt(selectedYear)) {
        monthlyCounts[date.getMonth()]++;
      }
    });

    demos.forEach((demo) => {
      const date = new Date(demo.created_at);
      if (date.getFullYear() === parseInt(selectedYear)) {
        monthlyCounts[date.getMonth()]++;
      }
    });

    return monthlyCounts;
  };

  // Đếm số lượng bài viết theo năm
  const getYearlyCounts = () => {
    const allDates = [
      ...posts.map((p) => new Date(p.created_at).getFullYear()),
      ...demos.map((d) => new Date(d.created_at).getFullYear()),
    ];
    const years = [...new Set(allDates)].sort();
    const yearlyCounts = years.map((year) => ({
      year,
      count:
        posts.filter((p) => new Date(p.created_at).getFullYear() === year)
          .length +
        demos.filter((d) => new Date(d.created_at).getFullYear() === year)
          .length,
    }));
    return yearlyCounts;
  };

  // Đếm số lượng bài viết dựa trên id
  const publishedCount = filteredPosts.filter((post) => post.id).length;
  const draftCount = filteredDemos.filter((demo) => demo.id).length;

  // Dữ liệu biểu đồ
  const chartData = {
    labels: ["Đã đăng (Posts)", "Nháp (Demos)"],
    datasets: [
      {
        label: "Số lượng bài viết",
        data: [publishedCount, draftCount],
        backgroundColor: ["rgba(34, 197, 94, 0.6)", "rgba(107, 114, 128, 0.6)"],
        barThickness: 60,
        categoryPercentage: 0.6,
        barPercentage: 0.5,
      },
    ],
  };

  const maxCount = Math.max(publishedCount, draftCount);
  const stepSize = maxCount < 10 ? 1 : maxCount < 100 ? 5 : 10;

  const chartOptions = {
    scales: {
      y: {
        ticks: { stepSize: stepSize },
        grid: { lineWidth: 1, color: "rgba(200, 200, 200, 0.5)" },
      },
    },
  };

  // Xuất báo cáo dưới dạng CSV
  const exportReport = () => {
    const headers = ["Tiêu đề", "Trạng thái", "Ngày tạo"];
    const data = filteredPosts
      .map((post) => [post.title, "Đã đăng", post.created_at])
      .concat(
        filteredDemos.map((demo) => [demo.title, "Nháp", demo.created_at])
      );

    const csvContent = [
      headers.join(","),
      ...data.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "bao_cao_bai_viet.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div>Đang tải dữ liệu...</div>;
  }

  return (
    <div className="mt-[97px] p-5 mb-[-7px] rounded-lg shadow-md border border-gray-200 bg-gray-100 text-gray-700">
      <h1 className="text-4xl font-bold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-400">
        Thống kê Blog
      </h1>

      <div className="mb-5">
        <h2 className="text-xl font-semibold text-indigo-600">
          Tổng quan bài viết
        </h2>
        <p className="text-gray-800">
          Số lượng bài viết đã đăng (Posts):{" "}
          <span className="font-bold">{publishedCount}</span>
        </p>
        <p className="text-gray-800">
          Số lượng bản nháp (Demos):{" "}
          <span className="font-bold">{draftCount}</span>
        </p>
      </div>

      <div className="text-gray-700 mb-5">
        <h2 className="text-xl font-semibold text-indigo-600">
          Lọc theo thời gian
        </h2>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 mr-2 focus:outline-none focus:border-blue-400"
        >
          <option value="week">Tuần</option>
          <option value="month">Tháng</option>
          <option value="year">Năm</option>
        </select>

        {filterType === "week" && (
          <>
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
              className="border border-gray-300 rounded px-3 py-2 mr-2 focus:outline-none focus:border-blue-400"
            />
          </>
        )}

        {filterType === "month" && (
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 mr-2 focus:outline-none focus:border-blue-400"
          >
            <option value="">Chọn tháng</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Tháng {i + 1}
              </option>
            ))}
          </select>
        )}

        {(filterType === "month" || filterType === "year") && (
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 mr-2 focus:outline-none focus:border-blue-400"
          >
            <option value="">Chọn năm</option>
            {getYearlyCounts().map(({ year }) => (
              <option key={year} value={year}>
                Năm {year}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={handleFilter}
          className="bg-blue-500 text-white px-4 py-2 rounded transition duration-200 hover:bg-blue-600"
        >
          Kiểm tra
        </button>
      </div>

      {isFiltered && (
        <div className="mb-5 text-gray-700">
          <h2 className="text-xl font-semibold text-indigo-600 mb-5">
            Kết quả lọc
          </h2>
          <table className="min-w-full border border-gray-300 bg-white rounded-lg shadow-md overflow-hidden">
            <thead className="bg-gray-200 rounded-t-lg">
              <tr>
                <th className="border border-gray-300 px-4 py-2">Tiêu đề</th>
                <th className="border border-gray-300 px-4 py-2">Trạng thái</th>
                <th className="border border-gray-300 px-4 py-2">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="rounded-b-lg">
              {filteredPosts.concat(filteredDemos).map((article, index) => (
                <tr
                  key={`${filteredPosts.includes(article) ? "post" : "demo"}-${
                    article.id
                  }-${index}`}
                  className="hover:bg-gray-100"
                >
                  <td className="border border-gray-300 px-4 py-2">
                    {article.title || "Không có tiêu đề"}
                  </td>
                  <td
                    className={`border border-gray-300 px-4 py-2 ${
                      filteredPosts.includes(article)
                        ? "text-green-500"
                        : "text-gray-500"
                    }`}
                  >
                    {filteredPosts.includes(article) ? "Đã đăng" : "Nháp"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {article.created_at || "Không có ngày"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isFiltered && (
        <div className="max-w-3xl mx-auto p-6 mt-10">
          <h2 className="text-2xl text-gray-700 font-bold mb-4">
            <BarChartOutlined className="mr-3" />
            Thống kê bài viết
          </h2>
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}

      {isFiltered && (
        <div className="mt-5 flex justify-center">
          <button
            onClick={exportReport}
            className="bg-blue-400 text-white px-4 py-2 rounded transition duration-200 hover:bg-blue-500"
          >
            Xuất báo cáo
          </button>
        </div>
      )}
    </div>
  );
}
