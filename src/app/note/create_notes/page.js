"use client";

import { useState, useEffect, useRef } from "react";
import { supabase2 } from "../../../lib/supabase";
import {
  FaFileImport,
  FaShareAlt,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaFileExport,
  FaBars,
  FaSmile,
  FaTimes,
  FaBold,
  FaItalic,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
  FaListUl,
  FaListOl,
  FaIndent,
  FaOutdent,
  FaImage,
  FaFont,
  FaFill,
  FaUndo,
  FaRedo,
  FaBell,
  FaBellSlash,
} from "react-icons/fa";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import Image from "next/image";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const NoteApp = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState([]);
  const [sortBy, setSortBy] = useState("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [imageUploadVisible, setImageUploadVisible] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [noteTypeMenu, setNoteTypeMenu] = useState(false);
  const [currentNoteType, setCurrentNoteType] = useState("rich");
  const [category, setCategory] = useState("Personal"); // Thể loại mặc định là Personal
  const [categoryMenu, setCategoryMenu] = useState(false); // Trạng thái menu thể loại
  const [error, setError] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const textAreaRef = useRef(null);

  const [fontFamily, setFontFamily] = useState("Verdana");
  const [fontSize, setFontSize] = useState("14pt");
  const [fontWeight, setFontWeight] = useState("normal");
  const [fontStyle, setFontStyle] = useState("normal");
  const [textAlign, setTextAlign] = useState("left");
  const [textColor, setTextColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  const [todos, setTodos] = useState([]);
  const [spreadsheetData, setSpreadsheetData] = useState(
    Array(10)
      .fill()
      .map(() => Array(10).fill(""))
  );
  const [spreadsheetHistory, setSpreadsheetHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [reminderTime, setReminderTime] = useState("");

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase2
        .from("notess")
        .select(
          "id, title, content, image_url, created_at, updated_at, category_id, font_style, font_size, font_weight, note_type, font_family, text_align, text_color, background_color, todos, spreadsheet_data, classification"
        )
        .order("updated_at", { ascending: false });
      if (error) throw error;

      setNotes(
        data.map((note) => {
          let parsedTodos = [];
          let parsedSpreadsheetData = Array(10)
            .fill()
            .map(() => Array(10).fill(""));

          if (note.todos) {
            try {
              parsedTodos = JSON.parse(note.todos);
              if (!Array.isArray(parsedTodos)) parsedTodos = [];
            } catch (e) {
              console.error(`Error parsing todos for note ${note.id}:`, e);
              parsedTodos = [];
            }
          }

          if (note.spreadsheet_data) {
            try {
              parsedSpreadsheetData = JSON.parse(note.spreadsheet_data);
              if (!Array.isArray(parsedSpreadsheetData))
                parsedSpreadsheetData = Array(10)
                  .fill()
                  .map(() => Array(10).fill(""));
            } catch (e) {
              console.error(
                `Error parsing spreadsheet_data for note ${note.id}:`,
                e
              );
              parsedSpreadsheetData = Array(10)
                .fill()
                .map(() => Array(10).fill(""));
            }
          }

          return {
            ...note,
            todos: parsedTodos,
            spreadsheet_data: parsedSpreadsheetData,
          };
        }) || []
      );
    } catch (err) {
      console.error("Error fetching notes:", err, {
        message: err.message,
        code: err.code,
        details: err.details,
      });
      setError(
        "Không thể tải ghi chú: " + (err.message || "Lỗi không xác định")
      );
    }
  };

  const handleSaveNote = async () => {
    if (!title.trim()) {
      setError("Tiêu đề không được để trống.");
      return;
    }
    if (title.trim().length > 255) {
      setError("Tiêu đề không được vượt quá 255 ký tự.");
      return;
    }
    if (
      (currentNoteType === "plain" || currentNoteType === "rich") &&
      !content.trim()
    ) {
      setError("Nội dung không được để trống.");
      return;
    }

    try {
      const imageUrl =
        uploadedImages.length > 0
          ? uploadedImages[uploadedImages.length - 1]
          : null;

      // Xác định classification dựa trên note_type
      let classification;
      switch (currentNoteType) {
        case "plain":
          classification = "pure";
          break;
        case "rich":
          classification = "Abundant";
          break;
        case "whiteboard":
          classification = "job";
          break;
        case "spreadsheet":
          classification = "spreadsheet";
          break;
        default:
          classification = "Abundant"; // Mặc định nếu không khớp
      }

      // Ánh xạ category sang category_id (giả sử có bảng categories trong Supabase)
      const categoryMap = {
        Personal: 1, // Giả sử ID trong bảng categories
        Study: 2,
        Entertainment: 3,
        Upload: 4,
      };

      const noteData = {
        title: title.trim(),
        content:
          currentNoteType === "plain" || currentNoteType === "rich"
            ? content.trim()
            : "",
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
        note_type: currentNoteType,
        font_style: currentNoteType === "rich" ? fontStyle : null,
        font_size: currentNoteType === "rich" ? fontSize : null,
        font_weight: currentNoteType === "rich" ? fontWeight : null,
        font_family: currentNoteType === "rich" ? fontFamily : null,
        text_align: currentNoteType === "rich" ? textAlign : null,
        text_color: currentNoteType === "rich" ? textColor : null,
        background_color: currentNoteType === "rich" ? backgroundColor : null,
        todos: currentNoteType === "whiteboard" ? JSON.stringify(todos) : null,
        spreadsheet_data:
          currentNoteType === "spreadsheet"
            ? JSON.stringify(spreadsheetData)
            : null,
        classification: classification,
        category_id: categoryMap[category] || 1, // Mặc định là Personal (ID = 1) nếu không khớp
      };

      console.log("Saving note with data:", noteData);

      if (editingId !== null) {
        const { data, error } = await supabase2
          .from("notess")
          .update(noteData)
          .eq("id", editingId)
          .select()
          .single();
        if (error) throw error;
        setNotes(
          notes.map((note) =>
            note.id === editingId ? { ...note, ...data } : note
          )
        );
      } else {
        const { data, error } = await supabase2
          .from("notess")
          .insert([noteData])
          .select()
          .single();
        if (error) throw error;
        setNotes([data, ...notes]);
      }

      resetForm();
      await fetchNotes();
    } catch (err) {
      console.error("Error saving note:", err, {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
      });
      setError(
        "Có lỗi khi lưu ghi chú: " + (err.message || "Lỗi không xác định")
      );
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm("Bạn có chắc muốn xóa ghi chú này không?")) return;
    try {
      const { error } = await supabase2
        .from("notess")
        .delete()
        .eq("id", noteId);
      if (error) throw error;
      setNotes(notes.filter((note) => note.id !== noteId));
      setError("");
    } catch (err) {
      console.error("Error deleting note:", err, {
        message: err.message,
        code: err.code,
      });
      setError(
        "Không thể xóa ghi chú: " + (err.message || "Lỗi không xác định")
      );
    }
  };

  const handleEditNote = (note) => {
    setTitle(note.title);
    setContent(note.content || "");
    setUploadedImages(note.image_url ? [note.image_url] : []);
    setEditingId(note.id);
    setCurrentNoteType(note.note_type || "rich");
    setFontFamily(note.font_family || "Verdana");
    setFontSize(note.font_size || "14pt");
    setFontWeight(note.font_weight || "normal");
    setFontStyle(note.font_style || "normal");
    setTextAlign(note.text_align || "left");
    setTextColor(note.text_color || "#000000");
    setBackgroundColor(note.background_color || "#ffffff");
    setTodos(note.todos || []);
    setSpreadsheetData(
      note.spreadsheet_data ||
        Array(10)
          .fill()
          .map(() => Array(10).fill(""))
    );
    setSpreadsheetHistory([
      JSON.parse(
        JSON.stringify(
          note.spreadsheet_data ||
            Array(10)
              .fill()
              .map(() => Array(10).fill(""))
        )
      ),
    ]);
    setHistoryIndex(0);
    setImageUploadVisible(note.note_type !== "plain");

    // Ánh xạ ngược category_id sang category name
    const reverseCategoryMap = {
      1: "Personal",
      2: "Study",
      3: "Entertainment",
      4: "Upload",
    };
    setCategory(reverseCategoryMap[note.category_id] || "Personal");

    setError("");
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setUploadedImages([]);
    setImageUploadVisible(false);
    setEditingId(null);
    setCurrentNoteType("rich");
    setFontFamily("Verdana");
    setFontSize("14pt");
    setFontWeight("normal");
    setFontStyle("normal");
    setTextAlign("left");
    setTextColor("#000000");
    setBackgroundColor("#ffffff");
    setTodos([]);
    setSpreadsheetData(
      Array(10)
        .fill()
        .map(() => Array(10).fill(""))
    );
    setSpreadsheetHistory([]);
    setHistoryIndex(-1);
    setReminderTime("");
    setCategory("Personal"); // Reset về Personal
    setError("");
    setShowEmojiPicker(false);
  };

  const handleExportNotes = () => {
    const text = notes
      .map((note) => {
        let contentStr = "";
        if (note.note_type === "whiteboard" && note.todos) {
          contentStr = note.todos
            .map(
              (t) =>
                `${t.completed ? "[x]" : "[ ]"} ${t.text} ${
                  t.reminder ? `(Nhắc nhở: ${t.reminder})` : ""
                }`
            )
            .join("\n");
        } else if (note.note_type === "spreadsheet" && note.spreadsheet_data) {
          contentStr = note.spreadsheet_data
            .map((row) => row.join("\t"))
            .join("\n");
        } else {
          contentStr = note.content;
        }
        return `Tiêu đề: ${
          note.title
        }\nNội dung: ${contentStr}\nNgày cập nhật: ${new Date(
          note.updated_at
        ).toLocaleString()}\n---\n`;
      })
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = link;
    a.download = "ghi-chu.txt";
    a.click();
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          if (file.size > 10 * 1024 * 1024)
            throw new Error("File quá lớn. Vui lòng chọn file nhỏ hơn 10MB");
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", "blognote");
          formData.append("cloud_name", "dlaoxrnad");
          const response = await fetch(
            "https://api.cloudinary.com/v1_1/dlaoxrnad/image/upload",
            { method: "POST", body: formData }
          );
          if (!response.ok) throw new Error("Upload failed");
          const data = await response.json();
          return data.secure_url;
        })
      );
      setUploadedImages((prev) => [...prev, ...uploadedUrls]);
      setImageUploadVisible(true);
      setError("");
    } catch (err) {
      console.error("Error uploading images:", err);
      setError(err.message || "Không thể tải lên hình ảnh.");
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setUploadedImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const fileReader = new FileReader();
        fileReader.onload = async () => {
          try {
            const typedArray = new Uint8Array(fileReader.result);
            const pdf = await pdfjsLib.getDocument(typedArray).promise;
            let text = "";
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              text += content.items.map((item) => item.str).join(" ") + "\n";
            }
            setTitle(file.name.replace(".pdf", ""));
            setContent(text.trim());
            setCategory("Upload"); // Gán mặc định là Upload khi nhập file
            setError("");
          } catch (err) {
            throw new Error("Không thể đọc nội dung PDF: " + err.message);
          }
        };
        fileReader.onerror = () => {
          throw new Error("Lỗi khi đọc file PDF");
        };
        fileReader.readAsArrayBuffer(file);
      } else if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
      ) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setTitle(file.name.replace(".docx", ""));
        setContent(result.value.trim());
        setCategory("Upload"); // Gán mặc định là Upload khi nhập file
        setError("");
      } else {
        setError("Chỉ hỗ trợ tệp PDF hoặc Word (.docx)");
      }
    } catch (err) {
      console.error("Error importing file:", err);
      setError(err.message || "Không thể nhập tệp. Vui lòng thử lại.");
    }
  };

  const handleShareNote = () => {
    if (!title) {
      setError("Vui lòng nhập tiêu đề trước khi chia sẻ.");
      return;
    }
    let shareText = "";
    if (currentNoteType === "whiteboard") {
      shareText = todos
        .map(
          (t) =>
            `${t.completed ? "[x]" : "[ ]"} ${t.text} ${
              t.reminder ? `(Nhắc nhở: ${t.reminder})` : ""
            }`
        )
        .join("\n");
    } else if (currentNoteType === "spreadsheet") {
      shareText = spreadsheetData.map((row) => row.join("\t")).join("\n");
    } else {
      if (!content) {
        setError("Vui lòng nhập nội dung trước khi chia sẻ.");
        return;
      }
      shareText = content;
    }
    const shareData = { title, text: shareText, url: window.location.href };
    if (navigator.share) {
      navigator
        .share(shareData)
        .catch((err) => console.error("Lỗi khi chia sẻ:", err));
    } else {
      const fullText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
      navigator.clipboard
        .writeText(fullText)
        .then(() => alert("Đã sao chép ghi chú vào clipboard!"))
        .catch((err) => setError("Không thể sao chép ghi chú."));
    }
  };

  const addEmoji = (emoji) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleNoteTypeChange = (type) => {
    setCurrentNoteType(type);
    setNoteTypeMenu(false);
    if (type === "plain" || type === "whiteboard" || type === "spreadsheet") {
      setUploadedImages([]);
      setImageUploadVisible(false);
    }
    if (type === "spreadsheet") {
      setSpreadsheetHistory([JSON.parse(JSON.stringify(spreadsheetData))]);
      setHistoryIndex(0);
    }
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setCategoryMenu(false);
  };

  const addTodo = () => {
    if (!content.trim()) return;
    setTodos([
      ...todos,
      {
        text: content.trim(),
        completed: false,
        reminder: reminderTime || null,
      },
    ]);
    setContent("");
    setReminderTime("");
  };

  const toggleTodo = (index) => {
    setTodos(
      todos.map((todo, i) =>
        i === index ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const removeReminder = (index) => {
    setTodos(
      todos.map((todo, i) => (i === index ? { ...todo, reminder: null } : todo))
    );
  };

  const updateSpreadsheetCell = (row, col, value) => {
    const newData = [...spreadsheetData];
    newData[row][col] = value;
    setSpreadsheetData(newData);
    const newHistory = spreadsheetHistory.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newData)));
    setSpreadsheetHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undoSpreadsheet = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSpreadsheetData(
        JSON.parse(JSON.stringify(spreadsheetHistory[historyIndex - 1]))
      );
    }
  };

  const redoSpreadsheet = () => {
    if (historyIndex < spreadsheetHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSpreadsheetData(
        JSON.parse(JSON.stringify(spreadsheetHistory[historyIndex + 1]))
      );
    }
  };

  const handleTodoKeyPress = (e) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const sortedNotes = [...notes]
    .filter(
      (note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.content &&
          note.content.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) =>
      sortBy === "title"
        ? a.title.localeCompare(b.title)
        : new Date(b.updated_at) - new Date(a.updated_at)
    );

  const emojiList = [
    ...new Set([
      "😀",
      "😃",
      "😄",
      "😊",
      "😍",
      "🥰",
      "😘",
      "😜",
      "😎",
      "🤓",
      "😇",
      "🥳",
      "😂",
      "🤗",
      "😢",
      "😭",
      "😡",
      "😤",
      "😱",
      "😳",
      "🤔",
      "🙄",
      "😴",
      "🤤",
      "👍",
      "👎",
      "👏",
      "🙌",
      "✋",
      "👊",
      "✌️",
      "🤝",
      "🙏",
      "💪",
      "👀",
      "👉",
      "❤️",
      "💕",
      "💖",
      "💙",
      "💚",
      "💛",
      "💜",
      "🖤",
      "💔",
      "💘",
      "✨",
      "⭐",
      "🌟",
      "🔥",
      "💡",
      "🎉",
      "🎈",
      "🎁",
      "🎂",
      "🍰",
      "🍕",
      "🍔",
      "🍟",
      "🍦",
      "☕",
      "🍵",
      "🍺",
      "🍷",
      "🥂",
      "🍹",
      "🌈",
      "☀️",
      "🌙",
      "☁️",
      "⛄",
      "⚡",
      "🌊",
      "🌸",
      "🌺",
      "🌼",
      "🍁",
      "🍂",
      "🍃",
      "📌",
      "✅",
      "❌",
      "❓",
      "❗",
      "🚀",
      "✈️",
      "🚗",
      "🚢",
      "🏠",
      "🏡",
      "🏝️",
      "⛰️",
      "🎵",
      "🎶",
      "🎤",
      "🎧",
      "📱",
      "💻",
      "📷",
      "📸",
      "🎥",
      "📺",
      "⏰",
      "⌚",
      "🔧",
      "⚙️",
      "💰",
    ]),
  ];

  const getSelectionInfo = () => {
    const textarea = textAreaRef.current;
    if (!textarea) return { start: 0, end: 0, text: "" };
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value.substring(start, end);
    return { start, end, text };
  };

  const setContentWithSelection = (newContent, start, end) => {
    setContent(newContent);
    setTimeout(() => {
      const textarea = textAreaRef.current;
      if (textarea) {
        textarea.selectionStart = start;
        textarea.selectionEnd = end;
        textarea.focus();
      }
    }, 0);
  };

  const handleUnorderedList = () => {
    const { start, end, text } = getSelectionInfo();
    if (!text) {
      setError("Vui lòng chọn văn bản để tạo danh sách.");
      return;
    }
    const lines = text.split("\n");
    const listItems = lines.map((line) => `- ${line}`).join("\n");
    const newContent =
      content.substring(0, start) + listItems + content.substring(end);
    setContentWithSelection(newContent, start, start + listItems.length);
    setError("");
  };

  const handleOrderedList = () => {
    const { start, end, text } = getSelectionInfo();
    if (!text) {
      setError("Vui lòng chọn văn bản để tạo danh sách có thứ tự.");
      return;
    }
    const lines = text.split("\n");
    const listItems = lines
      .map((line, index) => `${index + 1}. ${line}`)
      .join("\n");
    const newContent =
      content.substring(0, start) + listItems + content.substring(end);
    setContentWithSelection(newContent, start, start + listItems.length);
    setError("");
  };

  const handleIndent = () => {
    const { start, end, text } = getSelectionInfo();
    if (!text) {
      setError("Vui lòng chọn văn bản để thụt đầu dòng.");
      return;
    }
    const lines = text.split("\n");
    const indentedLines = lines.map((line) => `  ${line}`);
    const listItems = indentedLines.join("\n");
    const newContent =
      content.substring(0, start) + listItems + content.substring(end);
    setContentWithSelection(newContent, start, start + listItems.length);
    setError("");
  };

  const handleOutdent = () => {
    const { start, end, text } = getSelectionInfo();
    if (!text) {
      setError("Vui lòng chọn văn bản để bỏ thụt đầu dòng.");
      return;
    }
    const lines = text.split("\n");
    const outdentedLines = lines.map((line) => line.replace(/^  /, ""));
    const listItems = outdentedLines.join("\n");
    const newContent =
      content.substring(0, start) + listItems + content.substring(end);
    setContentWithSelection(newContent, start, start + listItems.length);
    setError("");
  };

  return (
    <div className="text-gray-700">
      <div className="mt-[96px] p-5 mb-[-7px] max-w-7xl mx-auto p-8 border border-gray-300 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-700">
          Ghi chú
        </h1>

        <input
          type="text"
          placeholder="Tiêu đề ghi chú"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border-2 border-transparent p-4 rounded-xl mb-4 font-bold text-lg transition duration-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-300"
        />

        <div className="flex flex-nowrap space-x-4 text-blue-600 mb-4 relative">
          <div className="relative">
            <button
              onClick={() => setNoteTypeMenu(!noteTypeMenu)}
              className="btn-gradient"
            >
              <FaBars /> <span>Tạo Ghi Chú</span>
            </button>
            {noteTypeMenu && (
              <div className="absolute left-0 mt-2 bg-white border border-light-blue-300 rounded-lg shadow-lg w-48 z-10">
                <button
                  className="dropdown-item hover:bg-light-blue-100"
                  onClick={() => handleNoteTypeChange("plain")}
                >
                  📝 Ghi chú văn bản thuần
                </button>
                <button
                  className="dropdown-item hover:bg-light-blue-100"
                  onClick={() => handleNoteTypeChange("rich")}
                >
                  🖋 Ghi chú văn bản phong phú
                </button>
                <button
                  className="dropdown-item hover:bg-light-blue-100"
                  onClick={() => handleNoteTypeChange("whiteboard")}
                >
                  🎨 Ghi chú danh sách công việc
                </button>
                <button
                  className="dropdown-item hover:bg-light-blue-100"
                  onClick={() => handleNoteTypeChange("spreadsheet")}
                >
                  📊 Ghi chú bảng tính
                </button>
              </div>
            )}
          </div>

          {currentNoteType !== "plain" &&
            currentNoteType !== "whiteboard" &&
            currentNoteType !== "spreadsheet" && (
              <>
                <div className="relative">
                  <button
                    onClick={handleImageButtonClick}
                    className="btn-gradient"
                  >
                    <FaPlus /> <span>Chèn ảnh</span>
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="btn-gradient"
                  >
                    <FaSmile /> <span>icon</span>
                  </button>
                  {showEmojiPicker && (
                    <div className="emoji-picker absolute z-10 bg-white border rounded-lg p-2 shadow-lg w-64 max-h-48 overflow-y-auto">
                      {emojiList.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => addEmoji(emoji)}
                          className="p-2 hover:bg-gray-100 text-2xl"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

          <label className="btn-gradient cursor-pointer">
            <FaFileImport /> <span>Nhập Word/PDF</span>
            <input
              type="file"
              accept=".docx,application/pdf"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button onClick={handleShareNote} className="btn-gradient">
            <FaShareAlt /> <span>Chia sẻ</span>
          </button>

          <button
            onClick={handleExportNotes}
            className="btn-gradient text-green-600"
          >
            <FaFileExport /> <span>Xuất File</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setCategoryMenu(!categoryMenu)}
              className="btn-gradient"
            >
              <FaBars /> <span>Thể loại: {category}</span>
            </button>
            {categoryMenu && (
              <div className="absolute left-0 mt-2 bg-white border border-light-blue-300 rounded-lg shadow-lg w-48 z-10">
                <button
                  className="dropdown-item hover:bg-light-blue-100"
                  onClick={() => handleCategoryChange("Personal")}
                >
                  👤 Personal
                </button>
                <button
                  className="dropdown-item hover:bg-light-blue-100"
                  onClick={() => handleCategoryChange("Study")}
                >
                  📚 Study
                </button>
                <button
                  className="dropdown-item hover:bg-light-blue-100"
                  onClick={() => handleCategoryChange("Entertainment")}
                >
                  🎬 Entertainment
                </button>
                <button
                  className="dropdown-item hover:bg-light-blue-100"
                  onClick={() => handleCategoryChange("Upload")}
                >
                  📤 Upload
                </button>
              </div>
            )}
          </div>
        </div>

        {currentNoteType === "plain" || currentNoteType === "rich" ? (
          <>
            {currentNoteType === "rich" && (
              <div className="mb-4 flex flex-wrap gap-2 bg-gray-100 p-2 rounded-lg border border-gray-300">
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="border p-1 rounded bg-white"
                >
                  <option value="Verdana">Verdana</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                </select>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="border p-1 rounded bg-white"
                >
                  <option value="10pt">10pt</option>
                  <option value="12pt">12pt</option>
                  <option value="14pt">14pt</option>
                  <option value="16pt">16pt</option>
                  <option value="18pt">18pt</option>
                </select>
                <button
                  onClick={() =>
                    setFontWeight(fontWeight === "bold" ? "normal" : "bold")
                  }
                  className={`border p-2 rounded ${
                    fontWeight === "bold" ? "bg-blue-200" : "bg-white"
                  } hover:bg-blue-100`}
                >
                  <FaBold />
                </button>
                <button
                  onClick={() =>
                    setFontStyle(fontStyle === "italic" ? "normal" : "italic")
                  }
                  className={`border p-2 rounded ${
                    fontStyle === "italic" ? "bg-blue-200" : "bg-white"
                  } hover:bg-blue-100`}
                >
                  <FaItalic />
                </button>
                <button
                  onClick={() => setTextAlign("left")}
                  className={`border p-2 rounded ${
                    textAlign === "left" ? "bg-blue-200" : "bg-white"
                  } hover:bg-blue-100`}
                >
                  <FaAlignLeft />
                </button>
                <button
                  onClick={() => setTextAlign("center")}
                  className={`border p-2 rounded ${
                    textAlign === "center" ? "bg-blue-200" : "bg-white"
                  } hover:bg-blue-100`}
                >
                  <FaAlignCenter />
                </button>
                <button
                  onClick={() => setTextAlign("right")}
                  className={`border p-2 rounded ${
                    textAlign === "right" ? "bg-blue-200" : "bg-white"
                  } hover:bg-blue-100`}
                >
                  <FaAlignRight />
                </button>
                <button
                  onClick={() => setTextAlign("justify")}
                  className={`border p-2 rounded ${
                    textAlign === "justify" ? "bg-blue-200" : "bg-white"
                  } hover:bg-blue-100`}
                >
                  <FaAlignJustify />
                </button>
                <button
                  onClick={handleUnorderedList}
                  className="border p-2 rounded bg-white hover:bg-blue-100"
                >
                  <FaListUl />
                </button>
                <button
                  onClick={handleOrderedList}
                  className="border p-2 rounded bg-white hover:bg-blue-100"
                >
                  <FaListOl />
                </button>
                <button
                  onClick={handleIndent}
                  className="border p-2 rounded bg-white hover:bg-blue-100"
                >
                  <FaIndent />
                </button>
                <button
                  onClick={handleOutdent}
                  className="border p-2 rounded bg-white hover:bg-blue-100"
                >
                  <FaOutdent />
                </button>
                <button
                  onClick={handleImageButtonClick}
                  className="border p-2 rounded bg-white hover:bg-blue-100"
                >
                  <FaImage />
                </button>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="border p-1 rounded w-8 h-8"
                />
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="border p-1 rounded w-8 h-8"
                />
              </div>
            )}
            {uploadedImages.length > 0 && (
              <div className="mb-4 p-4 border border-gray-300 rounded-lg flex justify-center">
                <div className="flex flex-wrap gap-4 max-w-3xl">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={image}
                        alt={`Uploaded preview ${index}`}
                        width={300}
                        height={300}
                        className="object-contain rounded-md"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="Xóa ảnh"
                      >
                        <FaTimes size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <textarea
              ref={textAreaRef}
              placeholder="Nội dung ghi chú"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-56 border-2 border-transparent p-4 rounded-xl transition duration-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-300"
              style={{
                fontFamily: currentNoteType === "rich" ? fontFamily : "Verdana",
                fontSize: currentNoteType === "rich" ? fontSize : "14pt",
                fontWeight: currentNoteType === "rich" ? fontWeight : "normal",
                fontStyle: currentNoteType === "rich" ? fontStyle : "normal",
                textAlign: currentNoteType === "rich" ? textAlign : "left",
                color: currentNoteType === "rich" ? textColor : "#000000",
                backgroundColor:
                  currentNoteType === "rich" ? backgroundColor : "#ffffff",
              }}
            />
          </>
        ) : currentNoteType === "whiteboard" ? (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Thêm công việc (Enter để thêm)..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyPress={handleTodoKeyPress}
                className="flex-grow border-2 border-gray-300 p-2 rounded-lg"
              />
              <input
                type="datetime-local"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="border-2 border-gray-300 p-2 rounded-lg"
              />
              <button onClick={addTodo} className="btn-gradient">
                <FaPlus /> Thêm
              </button>
            </div>
            <ul className="space-y-2">
              {todos.map((todo, index) => (
                <li key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(index)}
                    className="w-5 h-5"
                  />
                  <span
                    className={
                      todo.completed ? "line-through text-gray-500" : ""
                    }
                  >
                    {todo.text}
                  </span>
                  {todo.reminder && (
                    <small className="ml-2 text-gray-500 flex items-center">
                      <FaBell className="mr-1" /> (Nhắc nhở:{" "}
                      {new Date(todo.reminder).toLocaleString()})
                    </small>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : currentNoteType === "spreadsheet" ? (
          <div className="mb-4 overflow-x-auto">
            <div className="flex gap-2 mb-2">
              <button
                onClick={undoSpreadsheet}
                disabled={historyIndex <= 0}
                className={`btn-gradient ${
                  historyIndex <= 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <FaUndo /> Quay lại
              </button>
              <button
                onClick={redoSpreadsheet}
                disabled={historyIndex >= spreadsheetHistory.length - 1}
                className={`btn-gradient ${
                  historyIndex >= spreadsheetHistory.length - 1
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <FaRedo /> Tiến tới
              </button>
            </div>
            <table className="border-collapse border border-gray-300">
              <tbody>
                {spreadsheetData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) =>
                            updateSpreadsheetCell(
                              rowIndex,
                              colIndex,
                              e.target.value
                            )
                          }
                          className="w-full h-full border-none p-1 focus:outline-none"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {error && <p className="text-red-500">{error}</p>}

        <div className="flex justify-center mt-4">
          <button
            onClick={handleSaveNote}
            className="btn-gradient w-full max-w-md px-4 py-3 text-xl font-bold flex justify-center"
          >
            {editingId !== null ? "Cập nhật" : "Lưu"}
          </button>
        </div>

        <div className="mt-6 p-4 border border-gray-300 rounded-lg">
          <div className="relative">
            <FaSearch className="absolute left-4 top-4 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-2 border-gray-300 p-4 pl-12 rounded-xl transition duration-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="flex justify-between mt-6 text-blue-600">
            <button onClick={() => setSortBy("title")}>
              ↕ Sắp xếp theo tiêu đề
            </button>
            <button onClick={() => setSortBy("updated_at")}>
              ↕ Sắp xếp theo ngày cập nhật
            </button>
          </div>

          <div className="mt-8">
            <h2 className="font-bold text-2xl text-blue-600">
              📌 Ghi chú đã lưu
            </h2>
            <ul>
              {sortedNotes.length > 0 ? (
                sortedNotes.map((note) => (
                  <li
                    key={note.id}
                    className="border-2 border-gray-200 p-5 rounded-xl mt-4 flex items-start transition duration-300 hover:shadow-lg"
                  >
                    <div className="flex-shrink-0 mr-4">
                      {note.image_url && (
                        <Image
                          src={note.image_url}
                          alt={`Note ${note.id} image`}
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover rounded-md"
                        />
                      )}
                    </div>
                    <div className="flex-grow">
                      <strong className="text-purple-600 text-lg">
                        {note.title}
                      </strong>
                      {note.note_type === "whiteboard" &&
                      Array.isArray(note.todos) &&
                      note.todos.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {note.todos.map((todo, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={todo.completed}
                                onChange={() => {
                                  const updatedTodos = note.todos.map((t, i) =>
                                    i === index
                                      ? { ...t, completed: !t.completed }
                                      : t
                                  );
                                  supabase2
                                    .from("notess")
                                    .update({
                                      todos: JSON.stringify(updatedTodos),
                                    })
                                    .eq("id", note.id)
                                    .then(() => fetchNotes());
                                }}
                                className="w-5 h-5"
                              />
                              <span
                                className={
                                  todo.completed
                                    ? "line-through text-gray-500"
                                    : ""
                                }
                              >
                                {todo.text}
                              </span>
                              {todo.reminder && (
                                <>
                                  <small className="ml-2 text-gray-500 flex items-center">
                                    <FaBell className="mr-1" /> (Nhắc nhở:{" "}
                                    {new Date(todo.reminder).toLocaleString()})
                                  </small>
                                  {!todo.completed && (
                                    <button
                                      onClick={() => {
                                        const updatedTodos = note.todos.map(
                                          (t, i) =>
                                            i === index
                                              ? { ...t, reminder: null }
                                              : t
                                        );
                                        supabase2
                                          .from("notess")
                                          .update({
                                            todos: JSON.stringify(updatedTodos),
                                          })
                                          .eq("id", note.id)
                                          .then(() => fetchNotes());
                                      }}
                                      className="ml-2 text-red-500 hover:text-red-700"
                                      title="Tắt nhắc nhở"
                                    >
                                      <FaBellSlash />
                                    </button>
                                  )}
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : note.note_type === "spreadsheet" &&
                        Array.isArray(note.spreadsheet_data) &&
                        note.spreadsheet_data.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="border-collapse border border-gray-300 text-sm">
                            <tbody>
                              {note.spreadsheet_data
                                .slice(0, 3)
                                .map((row, rowIndex) => (
                                  <tr key={rowIndex}>
                                    {Array.isArray(row) ? (
                                      row.slice(0, 3).map((cell, colIndex) => (
                                        <td
                                          key={colIndex}
                                          className="border border-gray-300 p-1"
                                        >
                                          {cell}
                                        </td>
                                      ))
                                    ) : (
                                      <td className="border border-gray-300 p-1">
                                        Invalid Row
                                      </td>
                                    )}
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                          <small>
                            (Hiển thị 3x3, tổng {note.spreadsheet_data.length}x
                            {note.spreadsheet_data[0]?.length || 0})
                          </small>
                        </div>
                      ) : (
                        <p className="text-gray-700">{note.content}</p>
                      )}
                      <small className="text-gray-500">
                        {new Date(note.updated_at).toLocaleString()}
                      </small>
                    </div>
                    <div className="flex space-x-3 ml-4">
                      <button
                        onClick={() => handleEditNote(note)}
                        className="text-green-600 text-xl hover:text-green-800 transition duration-200"
                        title="Sửa ghi chú"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-500 text-xl hover:text-red-700 transition duration-200"
                        title="Xóa ghi chú"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-gray-500 mt-3">
                  Không tìm thấy ghi chú nào.
                </p>
              )}
            </ul>
          </div>
        </div>

        <style jsx>{`
          .btn-gradient {
            background: linear-gradient(135deg, #6aa8ff, #b57edc);
            color: white;
            padding: 12px 20px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
            transition: all 0.3s ease-in-out;
            border: 1px solid lightgray;
          }
          .btn-gradient:hover {
            background: linear-gradient(135deg, #b57edc, #6aa8ff);
            transform: scale(1.08);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          }
          .btn-gradient:disabled {
            background: gray;
            transform: none;
            box-shadow: none;
          }
          .dropdown-item {
            display: block;
            width: 100%;
            padding: 10px;
            text-align: left;
            border: none;
            background: none;
            cursor: pointer;
            transition: background 0.3s ease;
          }
          .dropdown-item:hover {
            background-color: rgba(173, 216, 230, 0.5);
          }
          .border-light-blue-300 {
            border-color: #6aa8ff;
          }
          .emoji-picker {
            top: 100%;
            left: 0;
            transform: translateY(10px);
          }
        `}</style>
      </div>
    </div>
  );
};

export default NoteApp;
