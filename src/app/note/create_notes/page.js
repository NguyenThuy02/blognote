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
  FaPlay,
  FaPause,
  FaLanguage,
  FaThumbtack,
} from "react-icons/fa";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"; // Dark theme for code highlighting
import Editor from "@monaco-editor/react"; // Thêm monaco-editor
import axios from 'axios';
import CryptoJS from "crypto-js";

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
  const [currentNoteType, setCurrentNoteType] = useState("plain");
  const [category, setCategory] = useState("Personal");
  const [categoryMenu, setCategoryMenu] = useState(false);
  const [error, setError] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const textAreaRef = useRef(null);
  const audioRef = useRef(null);
  const importFileInputRef = useRef(null);
  const noteFormRef = useRef(null); // cuộn phần sửa 
  const [isRecording, setIsRecording] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [voiceUrl, setVoiceUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState(""); // URL của file âm thanh tải lên
  const [isUploadingVideo, setIsUploadingVideo] = useState(false); // Trạng thái loading video
  const mediaRecorderRef = useRef(null);
  const audioInputRef = useRef(null); // Ref cho input file âm thanh
  const recognitionRef = useRef(null); // Ref cho SpeechRecognition

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

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState("");
  const [audioMenuVisible, setAudioMenuVisible] = useState(false);
  const [translateTo, setTranslateTo] = useState("");
  const [translateMenuVisible, setTranslateMenuVisible] = useState(false);
  const [extraMenuVisible, setExtraMenuVisible] = useState(false);

  const [filterType, setFilterType] = useState("all");
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState("javascript");

  const videoInputRef = useRef(null); // tải video

  const [voicePublicId, setVoicePublicId] = useState("");

  const [codeOutput, setCodeOutput] = useState(""); // Lưu kết quả chạy code
  const [visibleNoteTypes, setVisibleNoteTypes] = useState({


    plain: true,
    rich: true,
    whiteboard: true,
    spreadsheet: true,
    markdown: true, // Added markdown to visible note types
    voice: true, // Thêm voice
  });

  const noteTypeMenuRef = useRef(null);
  const categoryMenuRef = useRef(null);
  const extraMenuRef = useRef(null);
  const audioMenuRef = useRef(null);
  const translateMenuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const filterMenuRef = useRef(null);
  const sortMenuRef = useRef(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  // ghi âm 
      useEffect(() => {
        // Khởi tạo SpeechRecognition
        if (typeof window !== "undefined" && window.SpeechRecognition) {
          recognitionRef.current = new window.SpeechRecognition();
          recognitionRef.current.lang = "vi-VN"; // Ngôn ngữ tiếng Việt
          recognitionRef.current.interimResults = true; // Hiển thị kết quả tạm thời
          recognitionRef.current.continuous = true; // Ghi âm liên tục
      
          let hasSpeech = false; // Biến để kiểm tra xem có phát hiện văn bản hay không
      
          recognitionRef.current.onresult = (event) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
            }
            if (transcript.trim()) {
              hasSpeech = true; // Có văn bản được phát hiện
              setContent((prev) => prev + transcript); // Thêm văn bản vào content
            }
          };
      
          recognitionRef.current.onend = () => {
            if (!hasSpeech && isRecording) {
              setError("Không phát hiện văn bản từ giọng nói.");
            }
          };
      
          recognitionRef.current.onerror = (event) => {
            setError("Lỗi Speech-to-Text: " + event.error);
            stopRecording();
          };
        } else {
          console.warn("SpeechRecognition API không được hỗ trợ trên trình duyệt này.");
        }
      
        return () => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        };
      }, [isRecording]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        noteTypeMenuRef.current &&
        !noteTypeMenuRef.current.contains(event.target)
      ) {
        setNoteTypeMenu(false);
      }
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(event.target)
      ) {
        setCategoryMenu(false);
      }
      if (
        extraMenuRef.current &&
        !extraMenuRef.current.contains(event.target)
      ) {
        setExtraMenuVisible(false);
      }
      if (
        audioMenuRef.current &&
        !audioMenuRef.current.contains(event.target)
      ) {
        setAudioMenuVisible(false);
      }
      if (
        translateMenuRef.current &&
        !translateMenuRef.current.contains(event.target)
      ) {
        setTranslateMenuVisible(false);
      }
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target)
      ) {
        setFilterMenuVisible(false);
      }
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(event.target)
      ) {
        setSortMenuVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase2
        .from("notess")
        .select(
          "id, title, content, image_url, created_at, updated_at, category_id, font_style, font_size, font_weight, note_type, font_family, text_align, text_color, background_color, todos, spreadsheet_data, classification, audio_url, video_url"
        )
        .order("updated_at", { ascending: false });
      if (error) {
        console.error("Chi tiết lỗi Supabase:", error);
        throw new Error(`Lỗi Supabase: ${error.message || "Lỗi không xác định"}`);
      }
  
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
              console.error(`Lỗi khi parse todos cho note ${note.id}:`, e);
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
              console.error(`Lỗi khi parse spreadsheet_data cho note ${note.id}:`, e);
              parsedSpreadsheetData = Array(10)
                .fill()
                .map(() => Array(10).fill(""));
            }
          }
  
          return {
            ...note,
            todos: parsedTodos,
            spreadsheet_data: parsedSpreadsheetData,
            isPinned: false,
            audio_url: note.audio_url || "",
            video_url: note.video_url || "", // Thêm video_url
          };
        }) || []
      );
    } catch (err) {
      console.error("Chi tiết lỗi khi lấy ghi chú:", err);
      setError("Không thể tải ghi chú: " + (err.message || "Lỗi không xác định"));
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
      (currentNoteType === "plain" ||
        currentNoteType === "rich" ||
        currentNoteType === "markdown" ||
        currentNoteType === "voice") &&
      !content.trim() &&
      !videoUrl &&
      !audioUrl
    ) {
      setError("Nội dung, video hoặc âm thanh không được để trống.");
      return;
    }
  
    try {
      const imageUrl =
        uploadedImages.length > 0
          ? uploadedImages[uploadedImages.length - 1]
          : null;
  
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
        case "markdown":
          classification = "markdown";
          break;
        case "voice":
          classification = "voice";
          break;
        default:
          classification = "Abundant";
      }
  
      const categoryMap = {
        Personal: 1,
        Study: 2,
        Entertainment: 3,
        Upload: 4,
      };
  
      const noteData = {
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
        note_type: currentNoteType,
        font_style: fontStyle,
        font_size: fontSize,
        font_weight: fontWeight,
        font_family: fontFamily,
        text_align: textAlign,
        text_color: textColor,
        background_color: backgroundColor,
        todos: currentNoteType === "whiteboard" ? JSON.stringify(todos) : null,
        spreadsheet_data:
          currentNoteType === "spreadsheet"
            ? JSON.stringify(spreadsheetData)
            : null,
        classification,
        category_id: categoryMap[category] || 1,
        audio_url: audioUrl || null,
        video_url: videoUrl || null, // Lưu video_url cho tất cả loại ghi chú
      };
  
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
        setNotes([{ ...data, isPinned: false }, ...notes]);
      }
  
      resetForm();
      await fetchNotes();
    } catch (err) {
      console.error("Error saving note:", err);
      setError("Có lỗi khi lưu ghi chú: " + (err.message || "Lỗi không xác định"));
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
      console.error("Error deleting note:", err);
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
  setImageUploadVisible(
    note.note_type !== "plain" &&
      note.note_type !== "markdown" &&
      note.note_type !== "voice"
  );
  setVoiceUrl(note.voice_url || "");
  setVideoUrl(note.video_url || "");
  setAudioUrl(note.audio_url || "");

  const reverseCategoryMap = {
    1: "Personal",
    2: "Study",
    3: "Entertainment",
    4: "Upload",
  };
  setCategory(reverseCategoryMap[note.category_id] || "Personal");

  setError("");

  if (noteFormRef.current) {
    noteFormRef.current.scrollIntoView({ behavior: "smooth" });
  }
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
      setCategory("Personal");
      setError("");
      setShowEmojiPicker(false);
      setIsAudioPlaying(false);
      setSelectedAudio("");
      setTranslateTo("");
      setExtraMenuVisible(false);
      setIsRecording(false);
      setVoiceBlob(null);
      setVoiceUrl("");
      setVoicePublicId("");
      setVideoUrl("");
      setAudioUrl("");
      setIsUploadingVideo(false);
      setVoicePublicId(""); // Thêm dòng này
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
    setExtraMenuVisible(false);
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
            setCategory("Upload");
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
        setCategory("Upload");
        setError("");
      } else {
        setError("Chỉ hỗ trợ tệp PDF hoặc Word (.docx)");
      }
      setExtraMenuVisible(false);
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
    setExtraMenuVisible(false);
  };

  const addEmoji = (emoji) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportButtonClick = () => {
    importFileInputRef.current?.click();
  };

  const handleNoteTypeChange = (type) => {
    setCurrentNoteType(type);
    setNoteTypeMenu(false);
    if (
      type === "plain" ||
      type === "whiteboard" ||
      type === "spreadsheet" ||
      type === "markdown"
    ) {
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

  const toggleAudio = () => {
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      if (selectedAudio) {
        audioRef.current.src = selectedAudio;
        audioRef.current
          .play()
          .then(() => {
            setIsAudioPlaying(true);
            setError("");
          })
          .catch((err) => {
            console.error("Error playing audio:", err);
            setError(
              "Không thể phát âm thanh từ Google Drive. URL có thể không hỗ trợ phát trực tiếp."
            );
          });
      } else {
        setError("Vui lòng chọn một âm thanh trước khi phát.");
      }
    }
  };

  const handleAudioSelect = (audioUrl) => {
    setSelectedAudio(audioUrl);
    setAudioMenuVisible(false);
    if (isAudioPlaying) {
      audioRef.current.src = audioUrl;
      audioRef.current
        .play()
        .then(() => setError(""))
        .catch((err) =>
          setError(
            "Không thể phát âm thanh từ Google Drive. URL có thể không hỗ trợ phát trực tiếp."
          )
        );
    }
  };

  // hàm xóa ghi âm 
  const handleDeleteVoice = async () => {
    if (isRecording) {
      stopRecording();
    }
  
    if (voicePublicId) {
      try {
        const cloudName = "dszqh3qcx";
        const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "247625795348214";
        const apiSecret = process.env.CLOUDINARY_API_SECRET || "PJm2yB_Gu4rDHCxzOdz23M7hh10"; 
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = CryptoJS.SHA1(`public_id=${voicePublicId}&timestamp=${timestamp}${apiSecret}`).toString(); // Tạo chữ ký
  
        // Xóa file trên Cloudinary
        const formData = new FormData();
        formData.append("public_id", voicePublicId);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);
  
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/video/destroy`,
          { method: "POST", body: formData }
        );
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to delete from Cloudinary: ${errorData.error.message}`);
        }
  
        // Cập nhật Supabase để xóa voice_url
        if (editingId !== null) {
          const { error: supabaseError } = await supabase2
            .from("notess")
            .update({ voice_url: null })
            .eq("id", editingId);
  
          if (supabaseError) {
            throw new Error(`Failed to update Supabase: ${supabaseError.message}`);
          }
        }
  
        // Xóa state cục bộ
        setVoiceUrl("");
        setVoiceBlob(null);
        setVoicePublicId("");
        setContent("");
        setError("");
  
        console.log("Voice deleted successfully from Cloudinary and Supabase");
      } catch (err) {
        console.error("Không thể xóa file:", err);
        setError("Không thể xóa file: " + err.message);
      }
    } else {
      // Xóa cục bộ nếu không có public_id
      if (editingId !== null) {
        try {
          const { error: supabaseError } = await supabase2
            .from("notess")
            .update({ voice_url: null })
            .eq("id", editingId);
  
          if (supabaseError) {
            throw new Error(`Failed to update Supabase: ${supabaseError.message}`);
          }
        } catch (err) {
          console.error("Không thể cập nhật Supabase:", err);
          setError("Không thể cập nhật Supabase: " + err.message);
          return;
        }
      }
  
      setVoiceUrl("");
      setVoiceBlob(null);
      setVoicePublicId("");
      setContent("");
      setError("");
      console.log("Cleared local voice state");
    }
  };

  const handlePinNote = (noteId) => {
    setNotes(
      notes.map((note) =>
        note.id === noteId ? { ...note, isPinned: !note.isPinned } : note
      )
    );
  };

  const toggleNoteTypeVisibility = (type) => {
    setVisibleNoteTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const sortedNotes = [...notes]
  .filter(
    (note) =>
      (filterType === "all" ||
        note.note_type === filterType ||
        filterType === "selective") &&
      (filterType !== "selective" || visibleNoteTypes[note.note_type]) &&
      (note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.content &&
          note.content.toLowerCase().includes(searchQuery.toLowerCase())))
  )
  .sort((a, b) => {
    if (filterType === "selective") {
      const order = [
        "plain",
        "rich",
        "whiteboard",
        "spreadsheet",
        "markdown", // Thêm markdown vào thứ tự
      ];
      const aIndex = order.indexOf(a.note_type);
      const bIndex = order.indexOf(b.note_type);
      if (aIndex !== bIndex) return aIndex - bIndex;
    }
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return sortBy === "title"
      ? a.title.localeCompare(b.title)
      : new Date(b.updated_at) - new Date(a.updated_at);
  });

  const emojiList = [
    "😀", "😃", "😄", "😊", "😍", "🥰", "😘", "😜", "😎", "🤓",
    "😇", "🥳", "😂", "🤗", "😢", "😭", "😡", "😤", "😱", "😳",
    "🤔", "🙄", "😴", "🤤", "🤓", "👍", "👎", "👏", "🙌", "✋",
    "👊", "✌️", "🤝", "🙏", "💪", "👀", "👉", "❤️", "💕", "💖", 
    "💚", "💛", "💜", "🖤", "💔", "💘", "💙", "✨", "⭐", "🌟", 
    "💡", "🎉", "🎈", "🎁", "🎂", "🍰", "🍕", "🍔", "🍟", "🍦",
    "☕", "🍵", "🍺", "🍷", "🥂", "🍹", "🌈", "☀️", "🌙", "☁️",
    "⛄", "⚡", "🌊", "🌸", "🌺", "🌼", "🍁", "🍂", "🍃", "📌",
    "✅", "❌", "❓", "❗", "🚀", "✈️", "🚗", "🚢", "🏠", "🏡",
    "🏝️", "⛰️", "🎵", "🎶", "🎤", "🎧", "📱", "💻", "📷", "📸",
    "🎥", "📺", "⏰", "⌚", "🔧", "⚙️", "💰", "🦉", "🔥",
  ];

  const audioOptions = [
    { name: "Tiếng mưa", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { name: "Nhạc thư giãn", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { name: "Sóng biển", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { name: "Câu Chuyện Nếu Như", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1743346199/CauChuyenNeuNhu-Superluckyqi-5991519_q3a4ns.mp3" },
    { name: "Khoảng Cách Thời Gian", url: "https://drive.google.com/uc?export=download&id=1SPOHbIGDYGZmLJq7mBw_szMyWmvSCVcV" },
    { name: "Âm thanh của nỗi nhớ anh", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1743345471/AmThanhCuaNoiNhoAnh-VK-6817533_r5gro0.mp3" },
    { name: "Sự nghiệp chướng", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1743345196/htptrtnfix_gvyo3k.mp3"},
    { name: "Show Ra Cho Em Xem", url: ""},
  ];

  const languageOptions = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "vi", name: "Vietnamese" },
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

  const runCode = async () => {
  try {
    const normalizedContent = content.replace(/\r\n/g, "\n").trim() + "\n";
    console.log("Normalized Content (String):", JSON.stringify(normalizedContent));

    const codeBlocks = [];
    const codeBlockRegex = /```(\w+)?(?:\s|\n)*([\s\S]*?)(?:\s|\n)*```/g;
    let match;
    while ((match = codeBlockRegex.exec(normalizedContent)) !== null) {
      const language = match[1]?.toLowerCase();
      const code = match[2].trim();
      console.log("Found language:", language);
      console.log("Found code:", code);
      if (["javascript", "python", "cpp"].includes(language)) {
        codeBlocks.push({ language, code });
      }
    }

    let codeToRun, language;
    if (codeBlocks.length > 0) {
      // Lấy khối code tương ứng với ngôn ngữ được chọn
      const selectedBlock = codeBlocks.find(
        (block) => block.language === selectedLanguage
      ) || codeBlocks[codeBlocks.length - 1]; // Fallback về khối cuối
      codeToRun = selectedBlock.code;
      language = selectedBlock.language;
    } else {
      // Nếu không có khối code, lấy toàn bộ nội dung
      codeToRun = normalizedContent.split("\n").join("\n").trim();
      language = selectedLanguage;
      if (!codeToRun) {
        setCodeOutput(
          "Không tìm thấy code để chạy. Vui lòng nhập code hợp lệ hoặc sử dụng cú pháp Markdown (e.g., ```javascript ... ```)."
        );
        return;
      }
    }

    let output = "";
    if (language === "javascript") {
      // Chạy JavaScript cục bộ
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        output += args.join(" ") + "\n";
      };
      try {
        const result = new Function(codeToRun)();
        console.log = originalConsoleLog;
        if (result !== undefined) {
          output += String(result);
        }
        setCodeOutput(output.trim() || "Không có output.");
      } catch (error) {
        console.log = originalConsoleLog;
        setCodeOutput(`Lỗi khi chạy code JavaScript: ${error.message}`);
      }
    } else {
      // Chạy Python hoặc C++ qua Piston API
      try {
        const languageMap = {
          python: { language: "python", version: "3.10.0" },
          cpp: { language: "cpp", version: "10.2.0" },
        };

        const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
          language: languageMap[language].language,
          version: languageMap[language].version,
          files: [{ content: codeToRun }],
        });

        const result = response.data;
        if (result.run && result.run.output) {
          output = result.run.output.trim();
          if (result.run.stderr) {
            output += `\nLỗi: ${result.run.stderr.trim()}`;
          }
        } else if (result.message) {
          output = `Lỗi từ API: ${result.message}`;
        } else {
          output = "Không có output.";
        }
        setCodeOutput(output || "Không có output.");
      } catch (error) {
        setCodeOutput(`Lỗi khi chạy code ${language}: ${error.message}`);
      }
    }
  } catch (error) {
    setCodeOutput(`Lỗi xử lý: ${error.message}`);
  }
};

      // Ghi chú bằng giọng nói 
      const startRecording = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorderRef.current = new MediaRecorder(stream);
          const chunks = [];
      
          mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };
      
          mediaRecorderRef.current.onstop = async () => {
            const blob = new Blob(chunks, { type: "audio/webm" });
            // Không lưu blob hay URL vì bản ghi âm sẽ bị xóa sau khi chuyển đổi
            // Giải phóng stream
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
          };
      
          mediaRecorderRef.current.start();
          setIsRecording(true);
          if (recognitionRef.current) {
            recognitionRef.current.start();
          }
          setError("");
        } catch (err) {
          setError("Không thể truy cập micro: " + err.message);
        }
      };

      const stopRecording = () => {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          // Xóa các state liên quan đến ghi âm
          setVoiceBlob(null);
          setVoiceUrl("");
          setVoicePublicId("");
        }
        if (recognitionRef.current) {
          recognitionRef.current.stop(); // Dừng Speech-to-Text
        }
      };

      // tải âm thanh lên 
      const handleAudioUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        if (file.size > 50 * 1024 * 1024) {
          throw new Error("File âm thanh quá lớn. Vui lòng chọn file nhỏ hơn 50MB");
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "blognote");
        formData.append("cloud_name", "dlaoxrnad");
        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dlaoxrnad/video/upload",
          { method: "POST", body: formData }
        );
        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();
        setAudioUrl(data.secure_url);
        setError("");
      } catch (err) {
        setError("Không thể tải lên file âm thanh: " + err.message);
      }
    };

      // tải video 
      const handleVideoUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        if (file.size > 50 * 1024 * 1024) {
          throw new Error("Video quá lớn. Vui lòng chọn file nhỏ hơn 50MB");
        }
        setIsUploadingVideo(true); // Bắt đầu loading
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "blognote");
        formData.append("cloud_name", "dlaoxrnad");
        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dlaoxrnad/video/upload",
          { method: "POST", body: formData }
        );
        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();
        setVideoUrl(data.secure_url);
        setError("");
      } catch (err) {
        setError("Không thể tải lên video: " + err.message);
      } finally {
        setIsUploadingVideo(false); // Kết thúc loading
      }
    };
      
  return (
    <div className="text-gray-700">
<div ref={noteFormRef} className="mt-[96px] p-5 mb-[-7px] max-w-7xl mx-auto p-8 border border-gray-300 rounded-lg shadow-lg">
  <h1 className="text-4xl font-extrabold text-gray-800 mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse">
    BlogNote - Ghi chú
  </h1>
  <input
    type="text"
    placeholder="Tiêu đề ghi chú"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    className="w-full border-2 border-transparent p-4 rounded-xl mb-4 font-bold text-lg transition duration-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-300"
        />

        <div className="flex flex-nowrap space-x-4 text-blue-600 mb-4 relative">
          <div className="relative" ref={noteTypeMenuRef}>
            <button
              onClick={() => setNoteTypeMenu(!noteTypeMenu)}
              className="menu-btn flex items-center gap-2 px-4 py-2 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-lg"
            >
              <FaBars /> <span>Tạo Ghi Chú</span>
            </button>
            {noteTypeMenu && (
              <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-10 menu-dropdown transition-all duration-200 ease-in-out">
                <button
                  className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                  onClick={() => handleNoteTypeChange("plain")}
                >
                  📝 Ghi chú văn bản thuần
                </button>
                <button
                  className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                  onClick={() => handleNoteTypeChange("rich")}
                >
                  🖋 Ghi chú văn bản phong phú
                </button>
                <button
                  className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                  onClick={() => handleNoteTypeChange("whiteboard")}
                >
                  🎨 Ghi chú danh sách công việc
                </button>
                <button
                  className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                  onClick={() => handleNoteTypeChange("spreadsheet")}
                >
                  📊 Ghi chú bảng tính
                </button>
                <button
                  className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                  onClick={() => handleNoteTypeChange("markdown")} // Sửa thành handleNoteTypeChange
                >
                  💻 Ghi chú Markdown/Code
                </button>
                <button
                className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                onClick={() => handleNoteTypeChange("voice")}
              >
                🎙 Ghi chú bằng giọng nói
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
                    className="menu-btn flex items-center gap-2 px-4 py-2 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-lg"
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
                <div className="relative" ref={emojiPickerRef}>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="menu-btn flex items-center gap-2 px-4 py-2 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-lg"
                  >
                    <FaSmile /> <span>Icon</span>
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute z-10 bg-white border rounded-lg p-2 shadow-xl w-64 max-h-48 overflow-y-auto mt-2 transition-all duration-200 ease-in-out">
                      {emojiList.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => addEmoji(emoji)}
                          className="p-2 hover:bg-gray-100 text-2xl transition-all duration-200"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

          <div className="relative" ref={categoryMenuRef}>
            <button
              onClick={() => setCategoryMenu(!categoryMenu)}
              className="menu-btn flex items-center gap-2 px-4 py-2 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-lg"
            >
              <FaBars /> <span>Thể loại: {category}</span>
            </button>
            {categoryMenu && (
              <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-10 menu-dropdown transition-all duration-200 ease-in-out">
                <button
                  className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                  onClick={() => handleCategoryChange("Personal")}
                >
                  👤 Personal
                </button>
                <button
                  className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                  onClick={() => handleCategoryChange("Study")}
                >
                  📚 Study
                </button>
                <button
                  className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                  onClick={() => handleCategoryChange("Entertainment")}
                >
                  🎬 Entertainment
                </button>
                <button
                  className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                  onClick={() => handleCategoryChange("Upload")}
                >
                  📤 Upload
                </button>
              </div>
            )}
          </div>

          <div className="relative" ref={audioMenuRef}>
            <button
              onClick={() => setAudioMenuVisible(!audioMenuVisible)}
              className="menu-btn flex items-center gap-2 px-4 py-2 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-lg"
            >
              <FaBars /> <span>Chọn âm thanh</span>
            </button>
            {audioMenuVisible && (
              <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-10 menu-dropdown transition-all duration-200 ease-in-out">
                {audioOptions.map((audio) => (
                  <button
                    key={audio.name}
                    className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                    onClick={() => handleAudioSelect(audio.url)}
                  >
                    {audio.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={toggleAudio}
              className="menu-btn flex items-center gap-2 px-4 py-2 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-lg"
            >
              {isAudioPlaying ? <FaPause /> : <FaPlay />}
              <span>{isAudioPlaying ? "Tạm dừng" : "Phát âm thanh"}</span>
            </button>
          </div>

          <div className="relative" ref={extraMenuRef}>
            <button
              onClick={() => setExtraMenuVisible(!extraMenuVisible)}
              className="menu-btn flex items-center gap-2 px-4 py-2 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-lg"
            >
              <FaBars /> <span>Thêm</span>
            </button>
            {extraMenuVisible && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-10 menu-dropdown transition-all duration-200 ease-in-out">
                <button
                  onClick={handleShareNote}
                  className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                >
                  <FaShareAlt /> Chia sẻ
                </button>
                <button
                  onClick={handleImportButtonClick}
                  className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                >
                  <FaFileImport /> Nhập Word/PDF
                </button>
                <input
                  type="file"
                  accept=".docx,application/pdf"
                  ref={importFileInputRef}
                  onChange={handleImportFile}
                  className="hidden"
                />
                <button
                  onClick={handleExportNotes}
                  className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                >
                  <FaFileExport /> Xuất File
                </button>
                <div className="relative">
                  <button
                    onClick={handleTranslate}
                    className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                  >
                    <FaLanguage /> Dịch
                  </button>
                </div>
                <div className="relative" ref={translateMenuRef}>
                  <button
                    onClick={() => setTranslateMenuVisible(!translateMenuVisible)}
                    className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                  >
                    <FaBars />{" "}
                    {translateTo
                      ? languageOptions.find((l) => l.code === translateTo)?.name
                      : "Chọn ngôn ngữ"}
                  </button>
                  {translateMenuVisible && (
                    <div className="absolute left-full top-0 mt-0 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-10 menu-dropdown transition-all duration-200 ease-in-out">
                      {languageOptions.map((lang) => (
                        <button
                          key={lang.code}
                          className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                          onClick={() => {
                            setTranslateTo(lang.code);
                            setTranslateMenuVisible(false);
                          }}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <audio ref={audioRef} loop />
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
            {/* Thanh công cụ định dạng cho loại ghi chú whiteboard */}
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
                onClick={() => setFontWeight(fontWeight === "bold" ? "normal" : "bold")}
                className={`border p-2 rounded ${fontWeight === "bold" ? "bg-blue-200" : "bg-white"} hover:bg-blue-100`}
              >
                <FaBold />
              </button>
              <button
                onClick={() => setFontStyle(fontStyle === "italic" ? "normal" : "italic")}
                className={`border p-2 rounded ${fontStyle === "italic" ? "bg-blue-200" : "bg-white"} hover:bg-blue-100`}
              >
                <FaItalic />
              </button>
              <button
                onClick={() => setTextAlign("left")}
                className={`border p-2 rounded ${textAlign === "left" ? "bg-blue-200" : "bg-white"} hover:bg-blue-100`}
              >
                <FaAlignLeft />
              </button>
              <button
                onClick={() => setTextAlign("center")}
                className={`border p-2 rounded ${textAlign === "center" ? "bg-blue-200" : "bg-white"} hover:bg-blue-100`}
              >
                <FaAlignCenter />
              </button>
              <button
                onClick={() => setTextAlign("right")}
                className={`border p-2 rounded ${textAlign === "right" ? "bg-blue-200" : "bg-white"} hover:bg-blue-100`}
              >
                <FaAlignRight />
              </button>
              <button
                onClick={() => setTextAlign("justify")}
                className={`border p-2 rounded ${textAlign === "justify" ? "bg-blue-200" : "bg-white"} hover:bg-blue-100`}
              >
                <FaAlignJustify />
              </button>
              {/* Thêm nút icon (emoji picker) */}
              <div className="relative" ref={emojiPickerRef}>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="border p-2 rounded bg-white hover:bg-blue-100"
                >
                  <FaSmile />
                </button>
                {showEmojiPicker && (
                  <div className="absolute z-10 bg-white border rounded-lg p-2 shadow-xl w-64 max-h-48 overflow-y-auto mt-2 transition-all duration-200 ease-in-out">
                    {emojiList.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => addEmoji(emoji)}
                        className="p-2 hover:bg-gray-100 text-2xl transition-all duration-200"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Thêm nút chèn ảnh */}
              <button
                onClick={handleImageButtonClick}
                className="border p-2 rounded bg-white hover:bg-blue-100"
                title="Chèn ảnh"
              >
                <FaImage />
              </button>
              <input
                type="file"
                accept="image/*"
                multiple
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
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
        
            {/* Hiển thị ảnh đã upload */}
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
        
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Thêm công việc (Enter để thêm)..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyPress={handleTodoKeyPress}
                className="flex-grow border-2 border-gray-300 p-2 rounded-lg"
                style={{
                  fontFamily: fontFamily,
                  fontSize: fontSize,
                  fontWeight: fontWeight,
                  fontStyle: fontStyle,
                  textAlign: textAlign,
                  color: textColor,
                  backgroundColor: backgroundColor,
                }}
              />
              <input
                type="datetime-local"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="border-2 border-gray-300 p-2 rounded-lg"
              />
              <button
                onClick={addTodo}
                className="menu-btn px-4 py-2 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-lg"
              >
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
                    className={todo.completed ? "line-through text-gray-500" : ""}
                    style={{
                      fontFamily: fontFamily,
                      fontSize: fontSize,
                      fontWeight: fontWeight,
                      fontStyle: fontStyle,
                      textAlign: textAlign,
                      color: textColor,
                      backgroundColor: backgroundColor,
                    }}
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
          <div className="mb-4 overflow-x-auto bg-white p-4 rounded-lg shadow-md border border-gray-200">
            {/* Toolbar for Spreadsheet Formatting */}
            <div className="flex flex-wrap gap-2 mb-4 bg-gray-100 p-3 rounded-lg border border-gray-300">
              {/* Undo and Redo Buttons */}
              <button
                onClick={undoSpreadsheet}
                disabled={historyIndex <= 0}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm transition-all duration-200 ${
                  historyIndex <= 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed rounded-xl shadow-md"
                  : "menu-btn" 
              }`}
                title="Quay lại (Ctrl+Z)"
              >
                <FaUndo /> Quay lại
              </button>
              <button
                onClick={redoSpreadsheet}
                disabled={historyIndex >= spreadsheetHistory.length - 1}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm transition-all duration-200 ${
                  historyIndex >= spreadsheetHistory.length - 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed rounded-xl shadow-md"
                  : "menu-btn" 
              }`}
                title="Tiến tới (Ctrl+Y)"
              >
                <FaRedo /> Tiến tới
              </button>

              {/* Font Family */}
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="border p-2 rounded-lg bg-white shadow-sm hover:bg-gray-50"
              >
                <option value="Verdana">Verdana</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
              </select>

              {/* Font Size */}
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="border p-2 rounded-lg bg-white shadow-sm hover:bg-gray-50"
              >
                <option value="10pt">10pt</option>
                <option value="12pt">12pt</option>
                <option value="14pt">14pt</option>
                <option value="16pt">16pt</option>
                <option value="18pt">18pt</option>
              </select>

              {/* Bold and Italic */}
              <button
                onClick={() =>
                  setFontWeight(fontWeight === "bold" ? "normal" : "bold")
                }
                className={`border p-2 rounded-lg shadow-sm transition-all duration-200 ${ 
                  fontWeight === "bold"
                    ? "bg-blue-200 text-blue-800"
                    : "bg-white hover:bg-gray-50"
                }`}
                title="Đậm"
              >
                <FaBold />
              </button>
              <button
                onClick={() =>
                  setFontStyle(fontStyle === "italic" ? "normal" : "italic")
                }
                className={`border p-2 rounded-lg shadow-sm transition-all duration-200 ${
                  fontStyle === "italic"
                    ? "bg-blue-200 text-blue-800"
                    : "bg-white hover:bg-gray-50"
                }`}
                title="Nghiêng"
              >
                <FaItalic />
              </button>

              {/* Text Alignment */}
              <button
                onClick={() => setTextAlign("left")}
                className={`border p-2 rounded-lg shadow-sm transition-all duration-200 ${
                  textAlign === "left"
                    ? "bg-blue-200 text-blue-800"
                    : "bg-white hover:bg-gray-50"
                }`}
                title="Căn trái"
              >
                <FaAlignLeft />
              </button>
              <button
                onClick={() => setTextAlign("center")}
                className={`border p-2 rounded-lg shadow-sm transition-all duration-200 ${
                  textAlign === "center"
                    ? "bg-blue-200 text-blue-800"
                    : "bg-white hover:bg-gray-50"
                }`}
                title="Căn giữa"
              >
                <FaAlignCenter />
              </button>
              <button
                onClick={() => setTextAlign("right")}
                className={`border p-2 rounded-lg shadow-sm transition-all duration-200 ${
                  textAlign === "right"
                    ? "bg-blue-200 text-blue-800"
                    : "bg-white hover:bg-gray-50"
                }`}
                title="Căn phải"
              >
                <FaAlignRight />
              </button>

              {/* Text and Background Color */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1">
                  <FaFont className="text-gray-600" />
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 border rounded-lg cursor-pointer"
                    title="Màu chữ"
                  />
                </label>
                <label className="flex items-center gap-1">
                  <FaFill className="text-gray-600" />
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-8 h-8 border rounded-lg cursor-pointer"
                    title="Màu nền"
                  />
                </label>
              </div>
            </div>

            {/* Spreadsheet Table */}
            <table className="border-collapse border border-gray-300 w-full">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2 bg-gray-100 font-semibold w-12">
                    #
                  </th>
                  {spreadsheetData[0].map((_, colIndex) => (
                    <th
                      key={colIndex}
                      className="border border-gray-300 p-2 bg-gray-100 font-semibold w-24"
                    >
                      {String.fromCharCode(65 + colIndex)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {spreadsheetData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="border border-gray-300 p-2 bg-gray-100 font-semibold text-center">
                      {rowIndex + 1}
                    </td>
                    {row.map((cell, colIndex) => (
                      <td
                        key={colIndex}
                        className="border border-gray-300 p-1"
                        style={{
                          backgroundColor: backgroundColor,
                        }}
                      >
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) =>
                            updateSpreadsheetCell(rowIndex, colIndex, e.target.value)
                          }
                          className="w-full h-full border-none p-2 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
                          style={{
                            fontFamily: fontFamily,
                            fontSize: fontSize,
                            fontWeight: fontWeight,
                            fontStyle: fontStyle,
                            textAlign: textAlign,
                            color: textColor,
                            backgroundColor: "transparent",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Add Row/Column Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  const newData = [
                    ...spreadsheetData,
                    Array(spreadsheetData[0].length).fill(""),
                  ];
                  setSpreadsheetData(newData);
                  const newHistory = spreadsheetHistory.slice(0, historyIndex + 1);
                  newHistory.push(JSON.parse(JSON.stringify(newData)));
                  setSpreadsheetHistory(newHistory);
                  setHistoryIndex(newHistory.length - 1);
                }}
                className="menu-btn flex items-center gap-2 px-4 py-2 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-lg"
              >
                <FaPlus /> Thêm hàng
              </button>
              <button
                onClick={() => {
                  const newData = spreadsheetData.map((row) => [...row, ""]);
                  setSpreadsheetData(newData);
                  const newHistory = spreadsheetHistory.slice(0, historyIndex + 1);
                  newHistory.push(JSON.parse(JSON.stringify(newData)));
                  setSpreadsheetHistory(newHistory);
                  setHistoryIndex(newHistory.length - 1);
                }}
                className="menu-btn flex items-center gap-2 px-4 py-2 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-lg"
              >
                <FaPlus /> Thêm cột
              </button>
            </div>
          </div>
                  ) : currentNoteType === "voice" ? (
                    <div className="mb-4">
                      {/* Thanh công cụ định dạng giống ghi chú rich */}
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
                          onClick={() => videoInputRef.current?.click()}
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
                  
                      {/* Nút ghi âm, tải video, và tải âm thanh */}
                      <div className="flex flex-wrap gap-4 mb-4">
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className="menu-btn flex items-center gap-2 px-4 py-2 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-lg"
                        >
                          {isRecording ? <FaPause /> : <FaPlay />}
                          <span>{isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}</span>
                        </button>
                        <button
                          onClick={() => videoInputRef.current?.click()}
                          className="menu-btn flex items-center gap-2 px-4 py-2 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-lg"
                        >
                          <FaPlus /> <span>Tải video</span>
                        </button>
                        <input
                          type="file"
                          accept="video/*"
                          ref={videoInputRef}
                          onChange={handleVideoUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => audioInputRef.current?.click()}
                          className="menu-btn flex items-center gap-2 px-4 py-2 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-lg"
                        >
                          <FaPlus /> <span>Tải âm thanh</span>
                        </button>
                        <input
                          type="file"
                          accept="audio/*"
                          ref={audioInputRef}
                          onChange={handleAudioUpload}
                          className="hidden"
                        />
                      </div>
                  
                      {/* Hiệu ứng loading khi tải video */}
                      {isUploadingVideo && (
                        <div className="mb-4 flex items-center justify-center">
                          <div className="flex flex-col items-center">
                            <div className="text-4xl animate-spin">🎥</div>
                            <p className="text-gray-600 mt-2 animate-pulse">
                              Đang tải video, chờ tí nha! 😺
                            </p>
                          </div>
                        </div>
                      )}
                  
                      {/* Hiển thị video */}
                      {videoUrl && !isUploadingVideo && (
                        <div className="mb-4">
                          <p className="text-gray-700">Video:</p>
                          <video controls src={videoUrl} className="w-full max-w-md rounded-md" />
                          <button
                            onClick={() => setVideoUrl("")}
                            className="mt-2 text-red-500 hover:text-red-700"
                          >
                            Xóa video
                          </button>
                        </div>
                      )}
                  
                      {/* Hiển thị file âm thanh */}
                      {audioUrl && (
                        <div className="mb-4">
                          <p className="text-gray-700">Âm thanh:</p>
                          <audio controls src={audioUrl} className="w-full" />
                          <button
                            onClick={() => setAudioUrl("")}
                            className="mt-2 text-red-500 hover:text-red-700"
                          >
                            Xóa âm thanh
                          </button>
                        </div>
                      )}
                  
                      {/* Textarea cho nội dung văn bản (từ Speech-to-Text hoặc chỉnh sửa thủ công) */}
                      <textarea
                        ref={textAreaRef}
                        placeholder="Nội dung được chuyển từ giọng nói sẽ hiển thị ở đây..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-56 border-2 border-transparent p-4 rounded-xl transition duration-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-300"
                        style={{
                          fontFamily,
                          fontSize,
                          fontWeight,
                          fontStyle,
                          textAlign,
                          color: textColor,
                          backgroundColor,
                        }}
                      />
                    </div>
          ) : currentNoteType === "markdown" ? (
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Khung bên trái: Trình chỉnh sửa Markdown với monaco-editor */}
            <div className="border border-gray-300 rounded-xl p-4 bg-white h-56 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="border p-2 rounded-lg bg-white shadow-sm hover:bg-gray-50"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
              <Editor
                height="100%"
                language={selectedLanguage === "cpp" ? "cpp" : selectedLanguage}
                value={content}
                onChange={(value) => setContent(value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                  automaticLayout: true,
                  lineEndings: "lf",
                }}
                theme="vs-dark"
              />
            </div>

            {/* Khung bên phải: Hiển thị kết quả chạy code */}
            <div className="border border-gray-300 rounded-xl p-4 bg-gray-50 h-56 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-700">Kết quả chạy code:</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={runCode}
                    className="menu-btn px-4 py-1 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-lg"
                  >
                    Run Code
                  </button>
                  <button
                    onClick={() => setCodeOutput("")}
                    className="menu-btn px-4 py-1 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-lg bg-gray-500 hover:bg-gray-600"
                  >
                    Clear Output
                  </button>
                </div>
              </div>
              <pre className="text-gray-700 whitespace-pre-wrap">
                {codeOutput ||
                  `Chưa có kết quả. Nhập khối code ${selectedLanguage} và nhấn 'Run Code' để xem output.`}
              </pre>
            </div>
          </div>
        ) : null}

        {error && <p className="text-red-500">{error}</p>}

        <div className="flex justify-center mt-4">
          <button
            onClick={handleSaveNote}
            className="menu-btn w-full max-w-md px-4 py-3 text-xl font-bold flex justify-center rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-lg"
          >
            {editingId !== null ? "Cập nhật" : "Lưu"}
          </button>
        </div>

        <div className="mt-6 p-4 border border-gray-300 rounded-lg">
          <div className="flex justify-between mt-6 text-blue-600 items-center">
            <div className="relative" ref={filterMenuRef}>
              <button
                onClick={() => setFilterMenuVisible(!filterMenuVisible)}
                className="menu-btn flex items-center gap-2 px-4 py-2 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-lg"
              >
                <FaBars />{" "}
                <span>
                  Phân loại:{" "}
                  {filterType === "all"
                    ? "Tất cả"
                    : filterType === "plain"
                    ? "Văn bản thuần"
                    : filterType === "rich"
                    ? "Văn bản phong phú"
                    : filterType === "whiteboard"
                    ? "Danh sách công việc"
                    : filterType === "spreadsheet"
                    ? "Bảng tính"
                    : "Chọn lọc"}
                </span>
              </button>
              {filterMenuVisible && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-10 menu-dropdown transition-all duration-200 ease-in-out">
                  <button
                    className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                    onClick={() => {
                      setFilterType("all");
                      setFilterMenuVisible(false);
                    }}
                  >
                    📑 Tất cả
                  </button>
                  <button
                    className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                    onClick={() => {
                      setFilterType("selective");
                      setVisibleNoteTypes({
                        plain: true,
                        rich: true,
                        whiteboard: true,
                        spreadsheet: true,
                      });
                      setFilterMenuVisible(false);
                    }}
                  >
                    🔍 Chọn lọc
                  </button>
                  <button
                    className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                    onClick={() => {
                      setFilterType("plain");
                      setFilterMenuVisible(false);
                    }}
                  >
                    📝 Ghi chú văn bản thuần
                  </button>
                  <button
                    className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                    onClick={() => {
                      setFilterType("rich");
                      setFilterMenuVisible(false);
                    }}
                  >
                    🖋 Ghi chú văn bản phong phú
                  </button>
                  <button
                    className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                    onClick={() => {
                      setFilterType("whiteboard");
                      setFilterMenuVisible(false);
                    }}
                  >
                    🎨 Ghi chú danh sách công việc
                  </button>
                  <button
                    className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                    onClick={() => {
                      setFilterType("spreadsheet");
                      setFilterMenuVisible(false);
                    }}
                  >
                    📊 Ghi chú bảng tính
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {filterType === "selective" && (
                <div className="flex gap-2">
                  {visibleNoteTypes.plain && (
                    <div className="relative bg-blue-100 px-3 py-1 rounded-full">
                      Văn bản thuần
                      <button
                        onClick={() => toggleNoteTypeVisibility("plain")}
                        className="absolute top-0 right-0 text-red-500 hover:text-red-700"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  )}
                  {visibleNoteTypes.rich && (
                    <div className="relative bg-blue-100 px-3 py-1 rounded-full">
                      Văn bản phong phú
                      <button
                        onClick={() => toggleNoteTypeVisibility("rich")}
                        className="absolute top-0 right-0 text-red-500 hover:text-red-700"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  )}
                  {visibleNoteTypes.whiteboard && (
                    <div className="relative bg-blue-100 px-3 py-1 rounded-full">
                      Danh sách công việc
                      <button
                        onClick={() => toggleNoteTypeVisibility("whiteboard")}
                        className="absolute top-0 right-0 text-red-500 hover:text-red-700"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  )}
                  {visibleNoteTypes.spreadsheet && (
                    <div className="relative bg-blue-100 px-3 py-1 rounded-full">
                      Bảng tính
                      <button
                        onClick={() => toggleNoteTypeVisibility("spreadsheet")}
                        className="absolute top-0 right-0 text-red-500 hover:text-red-700"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  )}
                </div>
              )}
              {searchVisible && (
                <input
                  type="text"
                  placeholder="Tìm kiếm ghi chú..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 border-2 border-gray-300 p-2 pl-4 rounded-xl transition-all duration-300 ease-in-out transform focus:border-blue-400 focus:ring-2 focus:ring-blue-300 shadow-md hover:shadow-lg animate-slide-in"
                />
              )}
              <button
                onClick={() => setSearchVisible(!searchVisible)}
                className="text-blue-600 text-xl hover:text-blue-800 transition duration-200"
                title="Tìm kiếm ghi chú"
              >
                <FaSearch />
              </button>
              <div className="relative" ref={sortMenuRef}>
                <button
                  onClick={() => setSortMenuVisible(!sortMenuVisible)}
                  className="text-blue-600 text-xl hover:text-blue-800 transition duration-200"
                  title="Sắp xếp ghi chú"
                >
                  <FaBars />
                </button>
                {sortMenuVisible && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-10 menu-dropdown transition-all duration-200 ease-in-out">
                    <button
                      className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                      onClick={() => {
                        setSortBy("title");
                        setSortMenuVisible(false);
                      }}
                    >
                      ↕ Sắp xếp theo tiêu đề
                    </button>
                    <button
                      className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                      onClick={() => {
                        setSortBy("updated_at");
                        setSortMenuVisible(false);
                      }}
                    >
                      ↕ Sắp xếp theo ngày cập nhật
                    </button>
                  </div>
                )}
              </div>
            </div>
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
        <strong className="text-purple-600 text-lg">{note.title}</strong>
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
                          i === index ? { ...t, completed: !t.completed } : t
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
                        todo.completed ? "line-through text-gray-500" : ""
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
                              const updatedTodos = note.todos.map((t, i) =>
                                i === index ? { ...t, reminder: null } : t
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
                    {note.spreadsheet_data.slice(0, 3).map((row, rowIndex) => (
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
            ) : note.note_type === "voice" ? (
              <div>
                {note.content && <p className="text-gray-700">{note.content}</p>}
                {note.voice_url && (
                  <div className="mt-2">
                    <p className="text-gray-700">Bản ghi âm:</p>
                    <audio controls src={note.voice_url} className="w-full" />
                  </div>
                )}
                {note.video_url && (
                  <div className="mt-2">
                    <p className="text-gray-700">Video:</p>
                    <video
                      controls
                      src={note.video_url}
                      className="w-full max-w-md rounded-md"
                    />
                  </div>
                )}
                {note.audio_url && (
                  <div className="mt-2">
                    <p className="text-gray-700">Âm thanh:</p>
                    <audio controls src={note.audio_url} className="w-full" />
                  </div>
                )}
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
              onClick={() => handlePinNote(note.id)}
              className={`text-xl transition duration-200 ${
                note.isPinned
                  ? "text-yellow-500 hover:text-yellow-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title={note.isPinned ? "Bỏ ghim" : "Ghim ghi chú"}
            >
              <FaThumbtack />
            </button>
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
      <p className="text-gray-500 mt-3">Không tìm thấy ghi chú nào.</p>
    )}
            </ul>
          </div>
        </div>

        <style jsx>{`
          .menu-btn {
            background: linear-gradient(135deg, #6aa8ff, #b57edc);
            color: white;
            font-size: 16px;
            font-weight: 500;
            border: none;
            outline: none;
            cursor: pointer;
          }
          .menu-btn:hover {
            background: linear-gradient(135deg, #b57edc, #6aa8ff);
            transform: scale(1.05);
          }
          .menu-dropdown {
            opacity: 1;
            transform: translateY(0);
          }
        .dropdown-item {
          background: none;
          border: none;
          color: #333;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease-in-out;
          position: relative;
        }

        .dropdown-item:hover {
          background: linear-gradient(
            to right,
            #e8e1ff,
            #d6eaff
          ); /* Gradient từ tím nhạt sang xanh nhạt */
          color: #6aa8ff; /* Màu chữ khi hover */
          box-shadow: 0 6px 12px rgba(106, 168, 255, 0.3); /* Bóng đổ với màu xanh nhạt */
          transform: translateY(-3px) scale(1.02); /* Nâng lên và phóng to nhẹ */
          animation: bounce 0.4s ease infinite alternate; /* Hiệu ứng nảy nhẹ */
        }

        /* Hiệu ứng nảy sinh động */
        @keyframes bounce {
          0% {
            transform: translateY(-3px) scale(1.02);
          }
          100% {
            transform: translateY(-5px) scale(1.02);
          }
        }
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .dropdown-item:hover {
            color: #2563eb;
          }
          .animate-slide-in {
            animation: slideIn 0.3s ease-in-out;
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default NoteApp;


