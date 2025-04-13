"use client";
import { useState, useEffect } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { BarChartOutlined, CheckCircleOutlined, FileOutlined, PieChartOutlined, EyeOutlined } from "@ant-design/icons";
import { supabase } from "../../../lib/supabase";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } from "docx";
import { saveAs } from "file-saver";
import { useRouter } from "next/navigation";
import Notification from "../../../utils/notification";
import Confirm from "../../../utils/error";
import Link from "next/link";

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function ReportApp() {
  // Trạng thái cho bộ lọc hệ thống
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [filterType, setFilterType] = useState("week");
  const [systemTimeFilter, setSystemTimeFilter] = useState("last7days");

  // Dữ liệu hệ thống
  const [posts, setPosts] = useState([]);
  const [demos, setDemos] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [filteredDemos, setFilteredDemos] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  // Trạng thái cho bộ lọc cá nhân
  const [userStartDate, setUserStartDate] = useState("");
  const [userEndDate, setUserEndDate] = useState("");
  const [userSelectedMonth, setUserSelectedMonth] = useState("");
  const [userSelectedYear, setUserSelectedYear] = useState("");
  const [userFilterType, setUserFilterType] = useState("week");
  const [userTimeFilter, setUserTimeFilter] = useState("last7days");

  // Dữ liệu cá nhân
  const [userPosts, setUserPosts] = useState([]);
  const [userDemos, setUserDemos] = useState([]);
  const [filteredUserPosts, setFilteredUserPosts] = useState([]);
  const [filteredUserDemos, setFilteredUserDemos] = useState([]);

  // Trạng thái giao diện
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

  // Xử lý thông báo tự động biến mất sau 3 giây
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Thiết lập ngày mặc định (tuần hiện tại với ngày kết thúc là hiện tại)
  useEffect(() => {
    const today = new Date("2025-04-13"); // Ngày hiện tại
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 6); // 6 ngày trước

    setStartDate(startOfWeek.toISOString().split("T")[0]); // 2025-04-07
    setEndDate(today.toISOString().split("T")[0]); // 2025-04-13
    setUserStartDate(startOfWeek.toISOString().split("T")[0]);
    setUserEndDate(today.toISOString().split("T")[0]);
  }, []);

  // Kiểm tra trạng thái đăng nhập và lấy dữ liệu
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
            message: "Không tìm thấy thông tin tên người dùng.",
            type: "error",
          });
          setLoading(false);
        }
      } else {
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

  // Cập nhật danh sách năm khả dụng
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

  // Lấy dữ liệu từ Supabase
  const fetchData = async (userName) => {
    try {
      setLoading(true);
      console.log("Fetching posts for user:", userName);
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id, title, content, created_at, name");
      if (postsError) {
        console.error("Posts Error:", postsError);
        throw postsError;
      }
      console.log("Posts Data:", postsData);

      console.log("Fetching demos for user:", userName);
      const { data: demosData, error: demosError } = await supabase
        .from("demos")
        .select("id, title, content, created_at, name");
      if (demosError) {
        console.error("Demos Error:", demosError);
        throw demosError;
      }
      console.log("Demos Data:", demosData);

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

      applySystemTimeFilter("last7days", postsData, demosData);
      applyUserTimeFilter("last7days", userPostsData, userDemosData);
    } catch (err) {
      console.error("Fetch Error:", err);
      setNotification({
        message: `Lỗi khi lấy dữ liệu: ${err.message}`,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Áp dụng bộ lọc nhanh cho hệ thống
  const applySystemTimeFilter = (filter, postsData = posts, demosData = demos) => {
    const today = new Date("2025-04-13");
    let filterStartDate;

    switch (filter) {
      case "today":
        filterStartDate = new Date(today);
        break;
      case "last7days":
        filterStartDate = new Date(today);
        filterStartDate.setDate(today.getDate() - 6);
        break;
      case "last30days":
        filterStartDate = new Date(today);
        filterStartDate.setDate(today.getDate() - 30);
        break;
      case "all":
        filterStartDate = new Date(0);
        break;
      default:
        return;
    }

    const filteredPostsResult = postsData.filter((post) => {
      const createdAt = new Date(post.created_at);
      return createdAt >= filterStartDate && createdAt <= today;
    });

    const filteredDemosResult = demosData.filter((demo) => {
      const createdAt = new Date(demo.created_at);
      return createdAt >= filterStartDate && createdAt <= today;
    });

    setFilteredPosts(filteredPostsResult);
    setFilteredDemos(filteredDemosResult);
    setSystemTimeFilter(filter);
    setIsFiltered(true);
    setNotification({
      message: "Dữ liệu hệ thống đã được lọc thành công!",
      type: "success",
    });
  };

  // Áp dụng bộ lọc nhanh cho cá nhân
  const applyUserTimeFilter = (filter, postsData = userPosts, demosData = userDemos) => {
    const today = new Date("2025-04-13");
    let filterStartDate;

    switch (filter) {
      case "today":
        filterStartDate = new Date(today);
        break;
      case "last7days":
        filterStartDate = new Date(today);
        filterStartDate.setDate(today.getDate() - 6);
        break;
      case "last30days":
        filterStartDate = new Date(today);
        filterStartDate.setDate(today.getDate() - 30);
        break;
      case "all":
        filterStartDate = new Date(0);
        break;
      default:
        return;
    }

    const filteredPostsResult = postsData.filter((post) => {
      const createdAt = new Date(post.created_at);
      return createdAt >= filterStartDate && createdAt <= today;
    });

    const filteredDemosResult = demosData.filter((demo) => {
      const createdAt = new Date(demo.created_at);
      return createdAt >= filterStartDate && createdAt <= today;
    });

    setFilteredUserPosts(filteredPostsResult);
    setFilteredUserDemos(filteredDemosResult);
    setUserTimeFilter(filter);
    setIsUserFiltered(true);
    setNotification({
      message: "Dữ liệu cá nhân đã được lọc thành công!",
      type: "success",
    });
  };

  // Xử lý bộ lọc tùy chỉnh hệ thống
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

  // Xử lý bộ lọc tùy chỉnh cá nhân
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

  // Định dạng ngày
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    if (filterType === "month" || userFilterType === "month") {
      return `${date.getMonth() + 1}/${date.getFullYear()}`;
    }
    if (filterType === "year" || userFilterType === "year") {
      return `${date.getFullYear()}`;
    }
    return date.toISOString().split("T")[0];
  };

  // Đếm số bài viết
  const publishedCount = isLoggedIn ? filteredPosts.length : 0;
  const draftCount = isLoggedIn ? filteredDemos.length : 0;
  const userPublishedCount = isLoggedIn ? filteredUserPosts.length : 0;
  const userDraftCount = isLoggedIn ? filteredUserDemos.length : 0;

  // Dữ liệu biểu đồ hệ thống
  const systemBarChartData = {
    labels: ["Đã đăng", "Nháp"],
    datasets: [
      {
        label: "Số lượng bài viết (Hệ thống)",
        data: isLoggedIn ? [publishedCount, draftCount] : [0, 0],
        backgroundColor: ["rgba(59, 130, 246, 0.8)", "rgba(107, 114, 128, 0.8)"],
        barThickness: 50,
      },
    ],
  };

  const systemDoughnutChartData = {
    labels: ["Đã đăng", "Nháp"],
    datasets: [
      {
        data: isLoggedIn ? [publishedCount, draftCount] : [0, 0],
        backgroundColor: ["#3B82F6", "#6b7280"],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  // Dữ liệu biểu đồ cá nhân
  const userBarChartData = {
    labels: ["Đã đăng", "Nháp"],
    datasets: [
      {
        label: "Số lượng bài viết (Cá nhân)",
        data: isLoggedIn ? [userPublishedCount, userDraftCount] : [0, 0],
        backgroundColor: ["rgba(59, 130, 246, 0.8)", "rgba(107, 114, 128, 0.8)"],
        barThickness: 50,
      },
    ],
  };

  const userDoughnutChartData = {
    labels: ["Đã đăng", "Nháp"],
    datasets: [
      {
        data: isLoggedIn ? [userPublishedCount, userDraftCount] : [0, 0],
        backgroundColor: ["#3B82F6", "#6b7280"],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  // Cấu hình biểu đồ
  const maxSystemCount = Math.max(publishedCount, draftCount, 1);
  const systemStepSize = maxSystemCount < 10 ? 1 : maxSystemCount < 100 ? 5 : 10;
  const maxUserCount = Math.max(userPublishedCount, userDraftCount, 1);
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

  // Xuất báo cáo Excel hệ thống
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

  // Xuất báo cáo Word hệ thống
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

  // Xuất báo cáo Excel cá nhân
  const exportPersonalReportExcel = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setConfirmMessage("Bạn có chắc chắn muốn xuất báo cáo cá nhân dưới dạng Excel?");
    setConfirmAction(() => confirmExportPersonalExcel);
    setShowConfirm(true);
  };

  const confirmExportPersonalExcel = () => {
    const headers = ["Tiêu đề", "Trạng thái", "Thời gian"];
    const data = [
      ...filteredUserPosts.map((post) => [
        `"${post.title?.replace(/"/g, '""') || "Không có tiêu đề"}"`,
        "Đã đăng",
        formatDate(post.created_at),
      ]),
      ...filteredUserDemos.map((demo) => [
        `"${demo.title?.replace(/"/g, '""') || "Không có tiêu đề"}"`,
        "Nháp",
        formatDate(demo.created_at),
      ]),
    ];

    const csvContent = [headers.join(","), ...data.map((row) => row.join(","))].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "bao_cao_ca_nhan.csv");
    setNotification({ message: "Báo cáo cá nhân Excel đã được xuất thành công!", type: "success" });
    setShowConfirm(false);
  };

  // Xuất báo cáo Word cá nhân
  const exportPersonalReportWord = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setConfirmMessage("Bạn có chắc chắn muốn xuất báo cáo cá nhân dưới dạng Word?");
    setConfirmAction(() => confirmExportPersonalWord);
    setShowConfirm(true);
  };

  const confirmExportPersonalWord = () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({ text: "Báo Cáo Bài Viết Cá Nhân", heading: "Heading1", alignment: "center" }),
            new Paragraph({
              text: `Tổng bài đã đăng: ${userPublishedCount} | Tổng bản nháp: ${userDraftCount}`,
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
                    new TableCell({ children: [new Paragraph(userPublishedCount.toString())] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Nháp")] }),
                    new TableCell({ children: [new Paragraph(userDraftCount.toString())] }),
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
                ...filteredUserPosts.map((post) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(post.title || "Không có tiêu đề")] }),
                      new TableCell({ children: [new Paragraph("Đã đăng")] }),
                      new TableCell({ children: [new Paragraph(formatDate(post.created_at))] }),
                    ],
                  })
                ),
                ...filteredUserDemos.map((demo) =>
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
      saveAs(blob, "bao_cao_ca_nhan.docx");
      setNotification({ message: "Báo cáo cá nhân Word đã được xuất thành công!", type: "success" });
      setShowConfirm(false);
    });
  };

  // Chuyển hướng đến trang đăng nhập
  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    router.push("/auth/login");
  };

  // Giao diện khi đang tải
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="mt-24 p-5 rounded-lg shadow-md border border-blue-200 text-gray-700 relative">
      <div className="min-h-screen bg-blue-100 flex flex-col">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 text-center mb-5 mt-2">
          Thống kê bài viết
        </h1>
        <div className="flex flex-1 pb-10 px-6">
          <main className="flex-1 space-y-8">
            {/* Tổng quan bài viết cá nhân */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-300 animate-fade-in">
              <h2 className="text-2xl font-semibold text-purple-600 mb-4">Tổng quan bài viết cá nhân</h2>
              <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-inner animate-slide-in">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Thông tin nhanh</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center transform transition-transform duration-300 hover:scale-95">
                    <span className="w-32">Tổng bài viết:</span>
                    <span className="font-bold">{isLoggedIn ? posts.length + demos.length : 0}</span>
                  </li>
                  <li className="flex items-center transform transition-transform duration-300 hover:scale-95">
                    <span className="w-32">Bài của bạn:</span>
                    <span className="font-bold">{isLoggedIn ? userPosts.length + userDemos.length : 0}</span>
                  </li>
                  <li className="flex items-center transform transition-transform duration-300 hover:scale-95">
                    <span className="w-32">Năm khả dụng:</span>
                    <span className="font-bold">{isLoggedIn ? availableYears.length : 0}</span>
                  </li>
                </ul>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-100 p-4 rounded-lg flex items-center justify-between hover:scale-105 transition duration-200">
                  <div className="flex items-center">
                    <CheckCircleOutlined className="text-3xl text-blue-500 mr-3" />
                    <div>
                      <p className="text-gray-700">Đã đăng</p>
                      <p className="text-2xl font-bold text-blue-600">{isLoggedIn ? userPublishedCount : 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-between hover:scale-105 transition duration-200">
                  <div className="flex items-center">
                    <FileOutlined className="text-3xl text-gray-500 mr-3" />
                    <div>
                      <p className="text-gray-700">Nháp</p>
                      <p className="text-2xl font-bold text-gray-600">{isLoggedIn ? userDraftCount : 0}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Lọc nhanh</h3>
                <div className="flex flex-wrap gap-2 bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg shadow-sm">
                  {[
                    { label: "Hôm nay", value: "today" },
                    { label: "7 ngày qua", value: "last7days" },
                    { label: "30 ngày qua", value: "last30days" },
                    { label: "Tất cả", value: "all" },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => applyUserTimeFilter(filter.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        userTimeFilter === filter.value
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                          : "bg-white text-gray-700 hover:bg-blue-200"
                      } disabled:bg-gray-300 disabled:text-gray-500`}
                      disabled={!isLoggedIn}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Lọc theo thời gian</h3>
                <div className="flex flex-wrap gap-4 bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg shadow-sm">
                  <select
                    value={userFilterType}
                    onChange={(e) => setUserFilterType(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200"
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
                        className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200"
                        disabled={!isLoggedIn}
                      />
                      <input
                        type="date"
                        value={userEndDate}
                        onChange={(e) => setUserEndDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200"
                        disabled={!isLoggedIn}
                      />
                    </>
                  )}
                  {userFilterType === "month" && (
                    <select
                      value={userSelectedMonth}
                      onChange={(e) => setUserSelectedMonth(e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200"
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
                      className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200"
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
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:bg-gray-400 transform hover:scale-105"
                    disabled={!isLoggedIn}
                  >
                    Lọc dữ liệu
                  </button>
                </div>
              </div>
              {isUserFiltered && isLoggedIn ? (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Kết quả lọc</h3>
                  <div className="flex justify-center">
                    <div className="w-1/2 rounded-lg shadow-inner no-scrollbar max-h-[400px] overflow-y-auto">
                      <table className="w-full border-collapse bg-white rounded-lg text-sm">
                        <thead className="bg-gradient-to-r from-blue-500 to-purple-500 text-white sticky top-0">
                          <tr>
                            <th className="px-6 py-4 text-left font-semibold">Tiêu đề</th>
                            <th className="px-6 py-4 text-left font-semibold">Trạng thái</th>
                            <th className="px-6 py-4 text-left font-semibold">Thời gian</th>
                            <th className="px-6 py-4 text-left font-semibold">Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUserPosts.concat(filteredUserDemos).length > 0 ? (
                            filteredUserPosts.concat(filteredUserDemos).map((article, index) => {
                              console.log("Rendering user article:", article);
                              return (
                                <tr key={`${article.id}-${index}`} className={`hover:bg-blue-50 transition-all duration-200 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                                  <td className="px-6 py-4 truncate max-w-xs">{article.title || "Không có tiêu đề"}</td>
                                  <td className={`px-6 py-4 ${filteredUserPosts.includes(article) ? "text-blue-600 font-medium" : "text-gray-600 font-medium"}`}>
                                    {filteredUserPosts.includes(article) ? "Đã đăng" : "Nháp"}
                                  </td>
                                  <td className="px-6 py-4">{formatDate(article.created_at)}</td>
                                  <td className="px-6 py-4">
                                    <Link href={`/detail?postId=${article.id}&type=${filteredUserPosts.includes(article) ? "post" : "demo"}`} className="text-blue-600 hover:text-blue-800 transition-colors duration-200" title="Xem chi tiết">
                                      <EyeOutlined className="text-lg" />
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                Không có dữ liệu
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                !isLoggedIn && (
                  <div className="mt-6 text-gray-600 text-center">Vui lòng đăng nhập để xem kết quả lọc.</div>
                )
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <BarChartOutlined className="mr-2" /> Thống kê cột
                  </h3>
                  <div className="w-full" style={{ height: "300px" }}>
                    <Bar data={userBarChartData} options={userChartOptions} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <PieChartOutlined className="mr-2" /> Thống kê vòng
                  </h3>
                  <div className="w-full flex justify-center" style={{ height: "300px" }}>
                    <div style={{ width: "50%" }}>
                      <Doughnut data={userDoughnutChartData} options={doughnutChartOptions} />
                    </div>
                  </div>
                </div>
              </div>
              {isUserFiltered && isLoggedIn && (
                <div className="mt-6 flex justify-end gap-4">
                  <button
                    onClick={exportPersonalReportExcel}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition duration-200 disabled:bg-gray-400"
                  >
                    Xuất Excel
                  </button>
                  <button
                    onClick={exportPersonalReportWord}
                    className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition duration-200 disabled:bg-gray-400"
                  >
                    Xuất Word
                  </button>
                </div>
              )}
            </div>
            {/* Tổng quan bài viết hệ thống */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition duration-300 animate-fade-in">
              <h2 className="text-2xl font-semibold text-purple-600 mb-4">Tổng quan bài viết toàn hệ thống</h2>
              <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-inner animate-slide-in">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Thông tin nhanh</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center transform transition-transform duration-300 hover:scale-95">
                    <span className="w-32">Tổng bài viết:</span>
                    <span className="font-bold">{isLoggedIn ? posts.length + demos.length : 0}</span>
                  </li>
                  <li className="flex items-center transform transition-transform duration-300 hover:scale-95">
                    <span className="w-32">Bài đã đăng:</span>
                    <span className="font-bold">{isLoggedIn ? posts.length : 0}</span>
                  </li>
                  <li className="flex items-center transform transition-transform duration-300 hover:scale-95">
                    <span className="w-32">Bản nháp:</span>
                    <span className="font-bold">{isLoggedIn ? demos.length : 0}</span>
                  </li>
                </ul>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-100 p-4 rounded-lg flex items-center justify-between hover:scale-105 transition duration-200">
                  <div className="flex items-center">
                    <CheckCircleOutlined className="text-3xl text-blue-500 mr-3" />
                    <div>
                      <p className="text-gray-700">Đã đăng</p>
                      <p className="text-2xl font-bold text-blue-600">{isLoggedIn ? publishedCount : 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-between hover:scale-105 transition duration-200">
                  <div className="flex items-center">
                    <FileOutlined className="text-3xl text-gray-500 mr-3" />
                    <div>
                      <p className="text-gray-700">Nháp</p>
                      <p className="text-2xl font-bold text-gray-600">{isLoggedIn ? draftCount : 0}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Lọc nhanh</h3>
                <div className="flex flex-wrap gap-2 bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg shadow-sm">
                  {[
                    { label: "Hôm nay", value: "today" },
                    { label: "7 ngày qua", value: "last7days" },
                    { label: "30 ngày qua", value: "last30days" },
                    { label: "Tất cả", value: "all" },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => applySystemTimeFilter(filter.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        systemTimeFilter === filter.value
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                          : "bg-white text-gray-700 hover:bg-blue-200"
                      } disabled:bg-gray-300 disabled:text-gray-500`}
                      disabled={!isLoggedIn}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Lọc theo thời gian</h3>
                <div className="flex flex-wrap gap-4 bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg shadow-sm">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200"
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
                        className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200"
                        disabled={!isLoggedIn}
                      />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200"
                        disabled={!isLoggedIn}
                      />
                    </>
                  )}
                  {filterType === "month" && (
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200"
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
                      className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200"
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
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:bg-gray-400 transform hover:scale-105"
                    disabled={!isLoggedIn}
                  >
                    Lọc dữ liệu
                  </button>
                </div>
              </div>
              {isFiltered && isLoggedIn ? (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Kết quả lọc</h3>
                  <div className="flex justify-center">
                    <div className="w-1/2 rounded-lg shadow-inner no-scrollbar max-h-[400px] overflow-y-auto">
                      <table className="w-full border-collapse bg-white rounded-lg text-sm">
                        <thead className="bg-gradient-to-r from-blue-500 to-purple-500 text-white sticky top-0">
                          <tr>
                            <th className="px-6 py-4 text-left font-semibold">Tiêu đề</th>
                            <th className="px-6 py-4 text-left font-semibold">Trạng thái</th>
                            <th className="px-6 py-4 text-left font-semibold">Thời gian</th>
                            <th className="px-6 py-4 text-left font-semibold">Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPosts.concat(filteredDemos).length > 0 ? (
                            filteredPosts.concat(filteredDemos).map((article, index) => {
                              console.log("Rendering system article:", article);
                              return (
                                <tr key={`${article.id}-${index}`} className={`hover:bg-blue-50 transition-all duration-200 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                                  <td className="px-6 py-4 truncate max-w-xs">{article.title || "Không có tiêu đề"}</td>
                                  <td className={`px-6 py-4 ${filteredPosts.includes(article) ? "text-blue-600 font-medium" : "text-gray-600 font-medium"}`}>
                                    {filteredPosts.includes(article) ? "Đã đăng" : "Nháp"}
                                  </td>
                                  <td className="px-6 py-4">{formatDate(article.created_at)}</td>
                                  <td className="px-6 py-4">
                                    <Link href={`/detail?postId=${article.id}&type=${filteredPosts.includes(article) ? "post" : "demo"}`} className="text-blue-600 hover:text-blue-800 transition-colors duration-200" title="Xem chi tiết">
                                      <EyeOutlined className="text-lg" />
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                Không có dữ liệu
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                !isLoggedIn && (
                  <div className="mt-6 text-gray-600 text-center">Vui lòng đăng nhập để xem kết quả lọc.</div>
                )
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <BarChartOutlined className="mr-2" /> Thống kê cột
                  </h3>
                  <div className="w-full" style={{ height: "300px" }}>
                    <Bar data={systemBarChartData} options={chartOptions} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <PieChartOutlined className="mr-2" /> Thống kê vòng
                  </h3>
                  <div className="w-full flex justify-center" style={{ height: "300px" }}>
                    <div style={{ width: "50%" }}>
                      <Doughnut data={systemDoughnutChartData} options={doughnutChartOptions} />
                    </div>
                  </div>
                </div>
              </div>
              {isFiltered && isLoggedIn && (
                <div className="mt-6 flex justify-end gap-4">
                  <button
                    onClick={exportReportExcel}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition duration-200 disabled:bg-gray-400"
                  >
                    Xuất Excel
                  </button>
                  <button
                    onClick={exportReportWord}
                    className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition duration-200 disabled:bg-gray-400"
                  >
                    Xuất Word
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Thông báo */}
        {notification && (
          <div className="fixed top-20 right-6 z-50">
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          </div>
        )}

        {/* Modal xác nhận */}
        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <Confirm
              message={confirmMessage}
              onConfirm={confirmAction}
              onCancel={() => setShowConfirm(false)}
            />
          </div>
        )}

        {/* Modal đăng nhập */}
        {showLoginModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent">

            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Yêu cầu đăng nhập</h3>
              <p className="text-gray-600 mb-6">Vui lòng đăng nhập để xem thống kê bài viết.</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleLoginRedirect}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition duration-200"
                >
                  Đăng nhập
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CSS tùy chỉnh */}
        <style jsx>{`
          .no-scrollbar {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
          }
          .animate-slide-in {
            animation: slideIn 0.5s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}