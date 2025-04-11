"use client";
import { useState, useEffect } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { BarChartOutlined, CheckCircleOutlined, FileOutlined, PieChartOutlined } from "@ant-design/icons";
import { supabase } from "../../../lib/supabase";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } from "docx";
import { saveAs } from "file-saver";
import { useRouter } from "next/navigation";
import Notification from "../../../utils/notification";
import Confirm from "../../../utils/error";

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function ReportApp() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [filterType, setFilterType] = useState("week");
  const [posts, setPosts] = useState([]);
  const [demos, setDemos] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [filteredDemos, setFilteredDemos] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [userStartDate, setUserStartDate] = useState("");
  const [userEndDate, setUserEndDate] = useState("");
  const [userSelectedMonth, setUserSelectedMonth] = useState("");
  const [userSelectedYear, setUserSelectedYear] = useState("");
  const [userFilterType, setUserFilterType] = useState("week");
  const [userPosts, setUserPosts] = useState([]);
  const [userDemos, setUserDemos] = useState([]);
  const [filteredUserPosts, setFilteredUserPosts] = useState([]);
  const [filteredUserDemos, setFilteredUserDemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFiltered, setIsFiltered] = useState(false);
  const [isUserFiltered, setIsUserFiltered] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    setStartDate(startOfWeek.toISOString().split("T")[0]);
    setEndDate(endOfWeek.toISOString().split("T")[0]);
    setUserStartDate(startOfWeek.toISOString().split("T")[0]);
    setUserEndDate(endOfWeek.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    const checkLoginStatus = () => {
      const userData = JSON.parse(localStorage.getItem("user"));
      const loggedIn = !!userData;
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        const userName = userData.name;
        if (userName) {
          fetchData(userName);
        } else {
          setNotification({
            message: "Không tìm thấy thông tin tên người dùng trong trạng thái đăng nhập.",
            type: "error",
          });
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkLoginStatus();

    const handleStorageChange = (event) => {
      if (event.key === "user" || event.key === null) {
        checkLoginStatus();
      }
    };

    const handleLogoutEvent = () => {
      setIsLoggedIn(false);
      setShowLoginModal(true);
      setPosts([]);
      setDemos([]);
      setUserPosts([]);
      setUserDemos([]);
      setFilteredPosts([]);
      setFilteredDemos([]);
      setFilteredUserPosts([]);
      setFilteredUserDemos([]);
      setIsFiltered(false);
      setIsUserFiltered(false);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("user-logout", handleLogoutEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-logout", handleLogoutEvent);
    };
  }, []);

  useEffect(() => {
    const years = [
      ...new Set([
        ...posts.map((p) => new Date(p.created_at).getFullYear()),
        ...demos.map((d) => new Date(d.created_at).getFullYear()),
      ]),
    ].sort();
    setAvailableYears(years);
    if (years.length > 0 && !selectedYear) {
      setSelectedYear(years[years.length - 1].toString());
    }
    if (years.length > 0 && !userSelectedYear) {
      setUserSelectedYear(years[years.length - 1].toString());
    }
  }, [posts, demos, selectedYear, userSelectedYear]);

  const fetchData = async (userName) => {
    try {
      setLoading(true);
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id, title, created_at, name");
      if (postsError) throw postsError;

      const { data: demosData, error: demosError } = await supabase
        .from("demos")
        .select("id, title, created_at, name");
      if (demosError) throw demosError;

      setPosts(postsData || []);
      setDemos(demosData || []);

      const userPostsData = (postsData || []).filter(
        (post) => post.name === userName
      );
      const userDemosData = (demosData || []).filter(
        (demo) => demo.name === userName
      );
      setUserPosts(userPostsData);
      setUserDemos(userDemosData);

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const filteredPostsResult = (postsData || []).filter((post) => {
        const createdAt = new Date(post.created_at);
        return createdAt >= startOfWeek && createdAt <= endOfWeek;
      });
      const filteredDemosResult = (demosData || []).filter((demo) => {
        const createdAt = new Date(demo.created_at);
        return createdAt >= startOfWeek && createdAt <= endOfWeek;
      });
      setFilteredPosts(filteredPostsResult);
      setFilteredDemos(filteredDemosResult);
      setIsFiltered(true);

      const filteredUserPostsResult = (userPostsData || []).filter((post) => {
        const createdAt = new Date(post.created_at);
        return createdAt >= startOfWeek && createdAt <= endOfWeek;
      });
      const filteredUserDemosResult = (userDemosData || []).filter((demo) => {
        const createdAt = new Date(demo.created_at);
        return createdAt >= startOfWeek && createdAt <= endOfWeek;
      });
      setFilteredUserPosts(filteredUserPostsResult);
      setFilteredUserDemos(filteredUserDemosResult);
      setIsUserFiltered(true);
    } catch (err) {
      setNotification({
        message: `Lỗi khi lấy dữ liệu: ${err.message}`,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSystemFilter = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    if (
      (filterType === "week" && (!startDate || !endDate)) ||
      (filterType === "month" && (!selectedMonth || !selectedYear)) ||
      (filterType === "year" && !selectedYear)
    ) {
      setNotification({
        message: "Vui lòng chọn đầy đủ thông tin lọc cho hệ thống!",
        type: "error",
      });
      return;
    }
    applySystemFilter();
  };

  const applySystemFilter = () => {
    let filterStartDate, filterEndDate;
    switch (filterType) {
      case "week":
        filterStartDate = new Date(startDate);
        filterEndDate = new Date(endDate);
        break;
      case "month":
        filterStartDate = new Date(selectedYear, parseInt(selectedMonth) - 1, 1);
        filterEndDate = new Date(selectedYear, parseInt(selectedMonth), 0);
        break;
      case "year":
        filterStartDate = new Date(selectedYear, 0, 1);
        filterEndDate = new Date(selectedYear, 11, 31);
        break;
      default:
        return;
    }

    const filteredPostsResult = posts.filter((post) => {
      const createdAt = new Date(post.created_at);
      return createdAt >= filterStartDate && createdAt <= filterEndDate;
    });

    const filteredDemosResult = demos.filter((demo) => {
      const createdAt = new Date(demo.created_at);
      return createdAt >= filterStartDate && createdAt <= filterEndDate;
    });

    setFilteredPosts(filteredPostsResult);
    setFilteredDemos(filteredDemosResult);
    setIsFiltered(true);
    setNotification({
      message: "Dữ liệu hệ thống đã được lọc thành công!",
      type: "success",
    });
  };

  const handleUserFilter = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    if (
      (userFilterType === "week" && (!userStartDate || !userEndDate)) ||
      (userFilterType === "month" && (!userSelectedMonth || !userSelectedYear)) ||
      (userFilterType === "year" && !userSelectedYear)
    ) {
      setNotification({
        message: "Vui lòng chọn đầy đủ thông tin lọc cho cá nhân!",
        type: "error",
      });
      return;
    }
    applyUserFilter();
  };

  const applyUserFilter = () => {
    let filterStartDate, filterEndDate;
    switch (userFilterType) {
      case "week":
        filterStartDate = new Date(userStartDate);
        filterEndDate = new Date(userEndDate);
        break;
      case "month":
        filterStartDate = new Date(userSelectedYear, parseInt(userSelectedMonth) - 1, 1);
        filterEndDate = new Date(userSelectedYear, parseInt(userSelectedMonth), 0);
        break;
      case "year":
        filterStartDate = new Date(userSelectedYear, 0, 1);
        filterEndDate = new Date(userSelectedYear, 11, 31);
        break;
      default:
        return;
    }

    const filteredUserPostsResult = userPosts.filter((post) => {
      const createdAt = new Date(post.created_at);
      return createdAt >= filterStartDate && createdAt <= filterEndDate;
    });

    const filteredUserDemosResult = userDemos.filter((demo) => {
      const createdAt = new Date(demo.created_at);
      return createdAt >= filterStartDate && createdAt <= filterEndDate;
    });

    setFilteredUserPosts(filteredUserPostsResult);
    setFilteredUserDemos(filteredUserDemosResult);
    setIsUserFiltered(true);
    setNotification({
      message: "Dữ liệu cá nhân đã được lọc thành công!",
      type: "success",
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (filterType === "month" || userFilterType === "month") {
      return `${date.getMonth() + 1}/${date.getFullYear()}`;
    }
    if (filterType === "year" || userFilterType === "year") {
      return `${date.getFullYear()}`;
    }
    return date.toISOString().split("T")[0];
  };

  const publishedCount = filteredPosts.length;
  const draftCount = filteredDemos.length;
  const userPublishedCount = filteredUserPosts.length;
  const userDraftCount = filteredUserDemos.length;

  const systemBarChartData = {
    labels: ["Đã đăng", "Nháp"],
    datasets: [
      {
        label: "Số lượng bài viết (Hệ thống)",
        data: [publishedCount, draftCount],
        backgroundColor: ["rgba(34, 197, 94, 0.8)", "rgba(107, 114, 128, 0.8)"],
        barThickness: 50,
      },
    ],
  };

  const systemDoughnutChartData = {
    labels: ["Đã đăng", "Nháp"],
    datasets: [
      {
        data: [publishedCount, draftCount],
        backgroundColor: ["#22c55e", "#6b7280"],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const userBarChartData = {
    labels: ["Đã đăng", "Nháp"],
    datasets: [
      {
        label: "Số lượng bài viết (Cá nhân)",
        data: [userPublishedCount, userDraftCount],
        backgroundColor: ["rgba(34, 197, 94, 0.8)", "rgba(107, 114, 128, 0.8)"],
        barThickness: 50,
      },
    ],
  };

  const userDoughnutChartData = {
    labels: ["Đã đăng", "Nháp"],
    datasets: [
      {
        data: [userPublishedCount, userDraftCount],
        backgroundColor: ["#22c55e", "#6b7280"],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const maxSystemCount = Math.max(publishedCount, draftCount);
  const systemStepSize = maxSystemCount < 10 ? 1 : maxSystemCount < 100 ? 5 : 10;
  const maxUserCount = Math.max(userPublishedCount, userDraftCount);
  const userStepSize = maxUserCount < 10 ? 1 : maxUserCount < 100 ? 5 : 10;

  const chartOptions = {
    scales: {
      y: {
        ticks: { stepSize: systemStepSize },
        grid: { lineWidth: 1, color: "rgba(200, 200, 200, 0.2)" },
      },
    },
    plugins: {
      legend: { display: true, position: "top" },
    },
  };

  const userChartOptions = {
    scales: {
      y: {
        ticks: { stepSize: userStepSize },
        grid: { lineWidth: 1, color: "rgba(200, 200, 200, 0.2)" },
      },
    },
    plugins: {
      legend: { display: true, position: "top" },
    },
  };

  const doughnutChartOptions = {
    plugins: {
      legend: { position: "bottom" },
    },
    cutout: "60%",
  };

  const exportReportExcel = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setConfirmMessage("Bạn có chắc chắn muốn xuất báo cáo dưới dạng Excel?");
    setConfirmAction(() => confirmExportExcel);
    setShowConfirm(true);
  };

  const confirmExportExcel = () => {
    const headers = ["Tiêu đề", "Trạng thái", "Thời gian"];
    const data = [
      ...filteredPosts.map((post) => [
        `"${post.title?.replace(/"/g, '""') || "Không có tiêu đề"}"`,
        "Đã đăng",
        formatDate(post.created_at),
      ]),
      ...filteredDemos.map((demo) => [
        `"${demo.title?.replace(/"/g, '""') || "Không có tiêu đề"}"`,
        "Nháp",
        formatDate(demo.created_at),
      ]),
    ];

    const csvContent = [headers.join(","), ...data.map((row) => row.join(","))].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "bao_cao_bai_viet.csv");
    setNotification({ message: "Báo cáo Excel đã được xuất thành công!", type: "success" });
    setShowConfirm(false);
  };

  const exportReportWord = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setConfirmMessage("Bạn có chắc chắn muốn xuất báo cáo dưới dạng Word?");
    setConfirmAction(() => confirmExportWord);
    setShowConfirm(true);
  };

  const confirmExportWord = () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({ text: "Báo Cáo Bài Viết", heading: "Heading1", alignment: "center" }),
            new Paragraph({
              text: `Tổng bài đã đăng: ${publishedCount} | Tổng bản nháp: ${draftCount}`,
              alignment: "center",
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: "Thống kê số lượng bài viết",
              heading: "Heading2",
              alignment: "center",
              spacing: { after: 100 },
            }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Trạng thái")] }),
                    new TableCell({ children: [new Paragraph("Số lượng")] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Đã đăng")] }),
                    new TableCell({ children: [new Paragraph(publishedCount.toString())] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Nháp")] }),
                    new TableCell({ children: [new Paragraph(draftCount.toString())] }),
                  ],
                }),
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new Paragraph({
              text: "Danh sách bài viết",
              heading: "Heading2",
              alignment: "center",
              spacing: { before: 400, after: 100 },
            }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Tiêu đề")] }),
                    new TableCell({ children: [new Paragraph("Trạng thái")] }),
                    new TableCell({ children: [new Paragraph("Thời gian")] }),
                  ],
                }),
                ...filteredPosts.map((post) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(post.title || "Không có tiêu đề")] }),
                      new TableCell({ children: [new Paragraph("Đã đăng")] }),
                      new TableCell({ children: [new Paragraph(formatDate(post.created_at))] }),
                    ],
                  })
                ),
                ...filteredDemos.map((demo) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(demo.title || "Không có tiêu đề")] }),
                      new TableCell({ children: [new Paragraph("Nháp")] }),
                      new TableCell({ children: [new Paragraph(formatDate(demo.created_at))] }),
                    ],
                  })
                ),
              ],
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "bao_cao_bai_viet.docx");
      setNotification({ message: "Báo cáo Word đã được xuất thành công!", type: "success" });
      setShowConfirm(false);
    });
  };

  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="mt-24 p-5 rounded-lg shadow-md border border-blue-200 text-gray-700 relative">
      <div className="min-h-screen bg-blue-200 flex flex-col">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 text-center mb-5 mt-2">
          Thống kê bài viết
        </h1>
        <div className="flex flex-1 pb-10 px-6">
          <main className="flex-1 space-y-8">
            {/* User's Personal Blog Overview */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-300 animate-fade-in">
              <h2 className="text-2xl font-semibold text-purple-600 mb-4">Tổng quan bài viết của riêng bạn</h2>
              {isLoggedIn ? (
                <>
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-inner">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Thông tin nhanh</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li>Tổng bài viết: <span className="font-bold">{posts.length + demos.length}</span></li>
                      <li>Bài của bạn: <span className="font-bold">{userPosts.length + userDemos.length}</span></li>
                      <li>Năm khả dụng: <span className="font-bold">{availableYears.length}</span></li>
                    </ul>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-100 p-4 rounded-lg flex items-center justify-between hover:scale-105 transition duration-200">
                      <div className="flex items-center">
                        <CheckCircleOutlined className="text-3xl text-green-500 mr-3" />
                        <div>
                          <p className="text-gray-700">Đã đăng</p>
                          <p className="text-2xl font-bold text-green-600">{userPublishedCount}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-between hover:scale-105 transition duration-200">
                      <div className="flex items-center">
                        <FileOutlined className="text-3xl text-gray-500 mr-3" />
                        <div>
                          <p className="text-gray-700">Nháp</p>
                          <p className="text-2xl font-bold text-gray-600">{userDraftCount}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Lọc theo thời gian</h3>
                    <div className="flex flex-wrap gap-4">
                      <select
                        value={userFilterType}
                        onChange={(e) => setUserFilterType(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!isLoggedIn}
                      >
                        <option value="week">Tuần</option>
                        <option value="month">Tháng</option>
                        <option value="year">Năm</option>
                      </select>
                      {userFilterType === "week" && (
                        <>
                          <input
                            type="date"
                            value={userStartDate}
                            onChange={(e) => setUserStartDate(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!isLoggedIn}
                          />
                          <input
                            type="date"
                            value={userEndDate}
                            onChange={(e) => setUserEndDate(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!isLoggedIn}
                          />
                        </>
                      )}
                      {userFilterType === "month" && (
                        <select
                          value={userSelectedMonth}
                          onChange={(e) => setUserSelectedMonth(e.target.value)}
                          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!isLoggedIn}
                        >
                          <option value="">Chọn tháng</option>
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              Tháng {i + 1}
                            </option>
                          ))}
                        </select>
                      )}
                      {(userFilterType === "month" || userFilterType === "year") && (
                        <select
                          value={userSelectedYear}
                          onChange={(e) => setUserSelectedYear(e.target.value)}
                          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!isLoggedIn}
                        >
                          <option value="">Chọn năm</option>
                          {availableYears.map((year) => (
                            <option key={year} value={year}>
                              Năm {year}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={handleUserFilter}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400"
                        disabled={!isLoggedIn}
                      >
                        Kiểm tra
                      </button>
                    </div>
                  </div>
                  {isUserFiltered && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Kết quả lọc</h3>
                      <div className="w-full overflow-y-auto rounded-lg shadow-inner" style={{ maxHeight: "18rem" }}>
                        <table className="w-full border-collapse bg-white rounded-lg text-sm">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="border-b border-gray-200 px-4 py-2 text-left">Tiêu đề</th>
                              <th className="border-b border-gray-200 px-4 py-2 text-left">Trạng thái</th>
                              <th className="border-b border-gray-200 px-4 py-2 text-left">Thời gian</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUserPosts.concat(filteredUserDemos).map((article, index) => (
                              <tr key={`${article.id}-${index}`} className={`hover:bg-blue-50 transition duration-150 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                                <td className="border-b border-gray-200 px-4 py-2 truncate max-w-xs">{article.title || "Không có tiêu đề"}</td>
                                <td className={`border-b border-gray-200 px-4 py-2 ${filteredUserPosts.includes(article) ? "text-green-600" : "text-gray-600"}`}>
                                  {filteredUserPosts.includes(article) ? "Đã đăng" : "Nháp"}
                                </td>
                                <td className="border-b border-gray-200 px-4 py-2">{formatDate(article.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {isUserFiltered && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                          <BarChartOutlined className="mr-2" /> Thống kê cột
                        </h3>
                        <Bar data={userBarChartData} options={userChartOptions} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                          <PieChartOutlined className="mr-2" /> Thống kê vòng
                        </h3>
                        <Doughnut data={userDoughnutChartData} options={doughnutChartOptions} />
                      </div>
                    </div>
                  )}
                  {isUserFiltered && (
                    <div className="mt-6 text-right">
                      <button className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition duration-200">
                        Xem chi tiết
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-600">Vui lòng đăng nhập để xem thống kê bài viết của bạn.</p>
              )}
            </div>
            {/* System-Wide Blog Overview */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-300 animate-fade-in">
              <h2 className="text-2xl font-semibold text-purple-600 mb-4">Tổng quan bài viết toàn hệ thống</h2>
              {isLoggedIn ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-100 p-4 rounded-lg flex items-center justify-between hover:scale-105 transition duration-200">
                      <div className="flex items-center">
                        <CheckCircleOutlined className="text-3xl text-green-500 mr-3" />
                        <div>
                          <p className="text-gray-700">Đã đăng</p>
                          <p className="text-2xl font-bold text-green-600">{publishedCount}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-between hover:scale-105 transition duration-200">
                      <div className="flex items-center">
                        <FileOutlined className="text-3xl text-gray-500 mr-3" />
                        <div>
                          <p className="text-gray-700">Nháp</p>
                          <p className="text-2xl font-bold text-gray-600">{draftCount}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Lọc theo thời gian</h3>
                    <div className="flex flex-wrap gap-4">
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!isLoggedIn}
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
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!isLoggedIn}
                          />
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!isLoggedIn}
                          />
                        </>
                      )}
                      {filterType === "month" && (
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!isLoggedIn}
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
                          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!isLoggedIn}
                        >
                          <option value="">Chọn năm</option>
                          {availableYears.map((year) => (
                            <option key={year} value={year}>
                              Năm {year}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={handleSystemFilter}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400"
                        disabled={!isLoggedIn}
                      >
                        Kiểm tra
                      </button>
                    </div>
                  </div>
                  {isFiltered && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Kết quả lọc</h3>
                      <div className="w-full overflow-y-auto rounded-lg shadow-inner" style={{ maxHeight: "18rem" }}>
                        <table className="w-full border-collapse bg-white rounded-lg text-sm">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="border-b border-gray-200 px-4 py-2 text-left">Tiêu đề</th>
                              <th className="border-b border-gray-200 px-4 py-2 text-left">Trạng thái</th>
                              <th className="border-b border-gray-200 px-4 py-2 text-left">Thời gian</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPosts.concat(filteredDemos).map((article, index) => (
                              <tr key={`${article.id}-${index}`} className={`hover:bg-blue-50 transition duration-150 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                                <td className="border-b border-gray-200 px-4 py-2 truncate max-w-xs">{article.title || "Không có tiêu đề"}</td>
                                <td className={`border-b border-gray-200 px-4 py-2 ${filteredPosts.includes(article) ? "text-green-600" : "text-gray-600"}`}>
                                  {filteredPosts.includes(article) ? "Đã đăng" : "Nháp"}
                                </td>
                                <td className="border-b border-gray-200 px-4 py-2">{formatDate(article.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {isFiltered && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                          <BarChartOutlined className="mr-2" /> Thống kê cột
                        </h3>
                        <Bar data={systemBarChartData} options={chartOptions} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                          <PieChartOutlined className="mr-2" /> Thống kê vòng
                        </h3>
                        <Doughnut data={systemDoughnutChartData} options={doughnutChartOptions} />
                      </div>
                    </div>
                  )}
                  {isFiltered && (
                    <div className="mt-6 flex justify-end gap-4">
                      <button
                        onClick={exportReportExcel}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
                      >
                        Xuất Excel
                      </button>
                      <button
                        onClick={exportReportWord}
                        className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition duration-200"
                      >
                        Xuất Word
                      </button>
                      <button className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition duration-200">
                        Xem chi tiết
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-600">Vui lòng đăng nhập để xem thống kê bài viết.</p>
              )}
            </div>
          </main>
        </div>

        {notification && (
          <div className="fixed top-20 right-6 z-50">
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          </div>
        )}

        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <Confirm
              message={confirmMessage}
              onConfirm={confirmAction}
              onCancel={() => setShowConfirm(false)}
            />
          </div>
        )}


        <style jsx>{`
          .overflow-y-auto {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .overflow-y-auto::-webkit-scrollbar {
            display: none;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}