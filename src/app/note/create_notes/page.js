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
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import Editor from "@monaco-editor/react"; 
import axios from 'axios';
import CryptoJS from "crypto-js";
import ThemeSettings from "../../components/ThemeSettings"; 
import Dexie from 'dexie';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState(null);
  
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
  const [isUploadingAudio, setIsUploadingAudio] = useState(false); // Trạng thái loading âm thanh
  const [audioFileName, setAudioFileName] = useState(""); // Lưu tên file âm thanh
  const [isUploadingVideo, setIsUploadingVideo] = useState(false); // Trạng thái loading video
  const [videoFileName, setVideoFileName] = useState(""); // Lưu tên file video
  const mediaRecorderRef = useRef(null);
  const audioInputRef = useRef(null); // Ref cho input file âm thanh
  const recognitionRef = useRef(null); 

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
  const [isOffline, setIsOffline] = useState(false);// Thêm state và logic ngoại tuyến
  const [pendingActions, setPendingActions] = useState([]);
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
  
  // Thêm hàm generateLocalId tại đây
  const generateLocalId = async () => {
    const lastNote = await db.notes.orderBy('id').last();
    const lastId = lastNote ? lastNote.id : 0;
    return lastId < 0 ? lastId - 1 : -1; // Tạo ID âm tăng dần
  };
  
  useEffect(() => {
    fetchNotes();
  }, []);

  //Thêm useEffect để theo dõi trạng thái mạng
  useEffect(() => {
    // Khởi tạo trạng thái ngoại tuyến
    setIsOffline(!navigator.onLine);
  
    // Theo dõi trạng thái mạng
    const handleOnline = async () => {
      setIsOffline(false);
      await syncPendingActions();
    };
    const handleOffline = () => setIsOffline(true);
  
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkMicrophonePermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({ name: "microphone" });
        if (permissionStatus.state === "denied") {
          setError("Quyền truy cập micro bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt.");
          return false;
        }
        return true;
      } catch (err) {
        setError("Không thể kiểm tra quyền micro: " + err.message);
        return false;
      }
    };
  
    // Lấy ghi chú từ IndexedDB khi khởi động
    const initOfflineNotes = async () => {
      try {
        const offlineNotes = await db.notes.toArray();
        if (offlineNotes.length > 0) {
          setNotes(
            offlineNotes.map(note => {
              let parsedTodos = [];
              let parsedSpreadsheetData = Array(10).fill().map(() => Array(10).fill(""));
  
              // Xử lý parse todos
              if (note.todos && typeof note.todos === 'string') {
                try {
                  parsedTodos = JSON.parse(note.todos);
                  if (!Array.isArray(parsedTodos)) parsedTodos = [];
                } catch (e) {
                  console.error(`Lỗi khi parse todos cho note ${note.id}:`, e);
                  parsedTodos = [];
                }
              }
  
              // Xử lý parse spreadsheet_data
              if (note.spreadsheet_data && typeof note.spreadsheet_data === 'string') {
                try {
                  parsedSpreadsheetData = JSON.parse(note.spreadsheet_data);
                  if (!Array.isArray(parsedSpreadsheetData)) {
                    parsedSpreadsheetData = Array(10).fill().map(() => Array(10).fill(""));
                  }
                } catch (e) {
                  console.error(`Lỗi khi parse spreadsheet_data cho note ${note.id}:`, e);
                  parsedSpreadsheetData = Array(10).fill().map(() => Array(10).fill(""));
                }
              }
  
              return {
                ...note,
                todos: parsedTodos,
                spreadsheet_data: parsedSpreadsheetData,
                isPinned: note.isPinned || false,
                audio_url: note.audio_url || "",
                video_url: note.video_url || "",
              };
            })
          );
        } else {
          fetchNotes();
        }
      } catch (err) {
        console.error('Lỗi khi lấy ghi chú từ IndexedDB:', err);
        setError('Không thể tải ghi chú cục bộ: ' + err.message);
      }
    };
  
    initOfflineNotes();
  
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Hàm đồng bộ hóa các hành động đang chờ
  const syncPendingActions = async () => {
    try {
      const actions = await db.pendingActions.toArray();
      for (const action of actions) {
        const { action: syncAction, noteId, data } = action;
        if (syncAction === 'create') {
          const { error } = await supabase2.from('notess').insert([data]).select().single();
          if (error) throw error;
          await db.notes.delete(noteId); // Xóa ghi chú tạm thời
        } else if (syncAction === 'update') {
          const { error } = await supabase2.from('notess').update(data).eq('id', noteId);
          if (error) throw error;
        } else if (syncAction === 'delete') {
          const { error } = await supabase2.from('notess').delete().eq('id', noteId);
          if (error) throw error;
        }
        await db.pendingActions.delete(action.id); // Xóa hành động đã đồng bộ
      }
      setPendingActions([]);
      await fetchNotes(); // Cập nhật danh sách ghi chú
    } catch (err) {
      console.error('Lỗi đồng bộ hóa:', err);
      setError('Không thể đồng bộ hóa dữ liệu: ' + err.message);
    }
  };

  const db = new Dexie('NotesDB');
  
      // Khởi tạo IndexedDB với Dexie
      db.version(2).stores({
        notes: '++id,title,content,image_url,created_at,updated_at,category_id,font_style,font_size,font_weight,note_type,font_family,text_align,text_color,background_color,todos,spreadsheet_data,classification,audio_url,audio_file_name,video_url,video_file_name,isPending,syncAction,is_pinned',
        pendingActions: '++id,action,noteId,data',
      });

      // Xử lý kéo thả
    const handleDragStart = (e, index) => {
      e.dataTransfer.setData("index", index);
      e.currentTarget.classList.add("dragging");
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e, dropIndex) => {
      e.preventDefault();
      const dragIndex = e.dataTransfer.getData("index");
      const newTodos = [...todos];
      const [draggedTodo] = newTodos.splice(dragIndex, 1);
      newTodos.splice(dropIndex, 0, draggedTodo);
      setTodos(newTodos);
      document.querySelectorAll(".dragging").forEach((el) => el.classList.remove("dragging"));
    };

    // Xử lý chỉnh sửa công việc
    const handleEditTodo = (index) => {
      const todo = todos[index];
      setContent(todo.text);
      setReminderTime(todo.reminder || "");
      setTodos(todos.filter((_, i) => i !== index)); // Xóa tạm thời công việc để chỉnh sửa
    };

    // Xử lý xóa công việc
    const handleDeleteTodo = (index) => {
      if (confirm("Bạn có chắc muốn xóa công việc này không?")) {
        setTodos(todos.filter((_, i) => i !== index));
      }
    };
    
      // Phát triển thêm phần ghi âm chuyển thể thành văn bản
      useEffect(() => {
        if (typeof window === "undefined") return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          setError("Trình duyệt không hỗ trợ SpeechRecognition. Vui lòng sử dụng Edge hoặc Chrome.");
          return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = "vi-VN"; // Hoặc "en-US" tùy thuộc vào ngôn ngữ
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript + " ";
            }
          }
          console.log("Transcribed:", transcript);
          if (transcript) {
            setContent((prev) => prev + transcript.trim() + " ");
          }
        };

        recognition.onstart = () => {
          console.log("SpeechRecognition started");
          setError("");
        };

        recognition.onend = () => {
          console.log("SpeechRecognition onend triggered");
          if (isRecordingRef.current) {
            try {
              recognition.start();
              console.log("SpeechRecognition restarted");
            } catch (err) {
              setError("Không thể khởi động lại SpeechRecognition: " + err.message);
              stopRecording();
            }
          } else {
            console.log("SpeechRecognition stopped");
          }
        };

        recognition.onerror = (event) => {
          console.error("SpeechRecognition error:", event.error);
          let errorMessage = "Lỗi Speech-to-Text: ";
          switch (event.error) {
            case "no-speech":
              errorMessage += "Không phát hiện giọng nói. Vui lòng nói to và rõ.";
              break;
            case "audio-capture":
              errorMessage += "Không thể truy cập micro. Vui lòng kiểm tra quyền micro.";
              break;
            case "not-allowed":
              errorMessage += "Quyền truy cập micro bị từ chối.";
              break;
            case "network":
              errorMessage += "Lỗi mạng. Vui lòng kiểm tra kết nối internet.";
              break;
            default:
              errorMessage += event.error;
          }
          setError(errorMessage);
          stopRecording();
        };

        return () => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
          }
        };
      }, []); 

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
    // Lấy user_id từ localStorage
    const userData = localStorage.getItem("user");
    let user_id = null;
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        user_id = parsedUser.id; // Giả sử id là UUID của người dùng
      } catch (err) {
        console.error("Lỗi khi parse dữ liệu user từ localStorage:", err);
        setError("Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.");
        return;
      }
    } else {
      setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập.");
      return;
    }
  
    if (isOffline) {
      try {
        // Lấy ghi chú từ IndexedDB, lọc theo user_id
        const offlineNotes = await db.notes.where('user_id').equals(user_id).toArray();
        setNotes(
          offlineNotes.map(note => {
            let parsedTodos = [];
            let parsedSpreadsheetData = Array(10).fill().map(() => Array(10).fill(""));
  
            if (note.todos && typeof note.todos === 'string') {
              try {
                parsedTodos = JSON.parse(note.todos);
                if (!Array.isArray(parsedTodos)) parsedTodos = [];
              } catch (e) {
                console.error(`Lỗi khi parse todos cho note ${note.id}:`, e);
                parsedTodos = [];
              }
            }
  
            if (note.spreadsheet_data && typeof note.spreadsheet_data === 'string') {
              try {
                parsedSpreadsheetData = JSON.parse(note.spreadsheet_data);
                if (!Array.isArray(parsedSpreadsheetData)) {
                  parsedSpreadsheetData = Array(10).fill().map(() => Array(10).fill(""));
                }
              } catch (e) {
                console.error(`Lỗi khi parse spreadsheet_data cho note ${note.id}:`, e);
                parsedSpreadsheetData = Array(10).fill().map(() => Array(10).fill(""));
              }
            }
  
            return {
              ...note,
              todos: parsedTodos,
              spreadsheet_data: parsedSpreadsheetData,
              isPinned: note.isPinned || false,
              audio_url: note.audio_url || "",
              audio_file_name: note.audio_file_name || "",
              video_url: note.video_url || "",
              video_file_name: note.video_file_name || "",
            };
          }) || []
        );
      } catch (err) {
        console.error('Lỗi khi lấy ghi chú từ IndexedDB:', err);
        setError('Không thể tải ghi chú cục bộ: ' + err.message);
      }
      return;
    }
  
    try {
      // Truy vấn Supabase, để lọc theo user_id
      const { data, error } = await supabase2
        .from("notess")
        .select(
          "id, user_id, title, content, image_url, created_at, updated_at, category_id, font_style, font_size, font_weight, note_type, font_family, text_align, text_color, background_color, todos, spreadsheet_data, classification, audio_url, audio_file_name, video_url, video_file_name, is_pinned"
        )
        .eq("user_id", user_id)
        .order("updated_at", { ascending: false });
        
      if (error) {
        console.error("Chi tiết lỗi Supabase:", error);
        throw new Error(`Lỗi Supabase: ${error.message || "Lỗi không xác định"}`);
      }
  
      const parsedNotes = data.map((note) => {
        let parsedTodos = [];
        let parsedSpreadsheetData = Array(10)
          .fill()
          .map(() => Array(10).fill(""));
  
        if (note.todos && typeof note.todos === 'string') {
          try {
            parsedTodos = JSON.parse(note.todos);
            if (!Array.isArray(parsedTodos)) parsedTodos = [];
          } catch (e) {
            console.error(`Lỗi khi parse todos cho note ${note.id}:`, e);
            parsedTodos = [];
          }
        }
  
        if (note.spreadsheet_data && typeof note.spreadsheet_data === 'string') {
          try {
            parsedSpreadsheetData = JSON.parse(note.spreadsheet_data);
            if (!Array.isArray(parsedSpreadsheetData)) {
              parsedSpreadsheetData = Array(10).fill().map(() => Array(10).fill(""));
            }
          } catch (e) {
            console.error(`Lỗi khi parse spreadsheet_data cho note ${note.id}:`, e);
            parsedSpreadsheetData = Array(10).fill().map(() => Array(10).fill(""));
          }
        }
  
        return {
          ...note,
          todos: parsedTodos,
          spreadsheet_data: parsedSpreadsheetData,
          is_pinned: note.is_pinned || false, 
          audio_url: note.audio_url || "",
          audio_file_name: note.audio_file_name || "",
          video_url: note.video_url || "",
          video_file_name: note.video_file_name || "",
        };
      }) || [];
  
      setNotes(parsedNotes);
  
      // Cập nhật IndexedDB
      await db.notes.clear();
      await db.notes.bulkPut(parsedNotes);
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

    // Lấy thông tin người dùng từ localStorage
    const userData = localStorage.getItem("user");
    let user_id = null;
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        user_id = parsedUser.id; // Lấy user_id (UUID) từ localStorage
      } catch (err) {
        console.error("Lỗi khi parse dữ liệu user từ localStorage:", err);
        setError("Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.");
        return;
      }
    } else {
      setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập.");
      return;
    }

    const noteData = {
      user_id: user_id,
      title: title.trim(),
      content: content.trim(),
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      note_type: currentNoteType,
      font_style: fontStyle,
      font_size: fontSize,
      font_weight: fontWeight,
      font_family: fontFamily,
      text_align: textAlign,
      text_color: textColor,
      background_color: backgroundColor,
      todos: currentNoteType === "whiteboard" ? JSON.stringify(todos || []) : null,
      spreadsheet_data:
        currentNoteType === "spreadsheet"
          ? JSON.stringify(spreadsheetData || Array(10).fill().map(() => Array(10).fill("")))
          : null,
      classification,
      category_id: categoryMap[category] || 1,
      audio_url: audioUrl || null,
      audio_file_name: audioFileName || null,
      video_url: videoUrl || null,
      video_file_name: videoFileName || null,
      is_pinned: editingId !== null ? notes.find((note) => note.id === editingId)?.is_pinned || false : false,
    };
  
      if (isOffline) {
        // Sử dụng generateLocalId thay vì random
        const localId = editingId !== null ? editingId : await generateLocalId();
        await db.notes.put({
          ...noteData,
          id: localId,
          isPending: true,
          syncAction: editingId !== null ? 'update' : 'create',
        });
        await db.pendingActions.put({
          action: editingId !== null ? 'update' : 'create',
          noteId: localId,
          data: noteData,
        });
        setNotes((prev) => {
          const updatedNotes = editingId !== null
            ? prev.map((note) =>
                note.id === editingId
                  ? {
                      ...note,
                      ...noteData,
                      todos: noteData.todos ? JSON.parse(noteData.todos) : [],
                      spreadsheet_data: noteData.spreadsheet_data
                        ? JSON.parse(noteData.spreadsheet_data)
                        : Array(10)
                            .fill()
                            .map(() => Array(10).fill("")),
                    }
                  : note
              )
            : [
                {
                  ...noteData,
                  id: localId,
                  isPinned: false,
                  todos: noteData.todos ? JSON.parse(noteData.todos) : [],
                  spreadsheet_data: noteData.spreadsheet_data
                    ? JSON.parse(noteData.spreadsheet_data)
                    : Array(10)
                        .fill()
                        .map(() => Array(10).fill("")),
                },
                ...prev,
              ];
          return updatedNotes;
        });
        resetForm();
        setError('Ghi chú đã được lưu cục bộ. Sẽ đồng bộ khi có mạng.');
        return;
      }
  
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
        await db.notes.put({ ...data, todos: data.todos ? JSON.stringify(data.todos) : null, spreadsheet_data: data.spreadsheet_data ? JSON.stringify(data.spreadsheet_data) : null });
      } else {
        const { data, error } = await supabase2
          .from("notess")
          .insert([noteData])
          .select()
          .single();
        if (error) throw error;
        setNotes([{ ...data, isPinned: false }, ...notes]);
        await db.notes.put({ ...data, todos: data.todos ? JSON.stringify(data.todos) : null, spreadsheet_data: data.spreadsheet_data ? JSON.stringify(data.spreadsheet_data) : null });
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
      if (isOffline) {
        await db.notes.delete(noteId);
        await db.pendingActions.put({
          action: 'delete',
          noteId,
          data: null,
        });
        setNotes(notes.filter((note) => note.id !== noteId));
        setError('Ghi chú đã được xóa cục bộ. Sẽ đồng bộ khi có mạng.');
        return;
      }

      const { error } = await supabase2
        .from("notess")
        .delete()
        .eq("id", noteId);
      if (error) throw error;
      setNotes(notes.filter((note) => note.id !== noteId));
      await db.notes.delete(noteId);
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
    setEditingId(note.id);
    setCurrentNoteType(note.note_type || "rich");
    setFontFamily(note.font_family || "Verdana");
    setFontSize(note.font_size || "14pt");
    setFontWeight(note.font_weight || "normal");
    setFontStyle(note.font_style || "normal");
    setTextAlign(note.text_align || "left");
    setTextColor(note.text_color || "#000000");
    setBackgroundColor(note.background_color || "#ffffff");
    setUploadedImages(note.image_url ? [note.image_url] : []);
    setVoiceUrl(note.voice_url || "");
    setVideoUrl(note.video_url || "");
    setVideoFileName(note.video_file_name || "");
    setAudioUrl(note.audio_url || "");
    setAudioFileName(note.audio_file_name || "");
  
    // Xử lý danh sách công việc (whiteboard)
    if (note.note_type === "whiteboard") {
      let parsedTodos = [];
      if (note.todos) {
        try {
          parsedTodos = typeof note.todos === 'string' ? JSON.parse(note.todos) : note.todos;
          if (!Array.isArray(parsedTodos)) {
            parsedTodos = [];
            console.warn(`Todos for note ${note.id} is not an array`);
          }
        } catch (e) {
          console.error(`Lỗi khi parse todos cho note ${note.id}:`, e);
          parsedTodos = [];
        }
      }
      setTodos(parsedTodos);
      // Hiển thị todos trong textarea dưới dạng Markdown
      const todoText = parsedTodos
        .map((todo) => `- [${todo.completed ? 'x' : ' '}] ${todo.text}${todo.reminder ? ` (Nhắc nhở: ${todo.reminder})` : ''}`)
        .join('\n');
      setContent(todoText);
  
    // Xử lý bảng tính (spreadsheet)
    } else if (note.note_type === "spreadsheet") {
      let parsedSpreadsheetData = Array(10).fill().map(() => Array(10).fill(""));
      if (note.spreadsheet_data) {
        try {
          parsedSpreadsheetData = typeof note.spreadsheet_data === 'string' 
            ? JSON.parse(note.spreadsheet_data) 
            : note.spreadsheet_data;
          if (!Array.isArray(parsedSpreadsheetData) || !parsedSpreadsheetData.every(row => Array.isArray(row))) {
            parsedSpreadsheetData = Array(10).fill().map(() => Array(10).fill(""));
            console.warn(`Spreadsheet data for note ${note.id} is not a valid 2D array`);
          }
        } catch (e) {
          console.error(`Lỗi khi parse spreadsheet_data cho note ${note.id}:`, e);
          parsedSpreadsheetData = Array(10).fill().map(() => Array(10).fill(""));
        }
      }
      setSpreadsheetData(parsedSpreadsheetData);
      setSpreadsheetHistory([JSON.parse(JSON.stringify(parsedSpreadsheetData))]);
      setHistoryIndex(0);
      // Hiển thị spreadsheet_data trong textarea dưới dạng văn bản
      const spreadsheetText = parsedSpreadsheetData.map(row => row.join('\t')).join('\n');
      setContent(spreadsheetText);
  
    } else {
      // Các loại ghi chú khác (plain, rich, markdown, voice)
      setContent(note.content || "");
      setTodos([]);
      setSpreadsheetData(Array(10).fill().map(() => Array(10).fill("")));
      setSpreadsheetHistory([]);
      setHistoryIndex(-1);
    }
  
    const reverseCategoryMap = {
      1: "Personal",
      2: "Study",
      3: "Entertainment",
      4: "Upload",
    };
    setCategory(reverseCategoryMap[note.category_id] || "Personal");
  
    setImageUploadVisible(
      note.note_type !== "plain" &&
      note.note_type !== "markdown" &&
      note.note_type !== "voice"
    );
  
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
      setAudioFileName(""); // Xóa tên file âm thanh
      setVideoFileName(""); // Xóa tên file video
      setIsUploadingVideo(false);
      setIsUploadingAudio(false); // Đảm bảo reset trạng thái loading âm thanh
      setVoicePublicId("");
    };

    const handleExportNotes = () => {
      if (!title.trim()) {
        setError("Vui lòng nhập tiêu đề trước khi xuất.");
        return;
      }
    
      let contentStr = "";
      if (currentNoteType === "whiteboard" && todos.length > 0) {
        contentStr = todos
          .map(
            (t) =>
              `${t.completed ? "[x]" : "[ ]"} ${t.text} ${
                t.reminder ? `(Nhắc nhở: ${t.reminder})` : ""
              }`
          )
          .join("\n");
      } else if (currentNoteType === "spreadsheet" && spreadsheetData.length > 0) {
        contentStr = spreadsheetData.map((row) => row.join("\t")).join("\n");
      } else if (currentNoteType === "markdown" || currentNoteType === "rich" || currentNoteType === "plain" || currentNoteType === "voice") {
        if (!content.trim() && !videoUrl && !audioUrl) {
          setError("Vui lòng nhập nội dung, video hoặc âm thanh trước khi xuất.");
          return;
        }
        contentStr = content;
        if (videoUrl) {
          contentStr += `\nVideo URL: ${videoUrl}`;
        }
        if (audioUrl) {
          contentStr += `\nAudio URL: ${audioUrl}`;
        }
      }
    
      const text = `Tiêu đề: ${title}\nNội dung: ${contentStr}\nNgày cập nhật: ${new Date().toLocaleString()}`;
      const blob = new Blob([text], { type: "text/plain" });
      const link = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = link;
      a.download = `${title || "ghi-chu"}.txt`;
      a.click();
      URL.revokeObjectURL(link); // Giải phóng URL
      setExtraMenuVisible(false);
      setError("");
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
      if (
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
        setError("Chỉ hỗ trợ tệp Word (.docx)");
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

  // hàm xóa ghi âm "lỗi"
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

  const handlePinNote = async (noteId) => {
    try {
      const note = notes.find((note) => note.id === noteId);
      if (!note) return;
  
      const newPinnedState = !note.is_pinned; // Sử dụng is_pinned từ dữ liệu
  
      if (isOffline) {
        // Lưu vào IndexedDB khi ngoại tuyến
        await db.notes.update(noteId, { is_pinned: newPinnedState });
        await db.pendingActions.put({
          action: 'update',
          noteId,
          data: { is_pinned: newPinnedState },
        });
        setNotes(
          notes.map((note) =>
            note.id === noteId ? { ...note, is_pinned: newPinnedState } : note
          )
        );
        setError('Trạng thái ghim đã được lưu cục bộ. Sẽ đồng bộ khi có mạng.');
        return;
      }
  
      // Cập nhật trên Supabase
      const { error } = await supabase2
        .from('notess')
        .update({ is_pinned: newPinnedState })
        .eq('id', noteId);
  
      if (error) throw error;
  
      // Cập nhật IndexedDB
      await db.notes.update(noteId, { is_pinned: newPinnedState });
  
      // Cập nhật state
      setNotes(
        notes.map((note) =>
          note.id === noteId ? { ...note, is_pinned: newPinnedState } : note
        )
      );
      setError('');
    } catch (err) {
      console.error('Error pinning note:', err);
      setError('Không thể thay đổi trạng thái ghim: ' + err.message);
    }
  };

  const toggleNoteTypeVisibility = (type) => {
    setVisibleNoteTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const sortedNotes = [...notes]
  .filter((note) => {
    if (filterType === "all") return true;
    if (filterType === "selective")
      return visibleNoteTypes[note.note_type] || false;
    return note.note_type === filterType;
  })
  .filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  )
  .sort((a, b) => {
    // Ưu tiên loại ghi chú được chọn
    if (currentNoteType !== "all") {
      if (a.note_type === currentNoteType && b.note_type !== currentNoteType)
        return -1;
      if (b.note_type === currentNoteType && a.note_type !== currentNoteType)
        return 1;
    }
    // Sau đó ưu tiên ghi chú được ghim
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    // Tiếp theo sắp xếp theo tiêu chí sortBy
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    } else {
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    }
  });
  
  const emojiList = [
    "😃", "😄", "😊", "😂", "🤗", "😜", "😎", "😍", "🥰", "😘", 
    "😇", "🥳", "🥲", "😢", "😭", "😡", "😤", "😱", "😳", "🥱",
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
    { name: "1. Âm thanh của nỗi nhớ anh", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1743345471/AmThanhCuaNoiNhoAnh-VK-6817533_r5gro0.mp3" },
    { name: "2. Bất công", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1745375496/BatCong-TranTuTinh-6962563_iqytb7.mp3"},
    { name: "3. Chấp mê bất ngộ", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1745374132/ChapMeBatNgo-VuongNhiLang-7519346_jyfe2a.mp3"},
    { name: "4. Câu Chuyện Nếu Như", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1743346199/CauChuyenNeuNhu-Superluckyqi-5991519_q3a4ns.mp3" },
    { name: "5. Nếu tình yêu đã lãng quên", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1745375063/qqrnzgok2q_i0bbh2.mp3"},
    { name: "6. Trạm khí tượng", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1745374818/TramKhiTuong-Uu-7005868_o8zuwp.mp3"},
    { name: "7. Thôi hãy quên đi", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1745375267/ThoiHayQuenDi-1K-7220980_mjg5mw.mp3"},
    { name: "8. Trang giấy cuối cùng", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1745376051/TrangGiayCuoiCung-YCCCC-7513473_xlqrkv.mp3"},
    { name: "9. Giày cao gót màu đỏ", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1745374688/GiayCaoGotMauDo-ChuLoi-5750670_wstchg.mp3" },
    { name: "10. Thanh trừ", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1745376187/ThanhTru-VuongHanThanAmandaToTinhTiep-6932215_sysstg.mp3"},
    { name: "11. Ngu hề thán", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1745377421/NguHeThanDJThamNiemRemix-VanNhanThinhThuYiXiaoJiangHu-6758883_u6t9xi.mp3"},
    { name: "12. Ngấm lạnh", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1745376411/NgamLanh-TuyetNhiXueEr-6897488_va6kyj.mp3"},
    { name: "13. sau khi anh đi", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1745377091/SauKhiAnhDiCover-LuLuMauImLang-6651494_zhvsvt.mp3"},
    { name: "14. Quên rồi", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1745376782/QuenRoi-ChuLamPhong-8853506_f3dcha.mp3"},
    { name: "15. không thán hề", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1745377259/KhongThanHe-NgaoThatGiaAoQiYe-7008255_muukkq.mp3"},
    { name: "16. Tứ ngã", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1745486436/TungaBanChoTa-NhatChiBachDuongYiZhiBaiYang-8291706_cklfkp.mp3"},
    { name: "17. Tiếng trăng rơi", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1745486710/TiengTrangRoi-HuaLamTamXuLanXin-8019659_nshajo.mp3"},
    { name: "1. Sự nghiệp chướng", url: "https://res.cloudinary.com/dszqh3qcx/video/upload/v1743345196/htptrtnfix_gvyo3k.mp3"},
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
      const selectedBlock = codeBlocks.find(
        (block) => block.language === selectedLanguage
      ) || codeBlocks[codeBlocks.length - 1];
      codeToRun = selectedBlock.code;
      language = selectedBlock.language;
    } else {
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
      // Chạy JavaScript cục bộ (phần markdown)
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
          const hasPermission = await checkMicrophonePermission();
          if (!hasPermission) return;

          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            const chunks = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
              if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorderRef.current.onstop = async () => {
              const blob = new Blob(chunks, { type: "audio/webm" });
              setVoiceBlob(blob);
              setVoiceUrl(URL.createObjectURL(blob));
              stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);

            // Khởi động SpeechRecognition
            if (recognitionRef.current) {
              recognitionRef.current.start();
            }
            setError("");
          } catch (err) {
            setError("Không thể truy cập micro: " + err.message);
            console.error("Start recording error:", err);
          }
        };

        const stopRecording = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
          }
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
          setIsRecording(false);
        };

      // theo dõi trạng thái 
      const isRecordingRef = useRef(isRecording);
        useEffect(() => {
          isRecordingRef.current = isRecording;
        }, [isRecording]);
      // di chuyển kiểm tea quyền micro vào một hành riêng và gọi nó khi component mount khi cần
      const checkMicrophonePermission = async () => {
        try {
          const permissionStatus = await navigator.permissions.query({ name: "microphone" });
          if (permissionStatus.state === "denied") {
            setError("Quyền truy cập micro bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt.");
            return false;
          }
          return true;
        } catch (err) {
          setError("Không thể kiểm tra quyền micro: " + err.message);
          return false;
        }
      };

      useEffect(() => {
        fetchNotes();
        checkMicrophonePermission(); // Kiểm tra quyền khi component mount

        const handleOnline = async () => {
          setIsOffline(false);
          await syncPendingActions();
        };
        const handleOffline = () => setIsOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        const initOfflineNotes = async () => {
          try {
            const offlineNotes = await db.notes.toArray();
            // ... (giữ nguyên logic hiện có)
          } catch (err) {
            setError("Không thể tải ghi chú cục bộ: " + err.message);
          }
        };

        initOfflineNotes();

        return () => {
          window.removeEventListener("online", handleOnline);
          window.removeEventListener("offline", handleOffline);
        };
      }, []);


      // tải âm thanh lên 
      const handleAudioUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          if (file.size > 50 * 1024 * 1024) {
            throw new Error("File âm thanh quá lớn. Vui lòng chọn file nhỏ hơn 50MB");
          }
          setIsUploadingAudio(true); // Bật trạng thái loading
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
          setAudioFileName(file.name); // Lưu tên file âm thanh
          setError("");
        } catch (err) {
          setError("Không thể tải lên file âm thanh: " + err.message);
        } finally {
          setIsUploadingAudio(false); // Tắt trạng thái loading
        }
      };

      // tải video 
      const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          if (file.size > 100 * 1024 * 1024) {
            throw new Error("File video quá lớn. Vui lòng chọn file nhỏ hơn 100MB");
          }
          setIsUploadingVideo(true); // Bật trạng thái loading
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
          setVideoFileName(file.name); // Lưu tên file video
          setError("");
        } catch (err) {
          setError("Không thể tải lên file video: " + err.message);
        } finally {
          setIsUploadingVideo(false); // Tắt trạng thái loading
        }
      };

        // dịch ngôn ngữ (lỗi)
        const handleTranslate = async () => {
          if (!content.trim()) {
            setError("Vui lòng nhập nội dung để dịch.");
            return;
          }
          if (!translateTo) {
            setError("Vui lòng chọn ngôn ngữ để dịch.");
            return;
          }
      
          try {
            const response = await fetch(
              `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${translateTo}&dt=t&q=${encodeURIComponent(
                content
              )}`
            );
            const data = await response.json();
            const translatedText = data[0][0][0];
            setContent(translatedText);
            setError("");
            setExtraMenuVisible(false);
          } catch (err) {
            console.error("Error translating text:", err);
            setError("Không thể dịch nội dung. Vui lòng thử lại.");
          }
        };

  return (
    <div className="w-full min-h-screen note-app-container" style={{ color: 'var(--text-color)' }}>
   <div ref={noteFormRef} className="mt-[96px] p-4 w-full border border-gray-300 rounded-lg shadow-lg">
  <h1 className="text-4xl font-extrabold text-gray-800 mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse">
    BlogNote - Ghi chú
  </h1>
  <input
    type="text"
    placeholder="Tiêu đề ghi chú"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    className="w-full border-2 border-gray-300 p-4 rounded-xl mb-4 font-bold text-lg transition duration-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-300"
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
                  onClick={() => handleNoteTypeChange("markdown")} 
                >
                  💻 Ghi chú Markdown/Code
                </button>
                <button
                className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                onClick={() => handleNoteTypeChange("voice")}
              >
                🎙 Đính kèm Video, âm thanh..
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
                  <FaFileImport /> Nhập Word
                </button>
                <input
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                   className={`dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200 ${
                       isOffline ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isOffline}
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
              className="w-full h-119 border-2 border-gray-300 p-4 rounded-xl transition duration-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-300"
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
            {/* Thanh công cụ cho loại ghi chú */}
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
                <li
                  key={index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e)}
                  onDrop={(e) => handleDrop(e, index)}
                  className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg hover:bg-gray-100 transition duration-200 cursor-move"
                >
                  <div className="flex-shrink-0">
                  <FaBars className="text-gray-500 mr-2" /> {/* Biểu tượng kéo thả */}
                  </div>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(index)}
                    className="w-5 h-5"
                  />
                  <span
                    className={`flex-grow ${todo.completed ? "line-through text-gray-500" : ""}`}
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
                      <FaBell className="mr-1" /> (Nhắc nhở: {new Date(todo.reminder).toLocaleString()})
                    </small>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => handleEditTodo(index)}
                      className="text-green-600 hover:text-green-800 transition duration-200"
                      title="Sửa công việc"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteTodo(index)}
                      className="text-red-500 hover:text-red-700 transition duration-200"
                      title="Xóa công việc"
                    >
                      <FaTrash />
                    </button>
                  </div>
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
                      {/* Trạng thái ghi âm */}
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className="menu-btn flex items-center gap-2 px-4 py-2 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-lg"
                        >
                          {isRecording ? (
                            <>
                              <FaPause />
                              <span className="animate-pulse">Đang ghi âm...</span>
                            </>
                          ) : (
                            <>
                              <FaPlay />
                              <span>Bắt đầu ghi âm</span>
                            </>
                          )}
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
                            <div className="text-4xl animate-spin">🐾</div>
                            <p className="text-gray-600 mt-2 animate-pulse">
                              Đang tải video, chờ tí nha! 😺
                            </p>
                          </div>
                        </div>
                      )}

                {/* Hiệu ứng loading khi tải âm thanh */}
                  {isUploadingAudio && (
                      <div className="mb-4 flex items-center justify-center">
                        <div className="flex flex-col items-center">
                          <div className="text-4xl animate-spin">🎵</div>
                          <p className="text-gray-600 mt-2 animate-pulse">
                          Đang tải âm thanh, tí xíu thôi nè! 😽
                          </p>
                        </div>
                      </div>
                    )}
                  
                      {/* Hiển thị video */}
                      {videoUrl && !isUploadingVideo && (
                        <div className="mb-4">
                          <p className="text-gray-700">Video: {videoFileName}</p>
                          <video controls src={videoUrl} className="w-full max-w-md rounded-md" />
                          <button
                            onClick={() => {
                              setVideoUrl("");
                              setVideoFileName(""); // Xóa tên file khi xóa video
                            }}
                            className="mt-2 text-red-500 hover:text-red-700"
                          >
                            Xóa video
                          </button>
                        </div>
                      )}

                  {/* Hiển thị file âm thanh */}
                  {audioUrl && (
                    <div className="mb-4">
                      <p className="text-gray-700">Âm thanh: {audioFileName}</p>
                      <audio controls src={audioUrl} className="w-full" />
                      <button
                        onClick={() => {
                          setAudioUrl("");
                          setAudioFileName(""); // Xóa tên file khi xóa âm thanh
                        }}
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
                        className="w-full h-100 border-2 border-gray-300 p-4 rounded-xl transition duration-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-300"
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
            <div className="border border-gray-300 rounded-xl p-4 bg-white h-135 overflow-y-auto">
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
            <div className="border border-gray-300 rounded-xl p-4 bg-gray-50 h-135 overflow-y-auto">
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
                    : filterType === "markdown"
                    ? "Markdown/Code"
                    : filterType === "voice"
                    ? "Đính kèm"
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
                        markdown: true,
                        voice: true,
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
                  <button
                    className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                    onClick={() => {
                      setFilterType("markdown");
                      setFilterMenuVisible(false);
                    }}
                  >
                    💻 Ghi chú Markdown/Code
                  </button>
                  <button
                    className="dropdown-item flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-50 transition-all duration-200"
                    onClick={() => {
                      setFilterType("voice");
                      setFilterMenuVisible(false);
                    }}
                  >
                    🎙 Ghi chú đính kèm
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
                    {visibleNoteTypes.markdown && (
                      <div className="relative bg-blue-100 px-3 py-1 rounded-full">
                        Markdown/Code
                        <button
                          onClick={() => toggleNoteTypeVisibility("markdown")}
                          className="absolute top-0 right-0 text-red-500 hover:text-red-700"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    )}
                    {visibleNoteTypes.voice && (
                      <div className="relative bg-blue-100 px-3 py-1 rounded-full">
                        Đính kèm
                        <button
                          onClick={() => toggleNoteTypeVisibility("voice")}
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
                      <p className="text-gray-700">Video: {note.video_file_name}</p>
                      <video
                        controls
                        src={note.video_url}
                        className="w-full max-w-md rounded-md"
                      />
                    </div>
                  )}
                  {note.audio_url && (
                    <div className="mt-2">
                      <p className="text-gray-700">Âm thanh: {note.audio_file_name}</p>
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
              note.is_pinned
                ? "text-yellow-500 hover:text-yellow-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title={note.is_pinned ? "Bỏ ghim" : "Ghim ghi chú"}
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
          onClick={() => {
              setNoteIdToDelete(note.id);
              setShowDeleteModal(true);
            }}
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
      {showDeleteModal && (
      <div className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
          <h2 className="text-2xl font-bold mb-4 text-center">Xác nhận xóa</h2>
          <p className="mb-4">Bạn có chắc chắn muốn xóa ghi chú này?</p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-200"
            >
              Hủy
            </button>
            <button
              onClick={async () => {
                await handleDeleteNote(noteIdToDelete);
                setShowDeleteModal(false);
                setNoteIdToDelete(null);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    )}
        </div>
        <style jsx>{`
          :global(.note-app-container) {
            background-color: var(--background);
            width: 100%;
            min-height: 100vh;
          }
          .menu-btn {
            background: var(--accent-color, linear-gradient(135deg, #6aa8ff, #b57edc));
            color: var(--text-color, white);
            font-size: 16px;
            font-weight: 500;
            border: 1px solid var(--border-color, transparent);
            outline: none;
            cursor: pointer;
          }
          .menu-btn:hover {
            background: var(--accent-color, linear-gradient(135deg, #b57edc, #6aa8ff));
            transform: scale(1.05);
            border-color: var(--border-color, #b57edc);
          }
          .menu-dropdown {
            background: var(--background);
            border: 1px solid var(--border-color, #e5e7eb);
            opacity: 1;
            transform: translateY(0);
          }
          .dropdown-item {
            background: none;
            border: none;
            color: var(--text-color, #333);
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease-in-out;
            position: relative;
          }
          .dropdown-item:hover {
            background: var(--accent-color, linear-gradient(to right, #e8e1ff, #d6eaff));
            color: var(--text-color, #6aa8ff);
            box-shadow: 0 6px 12px rgba(106, 168, 255, 0.3);
            transform: translateY(-3px) scale(1.02);
            animation: bounce 0.4s ease infinite alternate;
          }
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
            color: var(--text-color, #2563eb);
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
          /* Cập nhật các thành phần giao diện khác */
          .text-gray-700 {
            color: var(--text-color, #374151);
          }
          .border-gray-300 {
            border-color: var(--border-color, #d1d5db);
          }
          .bg-white {
            background-color: var(--background);
          }
          .bg-gray-100 {
            background-color: var(--background);
          }
          .bg-blue-50 {
            background-color: var(--background);
          }
          .bg-gray-50 {
            background-color: var(--background);
          }
          .text-blue-600 {
            color: var(--text-color, #2563eb);
          }
          .text-purple-600 {
            color: var(--text-color, #7c3aed);
          }
          .focus\\:border-blue-400:focus {
            border-color: var(--border-color, #3b82f6);
          }
          .focus\\:ring-blue-300:focus {
            --tw-ring-color: var(--border-color, #93c5fd);
          }
          .hover\\:bg-blue-100:hover {
            background-color: var(--background);
          }
          .bg-blue-200 {
            background-color: var(--background);
          }
          .bg-gray-200 {
            background-color: var(--background);
          }

          li[draggable]:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          li.dragging {
            opacity: 0.6;
            background-color: #e0f7fa;
          }
        `}</style>
              {isOffline && (
        <div className="fixed top-4 right-4 bg-yellow-100 text-yellow-800 p-4 rounded-lg shadow-md">
          Bạn đang ở chế độ ngoại tuyến. Các thay đổi sẽ được đồng bộ khi có mạng.
        </div>
      )}
      </div>
              <ThemeSettings />
    </div>
  );
};

export default NoteApp;




