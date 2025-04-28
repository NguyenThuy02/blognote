"use client";
import { useState, useEffect } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  BarChartOutlined,
  CheckCircleOutlined,
  FileOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import { supabase } from "../../../lib/supabase";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import { useRouter } from "next/navigation";
import Notification from "../../../utils/notification";
import Confirm from "../../../utils/error";
import ThemeSelector, { themes, getThemeClasses } from "../../../utils/color";

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function ReportApp() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [filterType, setFilterType] = useState("week");
  const [systemTimeFilter, setSystemTimeFilter] = useState("last7days");
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
  const [userTimeFilter, setUserTimeFilter] = useState("last7days");
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
  const [theme, setTheme] = useState("light");
  const router = useRouter();

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme") || "light";
      setTheme(savedTheme);
    } catch (err) {
      setNotification({
        message: "Không thể tải giao diện: " + err.message,
        type: "error",
      });
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("theme", theme);
    } catch (err) {
      setNotification({
        message: "Không thể lưu giao diện: " + err.message,
        type: "error",
      });
    }
  }, [theme]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        setLoading(true);
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const loggedIn = !!(userData && (userData.name || userData.email));
        setIsLoggedIn(loggedIn);
        setShowLoginModal(!loggedIn);

        if (loggedIn) {
          const userName = userData.name;
          if (userName) {
            await fetchData(userName);
          } else {
            setNotification({
              message: "Không tìm thấy thông tin tên người dùng.",
              type: "error",
            });
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
        }
      } catch (err) {
        setNotification({
          message: `Lỗi khi kiểm tra đăng nhập: ${err.message}`,
          type: "error",
        });
      } finally {
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
      checkLoginStatus();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("user-logout", handleLogoutEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-logout", handleLogoutEvent);
    };
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const today = new Date(); // Sử dụng ngày hiện tại
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 6);
    setStartDate(startOfWeek.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
    setUserStartDate(startOfWeek.toISOString().split("T")[0]);
    setUserEndDate(today.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    const years = [
      ...new Set([
        ...posts.map((p) => new Date(p.created_at).getFullYear()),
        ...demos.map((d) => new Date(d.created_at).getFullYear()),
      ]),
    ].sort();
    setAvailableYears(years);
    if (
      years.length > 0 &&
      (!selectedYear || !years.includes(parseInt(selectedYear)))
    ) {
      setSelectedYear(years[years.length - 1].toString());
    }
    if (
      years.length > 0 &&
      (!userSelectedYear || !years.includes(parseInt(userSelectedYear)))
    ) {
      setUserSelectedYear(years[years.length - 1].toString());
    }
  }, [posts, demos]);

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
      console.log(
        "Post Dates:",
        postsData.map((post) => post.created_at)
      );

      console.log("Fetching demos for user:", userName);
      const { data: demosData, error: demosError } = await supabase
        .from("demos")
        .select("id, title, content, created_at, name");
      if (demosError) {
        console.error("Demos Error:", demosError);
        throw demosError;
      }
      console.log("Demos Data:", demosData);
      console.log(
        "Demo Dates:",
        demosData.map((demo) => demo.created_at)
      );

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

  const applySystemTimeFilter = (
    filter,
    postsData = posts,
    demosData = demos
  ) => {
    const today = new Date(); // Sử dụng ngày hiện tại
    let filterStartDate, filterEndDate;

    switch (filter) {
      case "today":
        filterStartDate = new Date(today);
        filterStartDate.setHours(0, 0, 0, 0); // Đầu ngày
        filterEndDate = new Date(today);
        filterEndDate.setHours(23, 59, 59, 999); // Cuối ngày
        break;
      case "last7days":
        filterStartDate = new Date(today);
        filterStartDate.setDate(today.getDate() - 6);
        filterStartDate.setHours(0, 0, 0, 0);
        filterEndDate = new Date(today);
        filterEndDate.setHours(23, 59, 59, 999);
        break;
      case "last30days":
        filterStartDate = new Date(today);
        filterStartDate.setDate(today.getDate() - 30);
        filterStartDate.setHours(0, 0, 0, 0);
        filterEndDate = new Date(today);
        filterEndDate.setHours(23, 59, 59, 999);
        break;
      case "all":
        filterStartDate = new Date(0);
        filterEndDate = new Date(today);
        filterEndDate.setHours(23, 59, 59, 999);
        break;
      default:
        return;
    }

    const filteredPostsResult = postsData.filter((post) => {
      const createdAt = new Date(post.created_at);
      if (isNaN(createdAt.getTime())) {
        console.warn(`Invalid date for post ID ${post.id}: ${post.created_at}`);
        return false;
      }
      return createdAt >= filterStartDate && createdAt <= filterEndDate;
    });

    const filteredDemosResult = demosData.filter((demo) => {
      const createdAt = new Date(demo.created_at);
      if (isNaN(createdAt.getTime())) {
        console.warn(`Invalid date for demo ID ${demo.id}: ${demo.created_at}`);
        return false;
      }
      return createdAt >= filterStartDate && createdAt <= filterEndDate;
    });

    setFilteredPosts(filteredPostsResult);
    setFilteredDemos(filteredDemosResult);
    setSystemTimeFilter(filter);
    setIsFiltered(true);
    if (filteredPostsResult.length > 0 || filteredDemosResult.length > 0) {
      setNotification({
        message: "Dữ liệu hệ thống đã được lọc thành công!",
        type: "success",
      });
    } else {
      setNotification({
        message: "Không tìm thấy dữ liệu cho khoảng thời gian này!",
        type: "warning",
      });
    }
  };

  const applyUserTimeFilter = (
    filter,
    postsData = userPosts,
    demosData = userDemos
  ) => {
    const today = new Date(); // Sử dụng ngày hiện tại
    let filterStartDate, filterEndDate;

    switch (filter) {
      case "today":
        filterStartDate = new Date(today);
        filterStartDate.setHours(0, 0, 0, 0); // Đầu ngày
        filterEndDate = new Date(today);
        filterEndDate.setHours(23, 59, 59, 999); // Cuối ngày
        break;
      case "last7days":
        filterStartDate = new Date(today);
        filterStartDate.setDate(today.getDate() - 6);
        filterStartDate.setHours(0, 0, 0, 0);
        filterEndDate = new Date(today);
        filterEndDate.setHours(23, 59, 59, 999);
        break;
      case "last30days":
        filterStartDate = new Date(today);
        filterStartDate.setDate(today.getDate() - 30);
        filterStartDate.setHours(0, 0, 0, 0);
        filterEndDate = new Date(today);
        filterEndDate.setHours(23, 59, 59, 999);
        break;
      case "all":
        filterStartDate = new Date(0);
        filterEndDate = new Date(today);
        filterEndDate.setHours(23, 59, 59, 999);
        break;
      default:
        return;
    }

    const filteredPostsResult = postsData.filter((post) => {
      const createdAt = new Date(post.created_at);
      if (isNaN(createdAt.getTime())) {
        console.warn(`Invalid date for post ID ${post.id}: ${post.created_at}`);
        return false;
      }
      return createdAt >= filterStartDate && createdAt <= filterEndDate;
    });

    const filteredDemosResult = demosData.filter((demo) => {
      const createdAt = new Date(demo.created_at);
      if (isNaN(createdAt.getTime())) {
        console.warn(`Invalid date for demo ID ${demo.id}: ${demo.created_at}`);
        return false;
      }
      return createdAt >= filterStartDate && createdAt <= filterEndDate;
    });

    setFilteredUserPosts(filteredPostsResult);
    setFilteredUserDemos(filteredDemosResult);
    setUserTimeFilter(filter);
    setIsUserFiltered(true);
    if (filteredPostsResult.length > 0 || filteredDemosResult.length > 0) {
      setNotification({
        message: "Dữ liệu cá nhân đã được lọc thành công!",
        type: "success",
      });
    } else {
      setNotification({
        message: "Không tìm thấy dữ liệu cho khoảng thời gian này!",
        type: "warning",
      });
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
        filterEndDate.setHours(23, 59, 59, 999);
        break;
      case "month":
        filterStartDate = new Date(
          selectedYear,
          parseInt(selectedMonth) - 1,
          1
        );
        filterEndDate = new Date(selectedYear, parseInt(selectedMonth), 0);
        filterEndDate.setHours(23, 59, 59, 999);
        break;
      case "year":
        filterStartDate = new Date(selectedYear, 0, 1);
        filterEndDate = new Date(selectedYear, 11, 31);
        filterEndDate.setHours(23, 59, 59, 999);
        break;
      default:
        return;
    }

    const filteredPostsResult = posts.filter((post) => {
      const createdAt = new Date(post.created_at);
      if (isNaN(createdAt.getTime())) {
        console.warn(`Invalid date for post ID ${post.id}: ${post.created_at}`);
        return false;
      }
      return createdAt >= filterStartDate && createdAt <= filterEndDate;
    });

    const filteredDemosResult = demos.filter((demo) => {
      const createdAt = new Date(demo.created_at);
      if (isNaN(createdAt.getTime())) {
        console.warn(`Invalid date for demo ID ${demo.id}: ${demo.created_at}`);
        return false;
      }
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
      (userFilterType === "month" &&
        (!userSelectedMonth || !userSelectedYear)) ||
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
        filterEndDate.setHours(23, 59, 59, 999);
        break;
      case "month":
        filterStartDate = new Date(
          userSelectedYear,
          parseInt(userSelectedMonth) - 1,
          1
        );
        filterEndDate = new Date(
          userSelectedYear,
          parseInt(userSelectedMonth),
          0
        );
        filterEndDate.setHours(23, 59, 59, 999);
        break;
      case "year":
        filterStartDate = new Date(userSelectedYear, 0, 1);
        filterEndDate = new Date(userSelectedYear, 11, 31);
        filterEndDate.setHours(23, 59, 59, 999);
        break;
      default:
        return;
    }

    const filteredUserPostsResult = userPosts.filter((post) => {
      const createdAt = new Date(post.created_at);
      if (isNaN(createdAt.getTime())) {
        console.warn(`Invalid date for post ID ${post.id}: ${post.created_at}`);
        return false;
      }
      return createdAt >= filterStartDate && createdAt <= filterEndDate;
    });

    const filteredUserDemosResult = userDemos.filter((demo) => {
      const createdAt = new Date(demo.created_at);
      if (isNaN(createdAt.getTime())) {
        console.warn(`Invalid date for demo ID ${demo.id}: ${demo.created_at}`);
        return false;
      }
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

  const truncateTitle = (title) => {
    if (!title) return "Không có tiêu đề";
    return title.length > 20 ? title.slice(0, 20) + "..." : title;
  };

  const publishedCount = isLoggedIn ? filteredPosts.length : 0;
  const draftCount = isLoggedIn ? filteredDemos.length : 0;
  const userPublishedCount = isLoggedIn ? filteredUserPosts.length : 0;
  const userDraftCount = isLoggedIn ? filteredUserDemos.length : 0;

  const systemBarChartData = {
    labels: ["Đã đăng", "Nháp"],
    datasets: [
      {
        label: "Số lượng bài viết (Hệ thống)",
        data: isLoggedIn ? [publishedCount, draftCount] : [0, 0],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(107, 114, 128, 0.8)",
        ],
        barThickness:
          typeof window !== "undefined" && window.innerWidth < 768 ? 30 : 50,
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

  const userBarChartData = {
    labels: ["Đã đăng", "Nháp"],
    datasets: [
      {
        label: "Số lượng bài viết (Cá nhân)",
        data: isLoggedIn ? [userPublishedCount, userDraftCount] : [0, 0],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(107, 114, 128, 0.8)",
        ],
        barThickness:
          typeof window !== "undefined" && window.innerWidth < 768 ? 30 : 50,
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

  const maxSystemCount = Math.max(publishedCount, draftCount, 1);
  const systemStepSize =
    maxSystemCount < 10 ? 1 : maxSystemCount < 100 ? 5 : 10;
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
    cutout:
      typeof window !== "undefined" && window.innerWidth < 768 ? "50%" : "60%",
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

    const csvContent = [
      headers.join(","),
      ...data.map((row) => row.join(",")),
    ].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    saveAs(blob, "bao_cao_bai_viet.csv");
    setNotification({
      message: "Báo cáo Excel đã được xuất thành công!",
      type: "success",
    });
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
            new Paragraph({
              text: "Báo Cáo Bài Viết",
              heading: "Heading1",
              alignment: "center",
            }),
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
                    new TableCell({
                      children: [new Paragraph(publishedCount.toString())],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Nháp")] }),
                    new TableCell({
                      children: [new Paragraph(draftCount.toString())],
                    }),
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
                ...filteredPosts.map(
                  (post) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph(post.title || "Không có tiêu đề"),
                          ],
                        }),
                        new TableCell({ children: [new Paragraph("Đã đăng")] }),
                        new TableCell({
                          children: [
                            new Paragraph(formatDate(post.created_at)),
                          ],
                        }),
                      ],
                    })
                ),
                ...filteredDemos.map(
                  (demo) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph(demo.title || "Không có tiêu đề"),
                          ],
                        }),
                        new TableCell({ children: [new Paragraph("Nháp")] }),
                        new TableCell({
                          children: [
                            new Paragraph(formatDate(demo.created_at)),
                          ],
                        }),
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
      setNotification({
        message: "Báo cáo Word đã được xuất thành công!",
        type: "success",
      });
      setShowConfirm(false);
    });
  };

  const exportPersonalReportExcel = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setConfirmMessage(
      "Bạn có chắc chắn muốn xuất báo cáo cá nhân dưới dạng Excel?"
    );
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

    const csvContent = [
      headers.join(","),
      ...data.map((row) => row.join(",")),
    ].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    saveAs(blob, "bao_cao_ca_nhan.csv");
    setNotification({
      message: "Báo cáo cá nhân Excel đã được xuất thành công!",
      type: "success",
    });
    setShowConfirm(false);
  };

  const exportPersonalReportWord = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setConfirmMessage(
      "Bạn có chắc chắn muốn xuất báo cáo cá nhân dưới dạng Word?"
    );
    setConfirmAction(() => confirmExportPersonalWord);
    setShowConfirm(true);
  };

  const confirmExportPersonalWord = () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "Báo Cáo Bài Viết Cá Nhân",
              heading: "Heading1",
              alignment: "center",
            }),
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
                    new TableCell({
                      children: [new Paragraph(userPublishedCount.toString())],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Nháp")] }),
                    new TableCell({
                      children: [new Paragraph(userDraftCount.toString())],
                    }),
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
                ...filteredUserPosts.map(
                  (post) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph(post.title || "Không có tiêu đề"),
                          ],
                        }),
                        new TableCell({ children: [new Paragraph("Đã đăng")] }),
                        new TableCell({
                          children: [
                            new Paragraph(formatDate(post.created_at)),
                          ],
                        }),
                      ],
                    })
                ),
                ...filteredUserDemos.map(
                  (demo) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph(demo.title || "Không có tiêu đề"),
                          ],
                        }),
                        new TableCell({ children: [new Paragraph("Nháp")] }),
                        new TableCell({
                          children: [
                            new Paragraph(formatDate(demo.created_at)),
                          ],
                        }),
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
      setNotification({
        message: "Báo cáo cá nhân Word đã được xuất thành công!",
        type: "success",
      });
      setShowConfirm(false);
    });
  };

  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div
        className={`mt-16 sm:mt-20 md:mt-24 p-2 sm:p-4 md:p-5 max-w-7xl mx-auto rounded-lg shadow-md border border-blue-200 text-gray-700 relative`}
      >
        <div
          className={`min-h-screen rounded-lg bg-blue-200 flex flex-col`}
        ></div>
      </div>
    );
  }

  return (
    <div
      className={`mt-16 sm:mt-20 md:mt-24 p-2 sm:p-4 md:p-5 max-w-7xl mx-auto rounded-lg shadow-md border border-blue-200 text-gray-700 relative ${themes[theme]}`}
    >
      <div
        className={`min-h-screen rounded-lg bg-blue-200 flex flex-col ${getThemeClasses(
          theme,
          "container"
        )}`}
      >
        <h1
          className={`text-2xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 text-center my-4 sm:my-5 wrap-text ${getThemeClasses(
            theme,
            "title"
          )}`}
        >
          Thống kê bài viết
        </h1>
        <div className="flex flex-1 pb-6 sm:pb-8 md:pb-10 px-2 sm:px-4 md:px-6">
          <main className="flex-1 space-y-6 sm:space-y-8">
            <div
              className={`bg-white rounded-xl shadow-lg p-4 border border-blue-300 sm:p-5 md:p-6 hover:shadow-xl transition duration-300 animate-fade-in ${getThemeClasses(
                theme,
                "preview"
              )}`}
            >
              <h2
                className={`text-xl sm:text-xl font-bold text-purple-600 mb-3 sm:mb-4 wrap-text ${getThemeClasses(
                  theme,
                  "subtitle"
                )}`}
              >
                Tổng quan bài viết cá nhân
              </h2>
              <div
                className={`mb-4 sm:mb-6 bg-gradient-to-br from-blue-50 to-purple-50 p-4 sm:p-5 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 animate-slide-in ${getThemeClasses(
                  theme,
                  "support"
                )}`}
              >
                <h3
                  className={`text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center wrap-text ${getThemeClasses(
                    theme,
                    "subtitle"
                  )}`}
                >
                  <span className="bg-blue-500 text-white rounded-full p-1.5 sm:p-2 mr-2">
                    <svg
                      className="w-3 sm:w-4 h-3 sm:h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
                    </svg>
                  </span>
                  Thông tin nhanh
                </h3>
                <ul className="flex flex-col gap-2 sm:gap-3 text-gray-700 text-sm sm:text-base">
                  <li
                    className={`flex items-center transform transition-transform duration-300 bg-white p-2 sm:p-3 rounded-lg shadow-sm ${getThemeClasses(
                      theme,
                      "preview"
                    )}`}
                  >
                    <span className="w-28 sm:w-32 font-medium text-blue-600 wrap-text">
                      Tổng bài viết:
                    </span>
                    <span className="font-bold text-purple-600">
                      {isLoggedIn ? posts.length + demos.length : 0}
                    </span>
                  </li>
                  <li
                    className={`flex items-center transform transition-transform duration-300 bg-white p-2 sm:p-3 rounded-lg shadow-sm ${getThemeClasses(
                      theme,
                      "preview"
                    )}`}
                  >
                    <span className="w-28 sm:w-32 font-medium text-blue-600 wrap-text">
                      Bài của bạn:
                    </span>
                    <span className="font-bold text-purple-600">
                      {isLoggedIn ? userPosts.length + userDemos.length : 0}
                    </span>
                  </li>
                  <li
                    className={`flex items-center transform transition-transform duration-300 bg-white p-2 sm:p-3 rounded-lg shadow-sm ${getThemeClasses(
                      theme,
                      "preview"
                    )}`}
                  >
                    <span className="w-28 sm:w-32 font-medium text-blue-600 wrap-text">
                      Năm khả dụng:
                    </span>
                    <span className="font-bold text-purple-600">
                      {isLoggedIn ? availableYears.length : 0}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div
                  className={`bg-blue-200 bg-gradient-to-r from-blue-200 to-blue-300 p-3 sm:p-4 rounded-lg flex items-center justify-between hover:scale-105 hover:shadow-lg transition-all duration-300 ${getThemeClasses(
                    theme,
                    "preview"
                  )}`}
                >
                  <div className="flex items-center">
                    <CheckCircleOutlined className="text-2xl sm:text-3xl text-blue-600 mr-2 sm:mr-3" />
                    <div>
                      <p className="text-gray-800 font-medium text-sm sm:text-base wrap-text">
                        Đã đăng
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-700">
                        {isLoggedIn ? userPublishedCount : 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className={`bg-gray-200 bg-gradient-to-r from-gray-200 to-gray-300 p-3 sm:p-4 rounded-lg flex items-center justify-between hover:scale-105 hover:shadow-lg transition-all duration-300 ${getThemeClasses(
                    theme,
                    "preview"
                  )}`}
                >
                  <div className="flex items-center">
                    <FileOutlined className="text-2xl sm:text-3xl text-gray-600 mr-2 sm:mr-3" />
                    <div>
                      <p className="text-gray-800 font-medium text-sm sm:text-base wrap-text">
                        Nháp
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-700">
                        {isLoggedIn ? userDraftCount : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-4 sm:mb-6">
                <h3
                  className={`text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3 wrap-text ${getThemeClasses(
                    theme,
                    "subtitle"
                  )}`}
                >
                  Lọc nhanh
                </h3>
                <div
                  className={`flex flex-wrap justify-center gap-2 sm:gap-4 bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-5 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ${getThemeClasses(
                    theme,
                    "support"
                  )}`}
                >
                  {[
                    { label: "Hôm nay", value: "today" },
                    { label: "7 ngày qua", value: "last7days" },
                    { label: "30 ngày qua", value: "last30days" },
                    { label: "Tất cả", value: "all" },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => applyUserTimeFilter(filter.value)}
                      className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 transform hover:scale-105 wrap-text ${
                        userTimeFilter === filter.value
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                          : "bg-white text-gray-700 hover:bg-blue-100 shadow-sm"
                      } disabled:bg-gray-300 disabled:text-gray-500 disabled:transform-none ${getThemeClasses(
                        theme,
                        "button"
                      )}`}
                      disabled={!isLoggedIn}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4 sm:mb-6">
                <h3
                  className={`text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3 wrap-text ${getThemeClasses(
                    theme,
                    "subtitle"
                  )}`}
                >
                  Lọc theo thời gian
                </h3>
                <div
                  className={`flex flex-wrap gap-2 sm:gap-4 bg-gradient-to-r from-blue-100 to-purple-100 p-3 sm:p-4 rounded-lg shadow-sm ${getThemeClasses(
                    theme,
                    "support"
                  )}`}
                >
                  <select
                    value={userFilterType}
                    onChange={(e) => setUserFilterType(e.target.value)}
                    className={`border border-gray-300 rounded-lg px-3 sm:px-4 py-1 sm:py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200 text-xs sm:text-sm wrap-text ${getThemeClasses(
                      theme,
                      "select"
                    )}`}
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
                        className={`border border-gray-300 rounded-lg px-3 sm:px-4 py-1 sm:py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200 text-xs sm:text-sm wrap-text ${getThemeClasses(
                          theme,
                          "input"
                        )}`}
                        disabled={!isLoggedIn}
                      />
                      <input
                        type="date"
                        value={userEndDate}
                        onChange={(e) => setUserEndDate(e.target.value)}
                        className={`border border-gray-300 rounded-lg px-3 sm:px-4 py-1 sm:py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200 text-xs sm:text-sm wrap-text ${getThemeClasses(
                          theme,
                          "input"
                        )}`}
                        disabled={!isLoggedIn}
                      />
                    </>
                  )}
                  {userFilterType === "month" && (
                    <select
                      value={userSelectedMonth}
                      onChange={(e) => setUserSelectedMonth(e.target.value)}
                      className={`border border-gray-300 rounded-lg px-3 sm:px-4 py-1 sm:py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200 text-xs sm:text-sm wrap-text ${getThemeClasses(
                        theme,
                        "select"
                      )}`}
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
                  {(userFilterType === "month" ||
                    userFilterType === "year") && (
                    <select
                      value={userSelectedYear}
                      onChange={(e) => setUserSelectedYear(e.target.value)}
                      className={`border border-gray-300 rounded-lg px-3 sm:px-4 py-1 sm:py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200 text-xs sm:text-sm wrap-text ${getThemeClasses(
                        theme,
                        "select"
                      )}`}
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
                    className={`bg-gradient-to-r from-blue-400 to-purple-400 text-white px-4 sm:px-6 py-1 sm:py-2 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 disabled:bg-gray-400 transform hover:scale-95 text-xs sm:text-sm wrap-text ${getThemeClasses(
                      theme,
                      "button"
                    )}`}
                    disabled={!isLoggedIn}
                  >
                    Lọc dữ liệu
                  </button>
                </div>
              </div>
              {isUserFiltered && isLoggedIn ? (
                <div className="mt-4 sm:mt-6">
                  <h3
                    className={`text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3 wrap-text ${getThemeClasses(
                      theme,
                      "subtitle"
                    )}`}
                  >
                    Kết quả lọc
                  </h3>
                  <div className="flex justify-center">
                    <div
                      className={`w-full lg:w-1/2 max-w-full rounded-lg shadow-inner no-scrollbar overflow-y-auto overflow-x-auto max-h-[320px] sm:max-h-[384px] ${getThemeClasses(
                        theme,
                        "table"
                      )}`}
                    >
                      <table className="border-collapse bg-white rounded-lg text-xs sm:text-sm w-full">
                        <thead className="bg-gradient-to-r from-blue-400 to-purple-400 text-white sticky top-0">
                          <tr>
                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-bold wrap-text">
                              Tiêu đề
                            </th>
                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-bold wrap-text">
                              Trạng thái
                            </th>
                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-bold wrap-text">
                              Thời gian
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUserPosts.concat(filteredUserDemos).length >
                          0 ? (
                            filteredUserPosts
                              .concat(filteredUserDemos)
                              .map((article, index) => (
                                <tr
                                  key={`${article.id}-${index}`}
                                  className={`hover:bg-blue-50 transition-all duration-200 ${
                                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                                  }`}
                                >
                                  <td
                                    className="px-2 sm:px-3 py-1 sm:py-2 leading-tight truncate max-w-[200px] sm:max-w-[300px] wrap-text"
                                    title={article.title || "Không có tiêu đề"}
                                  >
                                    {truncateTitle(article.title)}
                                  </td>
                                  <td
                                    className={`px-2 sm:px-3 py-1 sm:py-2 leading-tight whitespace-nowrap wrap-text ${
                                      filteredUserPosts.includes(article)
                                        ? "text-blue-600 font-medium"
                                        : "text-gray-600 font-medium"
                                    }`}
                                  >
                                    {filteredUserPosts.includes(article)
                                      ? "Đã đăng"
                                      : "Nháp"}
                                  </td>
                                  <td className="px-2 sm:px-3 py-1 sm:py-2 leading-tight whitespace-nowrap wrap-text">
                                    {formatDate(article.created_at)}
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td
                                colSpan="3"
                                className="px-2 sm:px-3 py-1 sm:py-2 leading-tight text-center text-gray-500 whitespace-nowrap wrap-text"
                              >
                                {userTimeFilter === "today"
                                  ? "Không có bài viết nào trong ngày hôm nay."
                                  : "Không có dữ liệu"}
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
                  <div
                    className={`mt-4 sm:mt-6 text-gray-600 text-center text-sm sm:text-base wrap-text ${getThemeClasses(
                      theme,
                      "text"
                    )}`}
                  >
                    Vui lòng đăng nhập để xem kết quả lọc.
                  </div>
                )
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-[50px]">
                <div>
                  <h3
                    className={`text-base sm:text-lg font-bold mb-2 sm:mb-3 flex items-center bg-gradient-to-r from-blue-50 to-purple-50 p-2 sm:p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 wrap-text ${getThemeClasses(
                      theme,
                      "chart"
                    )}`}
                  >
                    <BarChartOutlined className="mr-1 sm:mr-2 text-blue-600" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                      Thống kê cột
                    </span>
                  </h3>
                  <div
                    className="w-full"
                    style={{
                      height:
                        typeof window !== "undefined" && window.innerWidth < 768
                          ? "200px"
                          : "300px",
                    }}
                  >
                    <Bar data={userBarChartData} options={userChartOptions} />
                  </div>
                </div>
                <div>
                  <h3
                    className={`text-base sm:text-lg font-bold mb-2 sm:mb-3 flex items-center bg-gradient-to-r from-blue-50 to-purple-50 p-2 sm:p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 wrap-text ${getThemeClasses(
                      theme,
                      "chart"
                    )}`}
                  >
                    <PieChartOutlined className="mr-1 sm:mr-2 text-blue-600" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                      Thống kê vòng
                    </span>
                  </h3>
                  <div
                    className="w-full flex justify-center"
                    style={{
                      height:
                        typeof window !== "undefined" && window.innerWidth < 768
                          ? "200px"
                          : "300px",
                    }}
                  >
                    <div
                      style={{
                        width:
                          typeof window !== "undefined" &&
                          window.innerWidth < 768
                            ? "70%"
                            : "50%",
                      }}
                    >
                      <Doughnut
                        data={userDoughnutChartData}
                        options={doughnutChartOptions}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {isUserFiltered && isLoggedIn && (
                <div className="mt-4 sm:mt-6 flex flex-wrap justify-end gap-2 sm:gap-4">
                  <button
                    onClick={exportPersonalReportExcel}
                    className={`bg-blue-400 text-white px-4 sm:px-6 py-1 sm:py-2 rounded-lg hover:bg-blue-500 transition duration-200 disabled:bg-gray-400 text-xs sm:text-sm wrap-text ${getThemeClasses(
                      theme,
                      "button"
                    )}`}
                  >
                    Xuất Excel
                  </button>
                  <button
                    onClick={exportPersonalReportWord}
                    className={`bg-purple-400 text-white px-4 sm:px-6 py-1 sm:py-2 rounded-lg hover:bg-purple-500 transition duration-200 disabled:bg-gray-400 text-xs sm:text-sm wrap-text ${getThemeClasses(
                      theme,
                      "button"
                    )}`}
                  >
                    Xuất Word
                  </button>
                </div>
              )}
            </div>
            <div
              className={`bg-white rounded-xl shadow-lg p-4 border border-blue-300 sm:p-5 md:p-6 hover:shadow-xl transition duration-300 animate-fade-in ${getThemeClasses(
                theme,
                "preview"
              )}`}
            >
              <h2
                className={`text-xl sm:text-xl font-bold text-purple-600 mb-3 sm:mb-4 wrap-text ${getThemeClasses(
                  theme,
                  "subtitle"
                )}`}
              >
                Tổng quan bài viết toàn hệ thống
              </h2>
              <div
                className={`mb-4 sm:mb-6 bg-gradient-to-br from-blue-50 to-purple-50 p-4 sm:p-5 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 animate-slide-in ${getThemeClasses(
                  theme,
                  "support"
                )}`}
              >
                <h3
                  className={`text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center wrap-text ${getThemeClasses(
                    theme,
                    "subtitle"
                  )}`}
                >
                  <span className="bg-blue-500 text-white rounded-full p-1.5 sm:p-2 mr-2">
                    <svg
                      className="w-3 sm:w-4 h-3 sm:h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
                    </svg>
                  </span>
                  Thông tin nhanh
                </h3>
                <ul className="flex flex-col gap-2 sm:gap-3 text-gray-700 text-sm sm:text-base">
                  <li
                    className={`flex items-center transform transition-transform duration-300 bg-white p-2 sm:p-3 rounded-lg shadow-sm ${getThemeClasses(
                      theme,
                      "preview"
                    )}`}
                  >
                    <span className="w-28 sm:w-32 font-medium text-blue-600 wrap-text">
                      Tổng bài viết:
                    </span>
                    <span className="font-bold text-purple-600">
                      {isLoggedIn ? posts.length + demos.length : 0}
                    </span>
                  </li>
                  <li
                    className={`flex items-center transform transition-transform duration-300 bg-white p-2 sm:p-3 rounded-lg shadow-sm ${getThemeClasses(
                      theme,
                      "preview"
                    )}`}
                  >
                    <span className="w-28 sm:w-32 font-medium text-blue-600 wrap-text">
                      Bài đã đăng:
                    </span>
                    <span className="font-bold text-purple-600">
                      {isLoggedIn ? posts.length : 0}
                    </span>
                  </li>
                  <li
                    className={`flex items-center transform transition-transform duration-300 bg-white p-2 sm:p-3 rounded-lg shadow-sm ${getThemeClasses(
                      theme,
                      "preview"
                    )}`}
                  >
                    <span className="w-28 sm:w-32 font-medium text-blue-600 wrap-text">
                      Bản nháp:
                    </span>
                    <span className="font-bold text-purple-600">
                      {isLoggedIn ? demos.length : 0}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div
                  className={`bg-blue-200 bg-gradient-to-r from-blue-200 to-blue-300 p-3 sm:p-4 rounded-lg flex items-center justify-between hover:scale-105 hover:shadow-lg transition-all duration-300 ${getThemeClasses(
                    theme,
                    "preview"
                  )}`}
                >
                  <div className="flex items-center">
                    <CheckCircleOutlined className="text-2xl sm:text-3xl text-blue-600 mr-2 sm:mr-3" />
                    <div>
                      <p className="text-gray-800 font-medium text-sm sm:text-base wrap-text">
                        Đã đăng
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-700">
                        {isLoggedIn ? publishedCount : 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className={`bg-gray-200 bg-gradient-to-r from-gray-200 to-gray-300 p-3 sm:p-4 rounded-lg flex items-center justify-between hover:scale-105 hover:shadow-lg transition-all duration-300 ${getThemeClasses(
                    theme,
                    "preview"
                  )}`}
                >
                  <div className="flex items-center">
                    <FileOutlined className="text-2xl sm:text-3xl text-gray-600 mr-2 sm:mr-3" />
                    <div>
                      <p className="text-gray-800 font-medium text-sm sm:text-base wrap-text">
                        Nháp
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-700">
                        {isLoggedIn ? draftCount : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-4 sm:mb-6">
                <h3
                  className={`text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3 wrap-text ${getThemeClasses(
                    theme,
                    "subtitle"
                  )}`}
                >
                  Lọc nhanh
                </h3>
                <div
                  className={`flex flex-wrap justify-center gap-2 sm:gap-4 bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-5 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ${getThemeClasses(
                    theme,
                    "support"
                  )}`}
                >
                  {[
                    { label: "Hôm nay", value: "today" },
                    { label: "7 ngày qua", value: "last7days" },
                    { label: "30 ngày qua", value: "last30days" },
                    { label: "Tất cả", value: "all" },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => applySystemTimeFilter(filter.value)}
                      className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 transform hover:scale-105 wrap-text ${
                        systemTimeFilter === filter.value
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                          : "bg-white text-gray-700 hover:bg-blue-100 shadow-sm"
                      } disabled:bg-gray-300 disabled:text-gray-500 disabled:transform-none ${getThemeClasses(
                        theme,
                        "button"
                      )}`}
                      disabled={!isLoggedIn}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4 sm:mb-6">
                <h3
                  className={`text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3 wrap-text ${getThemeClasses(
                    theme,
                    "subtitle"
                  )}`}
                >
                  Lọc theo thời gian
                </h3>
                <div
                  className={`flex flex-wrap gap-2 sm:gap-4 bg-gradient-to-r from-blue-100 to-purple-100 p-3 sm:p-4 rounded-lg shadow-sm ${getThemeClasses(
                    theme,
                    "support"
                  )}`}
                >
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className={`border border-gray-300 rounded-lg px-3 sm:px-4 py-1 sm:py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200 text-xs sm:text-sm wrap-text ${getThemeClasses(
                      theme,
                      "select"
                    )}`}
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
                        className={`border border-gray-300 rounded-lg px-3 sm:px-4 py-1 sm:py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200 text-xs sm:text-sm wrap-text ${getThemeClasses(
                          theme,
                          "input"
                        )}`}
                        disabled={!isLoggedIn}
                      />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={`border border-gray-300 rounded-lg px-3 sm:px-4 py-1 sm:py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200 text-xs sm:text-sm wrap-text ${getThemeClasses(
                          theme,
                          "input"
                        )}`}
                        disabled={!isLoggedIn}
                      />
                    </>
                  )}
                  {filterType === "month" && (
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className={`border border-gray-300 rounded-lg px-3 sm:px-4 py-1 sm:py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200 text-xs sm:text-sm wrap-text ${getThemeClasses(
                        theme,
                        "select"
                      )}`}
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
                      className={`border border-gray-300 rounded-lg px-3 sm:px-4 py-1 sm:py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md disabled:bg-gray-200 text-xs sm:text-sm wrap-text ${getThemeClasses(
                        theme,
                        "select"
                      )}`}
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
                    className={`bg-gradient-to-r from-blue-400 to-purple-400 text-white px-4 sm:px-6 py-1 sm:py-2 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 disabled:bg-gray-400 transform hover:scale-95 text-xs sm:text-sm wrap-text ${getThemeClasses(
                      theme,
                      "button"
                    )}`}
                    disabled={!isLoggedIn}
                  >
                    Lọc dữ liệu
                  </button>
                </div>
              </div>
              {isFiltered && isLoggedIn ? (
                <div className="mt-4 sm:mt-6">
                  <h3
                    className={`text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3 wrap-text ${getThemeClasses(
                      theme,
                      "subtitle"
                    )}`}
                  >
                    Kết quả lọc
                  </h3>
                  <div className="flex justify-center">
                    <div
                      className={`w-full lg:w-1/2 max-w-full rounded-lg shadow-inner no-scrollbar overflow-y-auto overflow-x-auto max-h-[320px] sm:max-h-[384px] ${getThemeClasses(
                        theme,
                        "table"
                      )}`}
                    >
                      <table className="border-collapse bg-white rounded-lg text-xs sm:text-sm w-full">
                        <thead className="bg-gradient-to-r from-blue-400 to-purple-400 text-white sticky top-0">
                          <tr>
                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-bold wrap-text">
                              Tiêu đề
                            </th>
                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-bold wrap-text">
                              Trạng thái
                            </th>
                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-bold wrap-text">
                              Thời gian
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPosts.concat(filteredDemos).length > 0 ? (
                            filteredPosts
                              .concat(filteredDemos)
                              .map((article, index) => (
                                <tr
                                  key={`${article.id}-${index}`}
                                  className={`hover:bg-blue-50 transition-all duration-200 ${
                                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                                  }`}
                                >
                                  <td
                                    className="px-2 sm:px-3 py-1 sm:py-2 leading-tight truncate max-w-[200px] sm:max-w-[300px] wrap-text"
                                    title={article.title || "Không có tiêu đề"}
                                  >
                                    {truncateTitle(article.title)}
                                  </td>
                                  <td
                                    className={`px-2 sm:px-3 py-1 sm:py-2 leading-tight whitespace-nowrap wrap-text ${
                                      filteredPosts.includes(article)
                                        ? "text-blue-600 font-medium"
                                        : "text-gray-600 font-medium"
                                    }`}
                                  >
                                    {filteredPosts.includes(article)
                                      ? "Đã đăng"
                                      : "Nháp"}
                                  </td>
                                  <td className="px-2 sm:px-3 py-1 sm:py-2 leading-tight whitespace-nowrap wrap-text">
                                    {formatDate(article.created_at)}
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td
                                colSpan="3"
                                className="px-2 sm:px-3 py-1 sm:py-2 leading-tight text-center text-gray-500 whitespace-nowrap wrap-text"
                              >
                                {systemTimeFilter === "today"
                                  ? "Không có bài viết nào trong ngày hôm nay."
                                  : "Không có dữ liệu"}
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
                  <div
                    className={`mt-4 sm:mt-6 text-gray-600 text-center text-sm sm:text-base wrap-text ${getThemeClasses(
                      theme,
                      "text"
                    )}`}
                  >
                    Vui lòng đăng nhập để xem kết quả lọc.
                  </div>
                )
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-[50px]">
                <div>
                  <h3
                    className={`text-base sm:text-lg font-bold mb-2 sm:mb-3 flex items-center bg-gradient-to-r from-blue-50 to-purple-50 p-2 sm:p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 wrap-text ${getThemeClasses(
                      theme,
                      "chart"
                    )}`}
                  >
                    <BarChartOutlined className="mr-1 sm:mr-2 text-blue-600" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                      Thống kê cột
                    </span>
                  </h3>
                  <div
                    className="w-full"
                    style={{
                      height:
                        typeof window !== "undefined" && window.innerWidth < 768
                          ? "200px"
                          : "300px",
                    }}
                  >
                    <Bar data={systemBarChartData} options={chartOptions} />
                  </div>
                </div>
                <div>
                  <h3
                    className={`text-base sm:text-lg font-bold mb-2 sm:mb-3 flex items-center bg-gradient-to-r from-blue-50 to-purple-50 p-2 sm:p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 wrap-text ${getThemeClasses(
                      theme,
                      "chart"
                    )}`}
                  >
                    <PieChartOutlined className="mr-1 sm:mr-2 text-blue-600" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                      Thống kê vòng
                    </span>
                  </h3>
                  <div
                    className="w-full flex justify-center"
                    style={{
                      height:
                        typeof window !== "undefined" && window.innerWidth < 768
                          ? "200px"
                          : "300px",
                    }}
                  >
                    <div
                      style={{
                        width:
                          typeof window !== "undefined" &&
                          window.innerWidth < 768
                            ? "70%"
                            : "50%",
                      }}
                    >
                      <Doughnut
                        data={systemDoughnutChartData}
                        options={doughnutChartOptions}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {isFiltered && isLoggedIn && (
                <div className="mt-4 sm:mt-6 flex flex-wrap justify-end gap-2 sm:gap-4">
                  <button
                    onClick={exportReportExcel}
                    className={`bg-blue-400 text-white px-4 sm:px-6 py-1 sm:py-2 rounded-lg hover:bg-blue-500 transition duration-200 disabled:bg-gray-400 text-xs sm:text-sm wrap-text ${getThemeClasses(
                      theme,
                      "button"
                    )}`}
                  >
                    Xuất Excel
                  </button>
                  <button
                    onClick={exportReportWord}
                    className={`bg-purple-400 text-white px-4 sm:px-6 py-1 sm:py-2 rounded-lg hover:bg-purple-500 transition duration-200 disabled:bg-gray-400 text-xs sm:text-sm wrap-text ${getThemeClasses(
                      theme,
                      "button"
                    )}`}
                  >
                    Xuất Word
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
            </div>
          </main>
        </div>
        {notification && (
          <div className="fixed top-16 sm:top-20 right-4 sm:right-6 z-50">
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          </div>
        )}
        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent">
            <Confirm
              message={confirmMessage}
              onConfirm={confirmAction}
              onCancel={() => setShowConfirm(false)}
            />
          </div>
        )}
        {showLoginModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent">
            <div
              className={`bg-white p-4 sm:p-6 rounded-lg shadow-lg max-w-sm sm:max-w-md w-full ${getThemeClasses(
                theme,
                "modal"
              )}`}
            >
              <h3
                className={`text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 wrap-text ${getThemeClasses(
                  theme,
                  "subtitle"
                )}`}
              >
                Yêu cầu đăng nhập
              </h3>
              <p
                className={`text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base wrap-text ${getThemeClasses(
                  theme,
                  "text"
                )}`}
              >
                Vui lòng đăng nhập để xem thống kê bài viết.
              </p>
              <div className="flex justify-end gap-2 sm:gap-4">
                <button
                  onClick={() => setShowLoginModal(false)}
                  className={`bg-gray-300 text-gray-800 px-3 sm:px-4 py-1 sm:py-2 rounded-lg hover:bg-gray-400 transition duration-200 text-xs sm:text-sm wrap-text ${getThemeClasses(
                    theme,
                    "button"
                  )}`}
                >
                  Hủy
                </button>
                <button
                  onClick={handleLoginRedirect}
                  className={`bg-gradient-to-r from-blue-400 to-purple-400 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-lg hover:from-blue-500 hover:to-purple-500 transition duration-200 text-xs sm:text-sm wrap-text ${getThemeClasses(
                    theme,
                    "button"
                  )}`}
                >
                  Đăng nhập
                </button>
              </div>
            </div>
          </div>
        )}
        <style jsx>{`
          .no-scrollbar {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes scaleIn {
            from {
              transform: scale(0.95);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
          }
          .animate-slide-in {
            animation: slideIn 0.5s ease-out;
          }
          .animate-scale-in {
            animation: scaleIn 0.3s ease-out;
          }
          .truncate {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .wrap-text {
            word-break: break-word;
            overflow-wrap: break-word;
          }
        `}</style>
      </div>
    </div>
  );
}
