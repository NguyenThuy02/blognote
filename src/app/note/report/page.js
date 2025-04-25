"use client";
import { Bar, Pie } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { useEffect, useState, useRef } from "react";
import { supabase2 } from "../../../lib/supabase";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import ThemeSettings from "../../components/ThemeSettings";

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function NoteReport() {
  const [totalNotes, setTotalNotes] = useState(0);
  const [notesData, setNotesData] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNote, setSelectedNote] = useState(null);
  const [chartType, setChartType] = useState("category");
  const [noteChartData, setNoteChartData] = useState(null);
  const notesPerPage = 10;

  const [categoryChartData, setCategoryChartData] = useState({
    labels: [],
    datasets: [{ data: [], backgroundColor: [], borderWidth: 1 }],
  });
  const [noteTypeChartData, setNoteTypeChartData] = useState({
    labels: [],
    datasets: [{ data: [], backgroundColor: [], borderWidth: 1 }],
  });
  const [tags, setTags] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [tagPositions, setTagPositions] = useState([]);
  const tagContainerRef = useRef(null);
  const [showFullContent, setShowFullContent] = useState(false);

  useEffect(() => {
    const fetchNotesData = async () => {
      setLoading(true);
      const { data, error } = await supabase2.from("notess").select("*");
      if (error) {
        console.error("Error fetching notes:", error);
      } else {
        setNotesData(data);
        setFilteredNotes(data);
        setTotalNotes(data.length);

        const categoryMap = { 1: "personal", 2: "study", 3: "entertainment", 4: "upload" };
        const categoryCounts = data.reduce((acc, note) => {
          const category = categoryMap[note.category_id] || "unknown";
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});
        setCategoryChartData({
          labels: Object.keys(categoryCounts),
          datasets: [
            {
              data: Object.values(categoryCounts),
              backgroundColor: [
                "rgba(107, 70, 193, 0.6)",
                "rgba(163, 191, 250, 0.6)",
                "rgba(212, 196, 251, 0.6)",
                "rgba(107, 70, 193, 0.4)",
              ],
              borderWidth: 1,
            },
          ],
        });

        const noteTypeMap = {
          plain: "Ghi chú văn bản thuần",
          rich: "Ghi chú văn bản phong phú",
          todo: "Ghi chú danh sách công việc",
          spreadsheet: "Ghi chú bảng tính",
        };
        const noteTypeCounts = data.reduce((acc, note) => {
          const noteType = noteTypeMap[note.note_type] || "Không xác định";
          acc[noteType] = (acc[noteType] || 0) + 1;
          return acc;
        }, {});
        setNoteTypeChartData({
          labels: Object.keys(noteTypeCounts),
          datasets: [
            {
              data: Object.values(noteTypeCounts),
              backgroundColor: [
                "rgba(107, 70, 193, 0.6)",
                "rgba(163, 191, 250, 0.6)",
                "rgba(212, 196, 251, 0.6)",
                "rgba(107, 70, 193, 0.4)",
              ],
              borderWidth: 1,
            },
          ],
        });

        const today = new Date();
        const weeks = [];
        const weekData = [];
        for (let i = 3; i >= 0; i--) {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay() - i * 7);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);

          const count = data.filter((note) => {
            const noteDate = new Date(note.created_at);
            return noteDate >= startOfWeek && noteDate <= endOfWeek;
          }).length;

          weeks.push({
            label: `Tuần ${4 - i}`,
            start: startOfWeek.toLocaleDateString(),
            end: endOfWeek.toLocaleDateString(),
            count,
          });
          weekData.push(count);
        }

        setNoteChartData({
          labels: weeks.map((w) => w.label),
          datasets: [
            {
              label: "Số lượng ghi chú",
              data: weekData,
              backgroundColor: [
                "rgba(107, 70, 193, 0.6)",
                "rgba(163, 191, 250, 0.6)",
                "rgba(212, 196, 251, 0.6)",
                "rgba(107, 70, 193, 0.4)",
              ],
              borderColor: "rgba(107, 70, 193, 1)",
              borderWidth: 1,
            },
          ],
          tooltips: weeks.map((w) => `${w.start} - ${w.end}`),
        });

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentNotes = data
          .filter((note) => new Date(note.created_at) >= weekAgo)
          .map((note) => ({ name: note.title, type: "note" }));
        const newTags = recentNotes.length > 0 ? recentNotes : [{ name: "Không có ghi chú trong tuần", type: "note" }];
        setTags(newTags);
      }
      setLoading(false);
    };

    fetchNotesData();
  }, []);

  const checkCollision = (rect1, rect2) => {
    return !(
      rect1.left >= rect2.right ||
      rect1.right <= rect2.left ||
      rect1.top >= rect2.bottom ||
      rect1.bottom <= rect2.top
    );
  };

  const getNonOverlappingPosition = (tagElement, containerRect, existingPositions) => {
    const maxAttempts = 50;
    let attempts = 0;
    let position;

    const tagWidth = tagElement.offsetWidth;
    const tagHeight = tagElement.offsetHeight;

    while (attempts < maxAttempts) {
      const left = Math.random() * (containerRect.width - tagWidth);
      const top = Math.random() * (containerRect.height - tagHeight - 40) + 40;

      const newRect = {
        left,
        right: left + tagWidth,
        top,
        bottom: top + tagHeight,
      };

      let overlaps = false;
      for (const pos of existingPositions) {
        if (!pos) continue;
        const existingRect = {
          left: pos.left,
          right: pos.left + pos.width,
          top: pos.top,
          bottom: pos.top + pos.height,
        };
        if (checkCollision(newRect, existingRect)) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        position = { left, top, width: tagWidth, height: tagHeight };
        break;
      }

      attempts++;
    }

    if (!position) {
      position = { left: 10, top: 40, width: tagWidth, height: tagHeight };
    }

    return position;
  };

  useEffect(() => {
    if (tags.length > 0 && tagContainerRef.current) {
      const container = tagContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const tagElements = container.querySelectorAll(".tag");
      const newPositions = [];

      tagElements.forEach((tag) => {
        const position = getNonOverlappingPosition(tag, containerRect, newPositions);
        tag.style.left = `${position.left}px`;
        tag.style.top = `${position.top}px`;
        newPositions.push(position);
      });

      setTagPositions(newPositions);

      tagElements.forEach((tag, index) => {
        tag.style.animation = `fadeIn 0.5s ease ${index * 0.1}s forwards`;
      });
    }
  }, [tags]);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      :root {
        --background: #FFFFFF;
        --text-color: #000000;
        --accent-color: linear-gradient(to right, #6B46C1, #A3BFFA);
        --secondary-bg: rgba(255, 255, 255, 0.8);
        --shadow-color: rgba(0, 0, 0, 0.1);
        --hover-shadow: rgba(0, 0, 0, 0.15);
        --border-color: #A3BFFA;
      }
      body {
        background-color: var(--background);
        color: var(--text-color);
      }
      @keyframes fadeIn {
        0% { opacity: 0; transform: translateY(-20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }
      .container { 
        background: var(--background); 
        border-radius: 20px; 
        box-shadow: 0 10px 30px var(--shadow-color); 
        transition: all 0.3s ease; 
        color: var(--text-color);
        border: 2px solid var(--border-color);
      }
      .container:hover { 
        box-shadow: 0 15px 40px var(--hover-shadow); 
      }
      .stat-card { 
        background: var(--background); 
        border-radius: 12px; 
        padding: 20px; 
        animation: fadeIn 0.5s ease forwards; 
        transition: all 0.3s ease; 
        border: 2px solid var(--border-color);
        color: var(--text-color);
      }
      .total-notes-card { 
        background: url('https://i.pinimg.com/736x/eb/5c/14/eb5c1403bc61a35eff076432dce3c22e.jpg') no-repeat center center; 
        background-size: cover; 
        border-radius: 12px; 
        padding: 20px; 
        animation: fadeIn 0.5s ease forwards; 
        transition: all 0.3s ease; 
        border: 2px solid var(--border-color);
        color: var(--text-color);
      }
      .stat-card:hover, .total-notes-card:hover { 
        transform: translateY(-5px); 
        box-shadow: 0 5px 15px rgba(163, 191, 250, 0.3);
      }
      .tag-container { 
        position: relative; 
        height: 250px; 
        overflow: hidden; 
        border-radius: 15px; 
        background: var(--secondary-bg); 
        box-shadow: inset 0 0 10px var(--shadow-color); 
        border: 2px solid var(--border-color);
        padding-top: 40px;
        color: var(--text-color);
      }
      .tag { 
        position: absolute;
        padding: 8px 16px; 
        border-radius: 20px; 
        background: rgba(163, 191, 250, 0.2); 
        transition: all 0.3s ease; 
        cursor: grab; 
        z-index: 1;
        white-space: nowrap;
        color: var(--text-color);
      }
      .tag:hover { 
        background: rgba(107, 70, 193, 0.5); 
        transform: scale(1.1); 
      }
      .tag:active { 
        cursor: grabbing; 
      }
      .table-container { 
        max-height: 400px; 
        overflow-y: auto; 
        border-radius: 16px; 
        background: var(--background); 
        box-shadow: 0 8px 24px var(--shadow-color); 
        border: 1px solid var(--border-color);
        color: var(--text-color);
        position: relative; /* Đảm bảo stacking context riêng */
        z-index: 1; /* Đặt z-index thấp hơn modal */
      }
      .table-container table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        background: var(--background);
        color: var(--text-color);
      }
      .table-container thead {
        position: sticky;
        top: 0;
        z-index: 5; /* Giảm z-index để không đè lên modal */
        background: var(--accent-color) !important;
        color: white;
      }
      .table-container thead th {
        padding: 14px 20px;
        font-size: 1.1rem;
        font-weight: 600;
        text-align: left;
        border-bottom: 2px solid rgba(255, 255, 255, 0.2);
      }
      .table-container thead th:nth-child(1) { 
        width: 10%; 
        padding-left: 28px; 
      }
      .table-container thead th:nth-child(2) { width: 50%; }
      .table-container thead th:nth-child(3) { width: 20%; }
      .table-container thead th:nth-child(4) { width: 20%; }
      .table-container tbody tr {
        transition: all 0.3s ease;
      }
      .table-container tbody tr:hover {
        background: rgba(163, 191, 250, 0.1);
        transform: translateY(-2px);
      }
      .table-container tbody td {
        padding: 14px 20px;
        font-size: 1rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      }
      .table-container tbody td:nth-child(1) { 
        padding-left: 28px; 
      }
      .table-container button.detail-btn {
        background: var(--accent-color) !important;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 500;
        color: white;
        border: none;
      }
      .table-container button.detail-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(107, 70, 193, 0.3);
      }
      button.export-btn { 
        background: var(--accent-color) !important;
        padding: 8px 16px; 
        border-radius: 25px; 
        color: white; 
        transition: all 0.3s ease; 
        margin: 0 5px;
        border: none;
      }
      button.export-btn:hover { 
        transform: scale(1.05); 
        box-shadow: 0 5px 15px var(--shadow-color); 
      }
      button.filter-btn {
        background: var(--accent-color) !important;
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      button.filter-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 5px 15px var(--shadow-color);
      }
      button.detail-btn {
        background: var(--accent-color) !important;
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      button.detail-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 5px 15px var(--shadow-color);
      }
      .search-input, .date-input, .category-select, .chart-type-select { 
        padding: 10px; 
        border-radius: 8px; 
        border: 1px solid var(--border-color); 
        transition: all 0.3s ease; 
        background: var(--background);
        color: var(--text-color);
      }
      .search-input:focus, .date-input:focus, .category-select:focus, .chart-type-select:focus { 
        border-color: var(--border-color); 
        box-shadow: 0 0 5px rgba(107, 70, 193, 0.5); 
        outline: none; 
      }
      .modal { 
        position: fixed; 
        top: 0; 
        left: 0; 
        width: 100%; 
        height: 100%; 
        background: rgba(0, 0, 0, 0.5); 
        display: flex; 
        justify-content: center; 
        align-items: center;
        z-index: 1000; /* Đặt z-index cao để modal luôn ở trên cùng */
      }
      .modal-content { 
        background: var(--background); 
        padding: 24px; 
        border-radius: 16px; 
        max-width: 600px; 
        width: 100%; 
        animation: fadeIn 0.3s ease; 
        border: 2px solid var(--border-color);
        color: var(--text-color);
        position: relative;
        z-index: 1001; /* Đảm bảo nội dung modal cũng ở trên cùng */
      }
      .show-more-btn {
        color: var(--border-color);
        cursor: pointer;
        font-weight: 500;
        margin-top: 8px;
        display: inline-block;
      }
      .show-more-btn:hover {
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);
  
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    let filtered = notesData;
    if (searchTerm) {
      filtered = filtered.filter(
        (note) =>
          note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (dateFilter) {
      filtered = filtered.filter((note) =>
        new Date(note.created_at).toISOString().startsWith(dateFilter)
      );
    }
    if (categoryFilter) {
      filtered = filtered.filter((note) => note.category_id === Number(categoryFilter));
    }
    setFilteredNotes(filtered);
  }, [searchTerm, dateFilter, categoryFilter, notesData]);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.setData("text/plain", index);
    e.currentTarget.style.opacity = 0.5;
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = 1;
    setDraggedIndex(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex >= tagPositions.length) return;

    const tagElements = document.querySelectorAll(".tag");
    const draggedTag = tagElements[draggedIndex];
    const container = tagContainerRef.current;
    const containerRect = container.getBoundingClientRect();

    const existingPositions = tagPositions.filter((_, i) => i !== draggedIndex);
    const newPosition = getNonOverlappingPosition(draggedTag, containerRect, existingPositions);

    draggedTag.style.left = `${newPosition.left}px`;
    draggedTag.style.top = `${newPosition.top}px`;
    draggedTag.style.animation = "bounce 0.5s ease";

    setTagPositions((prev) => {
      const newPositions = [...prev];
      newPositions[draggedIndex] = newPosition;
      return newPositions;
    });

    setTimeout(() => {
      draggedTag.style.animation = "";
    }, 500);
  };

  const handleDragOver = (e) => e.preventDefault();

  const exportToWord = () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Báo cáo Ghi chú",
                  bold: true,
                  size: 32,
                }),
              ],
              spacing: { after: 200 },
            }),
            ...filteredNotes.map((note) =>
              new Paragraph({
                children: [
                  new TextRun(`ID: ${note.id}`),
                  new TextRun({
                    text: `\nTiêu đề: ${note.title || "Không có tiêu đề"}`,
                    break: 1,
                  }),
                  new TextRun({
                    text: `Nội dung: ${note.content || "Không có nội dung"}`,
                    break: 1,
                  }),
                  new TextRun({
                    text: `Ngày tạo: ${new Date(note.created_at).toLocaleString()}`,
                    break: 1,
                  }),
                  new TextRun({
                    text: `Thể loại: ${ { 1: "personal", 2: "study", 3: "entertainment", 4: "upload" }[note.category_id] || "unknown" }`,
                    break: 1,
                  }),
                  new TextRun({
                    text: `Loại ghi chú: ${ { plain: "Ghi chú văn bản thuần", rich: "Ghi chú văn bản phong phú", todo: "Ghi chú danh sách công việc", spreadsheet: "Ghi chú bảng tính" }[note.note_type] || "Không xác định" }`,
                    break: 1,
                  }),
                  new TextRun({ text: "\n", break: 1 }),
                ],
              })
            ),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "notes_report.docx");
    });
  };

  const exportToExcel = () => {
    const excelData = filteredNotes.map((note) => ({
      ID: note.id,
      "Tiêu đề": note.title || "Không có tiêu đề",
      "Nội dung": note.content || "Không có nội dung",
      "Ngày tạo": new Date(note.created_at).toLocaleString(),
      "Thể loại": { 1: "personal", 2: "study", 3: "entertainment", 4: "upload" }[note.category_id] || "unknown",
      "Loại ghi chú": { plain: "Ghi chú văn bản thuần", rich: "Ghi chú văn bản phong phú", todo: "Ghi chú danh sách công việc", spreadsheet: "Ghi chú bảng tính" }[note.note_type] || "Không xác định",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Notes");
    XLSX.writeFile(workbook, "notes_report.xlsx");
  };

  const indexOfLastNote = currentPage * notesPerPage;
  const indexOfFirstNote = indexOfLastNote - notesPerPage;
  const currentNotes = filteredNotes.slice(indexOfFirstNote, indexOfLastNote);
  const totalPages = Math.ceil(filteredNotes.length / notesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="mt-[75px] p-5 mb-[-7px] min-h-screen p-6">
      <div className="container mx-auto w-full p-6">
        <h1 className="text-4xl font-extrabold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#6B46C1] to-[#A3BFFA] animate-pulse">
          NoteStats - 📝 Thống kê ghi chú
        </h1>

        <div className="total-notes-card mb-6 text-center">
          <h2 className="text-2xl font-semibold mb-2">Tổng số ghi chú</h2>
          <p className="text-5xl font-bold text-[#6B46C1] animate-bounce">
            {loading ? "Đang tải..." : totalNotes}
          </p>
          <p className="text-gray-500 mt-2">
            Ghi chú mới trong tuần: {notesData.filter((note) => {
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return new Date(note.created_at) > weekAgo;
            }).length}
          </p>
        </div>

        <div className="stat-card mb-6 flex justify-between items-center gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input flex-1"
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="date-input"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="category-select"
          >
            <option value="">Tất cả danh mục</option>
            {[...new Set(notesData.map((note) => note.category_id))].map((id) => (
              <option key={id} value={id}>
                { { 1: "Personal Palma", 2: "Study Palma", 3: "Entertainment Palma", 4: "Upload Palma" }[id] || `Danh mục ${id}` }
              </option>
            ))}
          </select>
          <button className="filter-btn">Lọc</button>
        </div>

        <div className="stat-card mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            Biểu đồ ghi chú theo tuần
          </h2>
          <div style={{ height: "300px" }}>
            {loading || !noteChartData ? (
              <p className="text-center">Đang tải biểu đồ...</p>
            ) : (
              <Bar
                data={noteChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const weekIndex = context.dataIndex;
                          return `${noteChartData.tooltips[weekIndex]}: ${context.raw} ghi chú`;
                        },
                      },
                    },
                  },
                }}
              />
            )}
          </div>
        </div>

        <div className="stat-card mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            Phân loại ghi chú theo thể loại và loại ghi chú
          </h2>
          <div className="flex justify-center mb-4">
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="chart-type-select"
            >
              <option value="category">Theo thể loại</option>
              <option value="noteType">Theo loại ghi chú</option>
            </select>
          </div>
          <div style={{ height: "300px" }}>
            {loading ? (
              <p className="text-center">Đang tải biểu đồ...</p>
            ) : (
              <Pie
                data={chartType === "category" ? categoryChartData : noteTypeChartData}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            )}
          </div>
        </div>

        <div className="table-container mb-6">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Danh sách ghi chú
          </h2>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Tiêu đề</th>
                <th className="p-4">Ngày tạo</th>
                <th className="p-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {currentNotes.map((note) => (
                <tr key={note.id}>
                  <td className="p-4">{note.id}</td>
                  <td className="p-4">{note.title || "Không có tiêu đề"}</td>
                  <td className="p-4">
                    {new Date(note.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedNote(note)}
                      className="detail-btn"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-center mt-6 gap-3">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => paginate(i + 1)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  currentPage === i + 1
                    ? "bg-gradient-to-r from-[#6B46C1] to-[#A3BFFA] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mb-6">
          <button onClick={exportToWord} className="export-btn">
            Xuất file Word
          </button>
          <button onClick={exportToExcel} className="export-btn">
            Xuất file Excel
          </button>
        </div>

        <div className="tag-container" ref={tagContainerRef} onDragOver={handleDragOver} onDrop={handleDrop}>
          <h2 className="text-2xl font-semibold -mt-2 mb-4 text-center">
            Ghi chú gần đây
          </h2>
          {tags.map((tag, index) => (
            <div
              key={index}
              className="tag"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              data-index={index}
            >
              {tag.name}
            </div>
          ))}
        </div>

        {selectedNote && (
          <div className="modal" onClick={() => setSelectedNote(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-semibold mb-4">{selectedNote.title}</h2>
              <p>
                <strong>Nội dung:</strong>{" "}
                {selectedNote.content.length > 100 && !showFullContent
                  ? `${selectedNote.content.substring(0, 100)}...`
                  : selectedNote.content}
                {selectedNote.content.length > 100 && (
                  <span
                    className="show-more-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFullContent(!showFullContent);
                    }}
                  >
                    {showFullContent ? "Thu gọn" : "Xem thêm"}
                  </span>
                )}
              </p>
              {selectedNote.image_url && (
                <img 
                  src={selectedNote.image_url} 
                  alt="Note" 
                  className="my-2 rounded" 
                  style={{ 
                    width: "300px", 
                    height: "200px", 
                    objectFit: "cover" 
                  }} 
                />
              )}
              <p><strong>Thể loại:</strong> { { 1: "Personal Palma", 2: "Study Palma", 3: "Entertainment Palma", 4: "Upload Palma" }[selectedNote.category_id] || "Unknown" }</p>
              <p><strong>Loại ghi chú:</strong> { { plain: "Ghi chú văn bản thuần", rich: "Ghi chú văn bản phong phú", todo: "Ghi chú danh sách công việc", spreadsheet: "Ghi chú bảng tính" }[selectedNote.note_type] || "Không xác định" }</p>
              <p><strong>Ngày tạo:</strong> {new Date(selectedNote.created_at).toLocaleString()}</p>
              <p><strong>Phong cách chữ:</strong> {selectedNote.font_style}, {selectedNote.font_size}, {selectedNote.font_family}</p>
              <button
                onClick={() => {
                  setSelectedNote(null);
                  setShowFullContent(false);
                }}
                className="mt-4 export-btn"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
      <ThemeSettings />
    </div>
  );
}