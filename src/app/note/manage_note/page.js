"use client";
import { useState, useEffect, useRef } from "react";
import { supabase2 } from "../../../lib/supabase";
import ChiTiet from "../../components/details";
import ThemeSettings from "../../components/ThemeSettings";
import { openDB } from "idb";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function ManageNotes() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [viewDetailNoteId, setViewDetailNoteId] = useState(null);
  const [categories, setCategories] = useState(["personal", "study", "entertainment", "upload"]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOffline, setIsOffline] = useState(false);
  const [offlineChanges, setOfflineChanges] = useState([]);
  const [advancedSearch, setAdvancedSearch] = useState({
    dateFrom: "",
    dateTo: "",
    noteType: "",
    isPinned: null,
  });
  const [trashNotes, setTrashNotes] = useState([]);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [previewNoteId, setPreviewNoteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [viewVersionNote, setViewVersionNote] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const categoryRefs = useRef({});

  const categoryMap = {
    1: "personal",
    2: "study",
    3: "entertainment",
    4: "upload",
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const initDB = async () => {
    const db = await openDB("notesDB", 1, {
      upgrade(db) {
        db.createObjectStore("notes", { keyPath: "id" });
        db.createObjectStore("changes", { autoIncrement: true });
      },
    });
    return db;
  };

  const saveToIndexedDB = async (notes) => {
    const db = await initDB();
    const tx = db.transaction("notes", "readwrite");
    const store = tx.objectStore("notes");
    notes.forEach((note) => store.put(note));
    await tx.done;
    console.log("Saved notes to IndexedDB:", notes);
  };

  const saveOfflineChange = async (change) => {
    const db = await initDB();
    const tx = db.transaction("changes", "readwrite");
    const store = tx.objectStore("changes");
    await store.add(change);
    setOfflineChanges((prev) => [...prev, change]);
    await tx.done;
  };

  const withRetry = async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === retries - 1) throw err;
        console.warn(`Retrying (${i + 1}/${retries}) after error:`, err.message);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  const syncOfflineChanges = async () => {
    const db = await initDB();
    const tx = db.transaction("changes", "readwrite");
    const store = tx.objectStore("changes");
    const changes = await store.getAll();

    for (const change of changes) {
      try {
        if (change.type === "update") {
          const { error } = await supabase2
            .from("notess")
            .update({
              ...change.data,
              updated_at: new Date().toISOString(),
            })
            .eq("id", change.id);
          if (error) throw error;
        } else if (change.type === "delete") {
          const { error } = await supabase2
            .from("notess")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", change.id);
          if (error) throw error;
        } else if (change.type === "pin") {
          const { error } = await supabase2
            .from("notess")
            .update({ is_pinned: change.data.is_pinned })
            .eq("id", change.id);
          if (error) throw error;
        }
      } catch (err) {
        console.error("Error syncing change:", err.message);
        showNotification("Lỗi khi đồng bộ thay đổi: " + err.message);
      }
    }

    const clearTx = db.transaction("changes", "readwrite");
    const clearStore = clearTx.objectStore("changes");
    await clearStore.clear();
    await clearTx.done;

    setOfflineChanges([]);
    fetchNotes();
    showNotification("Đã đồng bộ tất cả thay đổi!");
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showNotification("Đã kết nối lại! Đang đồng bộ dữ liệu...");
      syncOfflineChanges();
    };
    const handleOffline = () => {
      setIsOffline(true);
      showNotification("Bạn đang ở chế độ ngoại tuyến.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    const checkSession = async () => {
      const { data: { session }, error } = await supabase2.auth.getSession();
      if (error) {
        console.error("Supabase session error:", error.message);
        showNotification("Lỗi xác thực Supabase: " + error.message);
      } else if (!session) {
        showNotification("Không có phiên đăng nhập Supabase.");
      }
    };
    checkSession();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchNotes = async () => {
    setIsLoading(true);
    if (isOffline) {
      const db = await initDB();
      const tx = db.transaction("notes", "readonly");
      const store = tx.objectStore("notes");
      const offlineNotes = await store.getAll();
      setNotes(offlineNotes || []);
      showNotification("Đang tải ghi chú từ bộ nhớ cục bộ.");
      setIsLoading(false);
      return;
    }
  
    try {
      // Lấy thông tin người dùng từ localStorage
      const userData = localStorage.getItem("user");
      let user_id = null;
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          user_id = parsedUser.id; // Lấy user_id (UUID) từ localStorage
          if (!user_id) {
            console.error("Không tìm thấy user_id trong dữ liệu người dùng.");
            showNotification("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error("Lỗi khi parse dữ liệu user từ localStorage:", err);
          showNotification("Lỗi khi lấy thông tin người dùng. Vui lòng đăng nhập lại.");
          setIsLoading(false);
          return;
        }
      } else {
        console.error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập.");
        showNotification("Vui lòng đăng nhập để xem ghi chú của bạn.");
        setIsLoading(false);
        return;
      }
  
      const fetchFn = async () => {
        const { data, error } = await supabase2
        .from("notess")
        .select(
          "id, title, content, image_url, created_at, updated_at, category_id, note_type, todos, spreadsheet_data, versions, deleted_at, audio_url, audio_file_name, video_url, video_file_name, is_pinned"
        )
        .is("deleted_at", null)
        .eq("user_id", user_id)
        .order("updated_at", { ascending: false });
  
        if (error) throw new Error(error.message);
        return data;
      };
  
      const data = await withRetry(fetchFn);
      const parsedNotes = (data || []).map((note) => {
        let parsedTodos = [];
        let parsedSpreadsheetData = Array(10).fill().map(() => Array(10).fill(""));
        let parsedVersions = [];
  
        if (note.todos) {
          try {
            parsedTodos = JSON.parse(note.todos);
            if (!Array.isArray(parsedTodos)) parsedTodos = [];
          } catch (e) {
            console.error(`Error parsing todos for note ${note.id}:`, e.message);
            parsedTodos = [];
          }
        }
  
        if (note.spreadsheet_data) {
          try {
            parsedSpreadsheetData = JSON.parse(note.spreadsheet_data);
            if (!Array.isArray(parsedSpreadsheetData))
              parsedSpreadsheetData = Array(10).fill().map(() => Array(10).fill(""));
          } catch (e) {
            console.error(`Error parsing spreadsheet_data for note ${note.id}:`, e.message);
            parsedSpreadsheetData = Array(10).fill().map(() => Array(10).fill(""));
          }
        }
  
        if (note.versions) {
          try {
            parsedVersions = JSON.parse(note.versions);
            if (!Array.isArray(parsedVersions)) parsedVersions = [];
          } catch (e) {
            console.error(`Error parsing versions for note ${note.id}:`, e.message);
            parsedVersions = [];
          }
        }
  
        return {
          ...note,
          todos: parsedTodos,
          spreadsheet_data: parsedSpreadsheetData,
          versions: parsedVersions,
          category: categoryMap[note.category_id] || "personal",
          audio_url: note.audio_url || "",
          audio_file_name: note.audio_file_name || "",
          video_url: note.video_url || "",
          video_file_name: note.video_file_name || "",
          is_pinned: note.is_pinned || false,
        };
      });
  
      setNotes(parsedNotes);
      saveToIndexedDB(parsedNotes);
      showNotification("Đã tải ghi chú từ Supabase.");
    } catch (err) {
      console.error("Error fetching notes:", err.message);
      showNotification("Lỗi khi tải ghi chú từ Supabase: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchTrashNotes = async () => {
    if (isOffline) {
      showNotification("Không thể tải thùng rác ở chế độ ngoại tuyến.");
      setIsLoading(false);
      return;
    }
  
    setIsLoading(true);
    try {
      // Lấy thông tin người dùng từ localStorage
      const userData = localStorage.getItem("user");
      let user_id = null;
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          user_id = parsedUser.id; // Lấy user_id (UUID) từ localStorage
          if (!user_id) {
            console.error("Không tìm thấy user_id trong dữ liệu người dùng.");
            showNotification("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error("Lỗi khi parse dữ liệu user từ localStorage:", err);
          showNotification("Lỗi khi lấy thông tin người dùng. Vui lòng đăng nhập lại.");
          setIsLoading(false);
          return;
        }
      } else {
        console.error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập.");
        showNotification("Vui lòng đăng nhập để xem thùng rác của bạn.");
        setIsLoading(false);
        return;
      }
  
      const fetchFn = async () => {
        const { data, error } = await supabase2
          .from("notess")
          .select(
            "id, title, content, image_url, created_at, updated_at, category_id, note_type, todos, spreadsheet_data, deleted_at, audio_url, audio_file_name, video_url, video_file_name, is_pinned"
          )
          .not("deleted_at", "is", null)
          .eq("user_id", user_id)
          .order("deleted_at", { ascending: false });
  
        if (error) throw new Error(error.message);
        return data;
      };
  
      const data = await withRetry(fetchFn);
      setTrashNotes(data || []);
      showNotification("Đã tải ghi chú trong thùng rác.");
    } catch (err) {
      console.error("Error fetching trash notes:", err.message);
      showNotification("Lỗi khi tải ghi chú trong thùng rác: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    if (!isOffline) fetchTrashNotes();
  }, [isOffline]);

  const togglePin = async (noteId) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
  
    const newPinnedState = !note.is_pinned;
  
    try {
      if (isOffline) {
        await saveOfflineChange({
          type: "pin",
          id: noteId,
          data: { is_pinned: newPinnedState },
        });
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteId ? { ...n, is_pinned: newPinnedState } : n
          )
        );
        showNotification(`Ghi chú đã được ${newPinnedState ? "ghim" : "bỏ ghim"} cục bộ.`);
        return;
      }
  
      const { error } = await supabase2
        .from("notess")
        .update({ is_pinned: newPinnedState })
        .eq("id", noteId);
  
      if (error) throw error;
  
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId ? { ...n, is_pinned: newPinnedState } : n
        )
      );
      showNotification(`Ghi chú đã được ${newPinnedState ? "ghim" : "bỏ ghim"}!`);
    } catch (err) {
      console.error("Error toggling pin:", err.message);
      showNotification("Lỗi khi thay đổi trạng thái ghim: " + err.message);
    }
  };

  const handleEdit = (note) => {
    if (note.note_type === "rich") {
      setEditingNote({
        ...note,
        newTitle: note.title,
        newContent: note.content,
        newImageFile: null,
        currentImageUrl: note.image_url,
      });
    } else if (note.note_type === "voice") {
      setEditingNote({
        ...note,
        newTitle: note.title,
        newContent: note.content,
        newAudioFile: null,
        newVideoFile: null,
        currentAudioUrl: note.audio_url,
        currentVideoUrl: note.video_url,
        hasAudio: !!note.audio_url, // Flag to determine which media to show
        hasVideo: !!note.video_url,
      });
    } else {
      setEditingNote({
        ...note,
        newTitle: note.title,
        newContent: note.content,
      });
    }
  };

  const handleImageChange = (file) => {
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target.result;
      setEditingNote((prev) => ({
        ...prev,
        newImageFile: file,
        currentImageUrl: base64String,
        uploadFailed: false,
      }));
      showNotification("Hình ảnh đã được chọn thành công!");
    };
    reader.onerror = (err) => {
      console.error("Error reading image file:", err);
      showNotification("Lỗi khi đọc hình ảnh!");
      setEditingNote((prev) => ({
        ...prev,
        uploadFailed: true,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleVideoChange = (file) => {
    if (!file) return;
  
    // Optional: Add size validation to prevent overly large videos
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      showNotification("Video quá lớn! Vui lòng chọn video dưới 50MB.");
      return;
    }
  
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target.result;
      setEditingNote((prev) => ({
        ...prev,
        newVideoFile: file,
        currentVideoUrl: base64String,
        video_file_name: file.name,
      }));
      showNotification("Video đã được chọn thành công!");
    };
    reader.onerror = (err) => {
      console.error("Error reading video file:", err);
      showNotification("Lỗi khi đọc video!");
      setEditingNote((prev) => ({
        ...prev,
        uploadFailed: true,
      }));
    };
    reader.readAsDataURL(file); // Convert video to Base64
  };
  
  // sửa âm thanh
  const handleAudioChange = (file) => {
    if (!file) return;
  
    // Optional: Add size validation to prevent overly large audio files
    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      showNotification("Tệp âm thanh quá lớn! Vui lòng chọn tệp dưới 20MB.");
      return;
    }
  
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target.result;
      setEditingNote((prev) => ({
        ...prev,
        newAudioFile: file,
        currentAudioUrl: base64String,
        audio_file_name: file.name,
      }));
      showNotification("Tệp âm thanh đã được chọn thành công!");
    };
    reader.onerror = (err) => {
      console.error("Error reading audio file:", err);
      showNotification("Lỗi khi đọc tệp âm thanh!");
      setEditingNote((prev) => ({
        ...prev,
        uploadFailed: true,
      }));
    };
    reader.readAsDataURL(file); // Convert audio to Base64
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editingNote.newTitle && editingNote.newContent) {
      try {
        // Prepare version history
        const currentVersions = editingNote.versions || [];
        const newVersion = {
          title: editingNote.title,
          content: editingNote.content,
          updated_at: editingNote.updated_at,
          timestamp: new Date().toISOString(),
        };
  
        // Prepare updated data
        let updatedData = {
          title: editingNote.newTitle,
          content: editingNote.newContent,
          versions: JSON.stringify([...currentVersions, newVersion]),
          updated_at: new Date().toISOString(),
        };
  
        // Handle image, audio, and video based on note type
        if (editingNote.note_type === "rich") {
          updatedData.image_url = editingNote.currentImageUrl || "";
          console.log("Saving note with image URL (Base64):", updatedData.image_url.slice(0, 50) + "...");
        } else if (editingNote.note_type === "voice") {
          // Handle audio as Base64
          updatedData.audio_url = editingNote.currentAudioUrl || "";
          updatedData.audio_file_name = editingNote.newAudioFile?.name || editingNote.audio_file_name || "";
          console.log("Saving note with audio URL (Base64):", updatedData.audio_url.slice(0, 50) + "...");
  
          // Handle video as Base64
          updatedData.video_url = editingNote.currentVideoUrl || "";
          updatedData.video_file_name = editingNote.newVideoFile?.name || editingNote.video_file_name || "";
          console.log("Saving note with video URL (Base64):", updatedData.video_url.slice(0, 50) + "...");
        }
  
        if (isOffline) {
          // Save changes locally for offline mode
          await saveOfflineChange({ type: "update", id: editingNote.id, data: updatedData });
          setNotes((prev) =>
            prev.map((n) =>
              n.id === editingNote.id ? { ...n, ...updatedData } : n
            )
          );
          showNotification("Ghi chú đã được cập nhật cục bộ.");
          setEditingNote(null);
          return;
        }
  
        // Update note in Supabase
        console.log("Updating note in database with data:", updatedData);
        const { error } = await supabase2
          .from("notess")
          .update(updatedData)
          .eq("id", editingNote.id);
  
        if (error) throw error;
        fetchNotes();
        showNotification("Ghi chú đã được cập nhật thành công!");
        setEditingNote(null);
      } catch (err) {
        console.error("Error updating note:", err.message);
        showNotification("Lỗi khi cập nhật ghi chú: " + err.message);
      }
    } else {
      showNotification("Tiêu đề và nội dung không được để trống!");
    }
  };
  
  const handleDelete = async (noteId) => {
    setShowDeleteConfirm(noteId);
  };

  const confirmDelete = async () => {
    const noteId = showDeleteConfirm;
    try {
      if (isOffline) {
        await saveOfflineChange({ type: "delete", id: noteId });
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        showNotification("Ghi chú đã được chuyển vào thùng rác cục bộ.");
        setShowDeleteConfirm(null);
        return;
      }

      const { error } = await supabase2
        .from("notess")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", noteId);

      if (error) throw error;
      fetchNotes();
      fetchTrashNotes();
      showNotification("Ghi chú đã được chuyển vào thùng rác!");
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error("Error moving note to trash:", err.message);
      showNotification("Lỗi khi chuyển ghi chú vào thùng rác: " + err.message);
      setShowDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const handleRestore = async (noteId) => {
    if (isOffline) {
      showNotification("Không thể khôi phục ghi chú ở chế độ ngoại tuyến.");
      return;
    }

    try {
      const { error } = await supabase2
        .from("notess")
        .update({ deleted_at: null })
        .eq("id", noteId);

      if (error) throw error;
      fetchNotes();
      fetchTrashNotes();
      showNotification("Ghi chú đã được khôi phục!");
    } catch (err) {
      console.error("Error restoring note:", err.message);
      showNotification("Lỗi khi khôi phục ghi chú: " + err.message);
    }
  };

  const handlePermanentDelete = async (noteId) => {
    if (isOffline) {
      showNotification("Không thể xóa vĩnh viễn ở chế độ ngoại tuyến.");
      return;
    }

    if (confirm("Bạn có chắc muốn xóa vĩnh viễn ghi chú này?")) {
      try {
        const { error } = await supabase2
          .from("notess")
          .delete()
          .eq("id", noteId);

        if (error) throw error;
        fetchTrashNotes();
        showNotification("Ghi chú đã được xóa vĩnh viễn!");
      } catch (err) {
        console.error("Error permanently deleting note:", err.message);
        showNotification("Lỗi khi xóa vĩnh viễn ghi chú: " + err.message);
      }
    }
  };

  const handleViewVersions = (note) => {
    if (!note.versions || note.versions.length === 0) {
      showNotification("Không có lịch sử phiên bản.");
      return;
    }
    setViewVersionNote({ ...note, selectedVersion: null });
  };

  const handleRestoreVersion = async () => {
    if (!viewVersionNote?.selectedVersion) {
      showNotification("Vui lòng chọn một phiên bản để khôi phục!");
      return;
    }

    try {
      const selectedVersion = viewVersionNote.versions[viewVersionNote.selectedVersion];
      const updatedData = {
        title: selectedVersion.title,
        content: selectedVersion.content,
        updated_at: new Date().toISOString(),
      };

      if (isOffline) {
        await saveOfflineChange({ type: "update", id: viewVersionNote.id, data: updatedData });
        setNotes((prev) =>
          prev.map((n) =>
            n.id === viewVersionNote.id ? { ...n, ...updatedData } : n
          )
        );
        showNotification("Phiên bản đã được khôi phục cục bộ.");
        setViewVersionNote(null);
        return;
      }

      const { error } = await supabase2
        .from("notess")
        .update(updatedData)
        .eq("id", viewVersionNote.id);

      if (error) throw error;
      fetchNotes();
      showNotification("Phiên bản đã được khôi phục!");
      setViewVersionNote(null);
    } catch (err) {
      console.error("Error restoring version:", err.message);
      showNotification("Lỗi khi khôi phục phiên bản: " + err.message);
    }
  };

  const handleShare = (note) => {
    let shareText = `${note.title}\n${note.content}\nCategory: ${note.category}`;
    if (note.note_type === "whiteboard" && note.todos?.length) {
      shareText +=
        "\n\nTodos:\n" +
        note.todos
          .map((todo) => `- [${todo.completed ? "x" : " "}] ${todo.text}`)
          .join("\n");
    }
    if (note.note_type === "spreadsheet" && note.spreadsheet_data?.length) {
      shareText +=
        "\n\nSpreadsheet Data:\n" +
        note.spreadsheet_data.map((row) => row.join("\t")).join("\n");
    }
    if (note.note_type === "markdown") {
      shareText += "\n\nMarkdown Content:\n" + note.content;
    }
    if (note.note_type === "voice") {
      shareText += "\n\nVoice Attachments:\n";
      if (note.audio_url) shareText += `- Audio: ${note.audio_file_name || "Bản ghi âm"} (${note.audio_url})\n`;
      if (note.video_url) shareText += `- Video: ${note.video_file_name || "Video đính kèm"} (${note.video_url})\n`;
    }

    if (navigator.share) {
      navigator
        .share({
          title: note.title,
          text: shareText,
          url: window.location.href,
        })
        .catch((err) => console.error("Error sharing:", err.message));
    } else {
      navigator.clipboard
        .writeText(shareText)
        .then(() => showNotification("Đã sao chép nội dung vào clipboard!"))
        .catch((err) => {
          console.error("Error copying to clipboard:", err.message);
          showNotification("Lỗi khi sao chép nội dung.");
        });
    }
  };

  const handleDownload = (note) => {
    let content = `${note.title}\n\n${note.content}\n\nCategory: ${note.category}`;

    if (note.note_type === "whiteboard" && note.todos?.length) {
      content +=
        "\n\nTodos:\n" +
        note.todos
          .map((todo) => `- [${todo.completed ? "x" : " "}] ${todo.text}`)
          .join("\n");
    }

    if (note.note_type === "spreadsheet" && note.spreadsheet_data?.length) {
      content +=
        "\n\nSpreadsheet Data:\n" +
        note.spreadsheet_data.map((row) => row.join("\t")).join("\n");
    }

    if (note.note_type === "markdown") {
      content += "\n\nMarkdown Content:\n" + note.content;
    }

    if (note.note_type === "voice") {
      content += "\n\nVoice Attachments:\n";
      if (note.audio_url) content += `- Audio: ${note.audio_file_name || "Bản ghi âm"} (${note.audio_url})\n`;
      if (note.video_url) content += `- Video: ${note.video_file_name || "Video đính kèm"} (${note.video_url})\n`;
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${note.title}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCategoryClick = (category) => {
    const newCategory = selectedCategory === category ? null : category;
    setSelectedCategory(newCategory);
    if (newCategory && categoryRefs.current[category]) {
      categoryRefs.current[category].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCreateCategory = () => {
    const newCategory = prompt("Nhập tên danh mục mới:");
    if (newCategory && newCategory.trim() !== "") {
      const formattedCategory = newCategory.trim().toLowerCase();
      if (categories.includes(formattedCategory)) {
        showNotification("Danh mục này đã tồn tại!");
      } else {
        setCategories((prev) => [...prev, formattedCategory]);
        showNotification(`Danh mục "${newCategory}" đã được tạo!`);
      }
    } else {
      showNotification("Tên danh mục không được để trống!");
    }
    setIsMenuOpen(false);
  };

  const filteredNotes = selectedCategory
    ? notes.filter((note) => {
        const matchesCategory = note.category === selectedCategory;
        const matchesQuery =
          searchQuery === "" ||
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDateFrom = advancedSearch.dateFrom
          ? new Date(note.created_at) >= new Date(advancedSearch.dateFrom)
          : true;
        const matchesDateTo = advancedSearch.dateTo
          ? new Date(note.created_at) <= new Date(advancedSearch.dateTo)
          : true;
        const matchesNoteType = advancedSearch.noteType
          ? note.note_type === advancedSearch.noteType
          : true;
          const matchesPinned = advancedSearch.isPinned !== null
          ? note.is_pinned === advancedSearch.isPinned
          : true;

        return (
          matchesCategory &&
          matchesQuery &&
          matchesDateFrom &&
          matchesDateTo &&
          matchesNoteType &&
          matchesPinned
        );
      })
    : [];

    const sortNotes = (notes) => {
      return [...notes].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return 0;
      });
    };

  const chunkCategories = (categories, size) => {
    const chunks = [];
    for (let i = 0; i < categories.length; i += size) {
      chunks.push(categories.slice(i, i + size));
    }
    return chunks;
  };

  const categoryRows = chunkCategories(categories, 4);

  const NotesDisplay = ({ category }) => {
    return (
      <div
        ref={(el) => (categoryRefs.current[category] = el)}
        className="mt-6"
      >
        <h2
          className="text-xl font-bold mb-4 text-left"
          style={{ color: "var(--text-color)" }}
        >
          📌 Ghi chú - {category.charAt(0).toUpperCase() + category.slice(1)}
        </h2>

        {/* Plain Notes */}
        <div className="mt-6">
          <h2
            className="text-xl font-bold mb-4 text-left"
            style={{ color: "var(--text-color)" }}
          >
            Ghi chú văn bản thuần
          </h2>
          {isLoading ? (
            <div className="pro-spinner">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          ) : sortNotes(
              filteredNotes.filter(
                (note) => !note.image_url && note.note_type === "plain"
              )
            ).length === 0 ? (
            <p style={{ color: "var(--text-color)" }}>
              Không có ghi chú văn bản thuần.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {sortNotes(
                filteredNotes.filter(
                  (note) => !note.image_url && note.note_type === "plain"
                )
              ).map((note) => (
                <div
                  key={note.id}
                  className={`rounded-xl p-4 relative shadow-sm max-w-full flex flex-col transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                    note.is_pinned ? "bg-[#E0E7FF]" : ""
                  }`}
                  style={{
                    background: note.is_pinned ? "#E0E7FF" : "var(--background)",
                    border: "1px solid var(--border-color)",
                  }}
                  onMouseEnter={() => setPreviewNoteId(note.id)}
                  onMouseLeave={() => setPreviewNoteId(null)}
                >
                <div className="relative">
                  <h3
                    className="font-semibold inline"
                    style={{ color: "var(--text-color)" }}
                  >
                    {note.title}
                  </h3>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`absolute top-0 right-0 text-lg ${
                      note.is_pinned ? "text-[#A78BFA]" : "text-gray-400"
                    } hover:text-[#A78BFA]`}
                    title={note.is_pinned ? "Bỏ ghim" : "Ghim"}
                  >
                    📌
                  </button>
                </div>
                <p
                  className={`line-clamp-2 min-h-[40px] ${previewNoteId === note.id ? "hidden" : ""}`}
                  style={{ color: "var(--text-color)" }}
                >
                  {note.content}
                </p>
                {previewNoteId === note.id && (
                  <div
                    className="p-2"
                    style={{
                      background: "var(--background)",
                      color: "var(--text-color)",
                    }}
                  >
                    <h4 className="font-semibold">{note.title}</h4>
                    <p>{note.content}</p>
                    <small>Category: {note.category}</small>
                  </div>
                )}
                <button
                  onClick={() => setViewDetailNoteId(note.id)}
                  className="mt-2 text-left"
                  style={{ color: "var(--accent-color)" }}
                >
                  Xem chi tiết →
                </button>
                <div className="flex overflow-x-auto gap-2 mt-3 justify-end">
                  <button
                    onClick={() => handleEdit(note)}
                    className="min-w-[80px] px-3 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-2 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="min-w-[80px] px-3 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-2 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => handleShare(note)}
                    className="min-w-[80px] px-3 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-2 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Chia sẻ
                  </button>
                  <button
                    onClick={() => handleDownload(note)}
                    className="min-w-[80px] px-3 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-2 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Tải xuống
                  </button>
                  <button
                    onClick={() => handleViewVersions(note)}
                    className="min-w-[80px] px-3 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-2 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Lịch sử
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

        {/* Rich Notes */}
        <div className="mt-6">
          <h2
            className="text-xl font-bold mb-4 text-left"
            style={{ color: "var(--text-color)" }}
          >
            Ghi chú văn bản phong phú
          </h2>
          {isLoading ? (
            <div className="pro-spinner">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          ) : sortNotes(
              filteredNotes.filter(
                (note) => note.image_url && note.note_type === "rich"
              )
            ).length === 0 ? (
            <p style={{ color: "var(--text-color)" }}>
              Không có ghi chú văn bản phong phú.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {sortNotes(
                filteredNotes.filter(
                  (note) => note.image_url && note.note_type === "rich"
                )
              ).map((note) => (
                <div
                  key={note.id}
                  className={`p-4 shadow-md rounded-xl transition-transform duration-300 hover:shadow-lg transform hover:-translate-y-1 max-w-full flex flex-col ${
                    note.is_pinned ? "bg-[#E0E7FF]" : ""
                  }`}
                  style={{
                    background: note.is_pinned ? "#E0E7FF" : "var(--background)",
                    border: "1px solid var(--border-color)",
                  }}
                  onMouseEnter={() => setPreviewNoteId(note.id)}
                  onMouseLeave={() => setPreviewNoteId(null)}
                >
                <div className="relative">
                  <img
                    src={note.image_url}
                    alt={note.title}
                    className={`w-full h-32 object-cover rounded-xl mb-2 ${previewNoteId === note.id ? "hidden" : ""}`}
                  />
                  <h3
                    className="font-semibold inline"
                    style={{ color: "var(--text-color)" }}
                  >
                    {note.title}
                  </h3>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`absolute top-0 right-0 text-lg ${
                      note.is_pinned ? "text-[#A78BFA]" : "text-gray-400"
                    } hover:text-[#A78BFA]`}
                    title={note.is_pinned ? "Bỏ ghim" : "Ghim"}
                  >
                    📌
                  </button>
                </div>
                <p
                  className={`line-clamp-2 min-h-[40px] ${previewNoteId === note.id ? "hidden" : ""}`}
                  style={{ color: "var(--text-color)" }}
                >
                  {note.content}
                </p>
                {previewNoteId === note.id && (
                  <div
                    className="p-2"
                    style={{
                      background: "var(--background)",
                      color: "var(--text-color)",
                    }}
                  >
                    <h4 className="font-semibold">{note.title}</h4>
                    <p>{note.content}</p>
                    <small>Category: {note.category}</small>
                  </div>
                )}
                <button
                  onClick={() => setViewDetailNoteId(note.id)}
                  className="mt-2 text-left"
                  style={{ color: "var(--accent-color)" }}
                >
                  Xem chi tiết →
                </button>
                <div className="flex sm:flex-wrap overflow-x-auto gap-1 mt-2">
                  <button
                    onClick={() => handleEdit(note)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => handleShare(note)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Chia sẻ
                  </button>
                  <button
                    onClick={() => handleDownload(note)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Tải xuống
                  </button>
                  <button
                    onClick={() => handleViewVersions(note)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Lịch sử
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

      {/* Whiteboard Notes */}
      <div className="mt-6">
      <h2
        className="text-xl font-bold mb-4 text-left"
        style={{ color: "var(--text-color)" }}
      >
        Ghi chú danh sách công việc
      </h2>
      {isLoading ? (
        <div className="pro-spinner">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      ) : sortNotes(
          filteredNotes.filter((note) => note.note_type === "whiteboard")
        ).length === 0 ? (
        <p style={{ color: "var(--text-color)" }}>
          Không có ghi chú danh sách công việc.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortNotes(
            filteredNotes.filter((note) => note.note_type === "whiteboard")
          ).map((note) => (
            <div
              key={note.id}
              className={`p-4 shadow-md rounded-xl transition-transform duration-300 hover:shadow-lg transform hover:-translate-y-1 max-w-full flex flex-col ${
                note.is_pinned ? "bg-[#E0E7FF]" : ""
              }`}
              style={{
                background: note.is_pinned ? "#E0E7FF" : "var(--background)",
                border: "1px solid var(--border-color)",
              }}
              onMouseEnter={() => setPreviewNoteId(note.id)}
              onMouseLeave={() => setPreviewNoteId(null)}
            >
                <div className="relative">
                  <h3
                    className="font-semibold inline"
                    style={{ color: "var(--text-color)" }}
                  >
                    📝 {note.title}
                  </h3>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`absolute top-0 right-0 text-lg ${
                      note.is_pinned ? "text-[#A78BFA]" : "text-gray-400"
                    } hover:text-[#A78BFA]`}
                    title={note.is_pinned ? "Bỏ ghim" : "Ghim"}
                  >
                    📌
                  </button>
                </div>
                <p
                  className={`line-clamp-2 min-h-[40px] ${previewNoteId === note.id ? "hidden" : ""}`}
                  style={{ color: "var(--text-color)" }}
                >
                  {note.content}
                </p>
                {previewNoteId === note.id && (
                  <div
                    className="p-2"
                    style={{
                      background: "var(--background)",
                      color: "var(--text-color)",
                    }}
                  >
                    <h4 className="font-semibold">{note.title}</h4>
                    <p>{note.content}</p>
                    <small>Category: {note.category}</small>
                    {note.todos && note.todos.length > 0 && (
                      <ul className="list-disc pl-4 mt-2">
                        {note.todos.slice(0, 2).map((todo, index) => (
                          <li key={index} className={todo.completed ? "line-through" : ""}>
                            {todo.text}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {previewNoteId !== note.id && note.todos && note.todos.length > 0 && (
                  <ul className="list-disc pl-5 min-h-[60px] line-clamp-3">
                    {note.todos.map((todo, index) => (
                      <li
                        key={index}
                        className={
                          todo.completed ? "line-through text-gray-500" : ""
                        }
                        style={{ color: todo.completed ? "#6B7280" : "var(--text-color)" }}
                      >
                        {todo.text}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={() => setViewDetailNoteId(note.id)}
                  className="mt-2 text-left"
                  style={{ color: "var(--accent-color)" }}
                >
                  Xem chi tiết công việc →
                </button>
                <div className="flex sm:flex-wrap overflow-x-auto gap-1 mt-2">
                  <button
                    onClick={() => handleEdit(note)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => handleShare(note)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Chia sẻ
                  </button>
                  <button
                    onClick={() => handleDownload(note)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Tải xuống
                  </button>
                  <button
                    onClick={() => handleViewVersions(note)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Lịch sử
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>

        {/* Spreadsheet Notes */}
        <div className="mt-6">
          <h2
            className="text-xl font-bold mb-4 text-left"
            style={{ color: "var(--text-color)" }}
          >
            Ghi chú bảng tính
          </h2>
          {isLoading ? (
            <div className="pro-spinner">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          ) : sortNotes(
              filteredNotes.filter((note) => note.note_type === "spreadsheet")
            ).length === 0 ? (
            <p style={{ color: "var(--text-color)" }}>
              Không có ghi chú bảng tính.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {sortNotes(
                filteredNotes.filter((note) => note.note_type === "spreadsheet")
              ).map((note) => (
                <div
                  key={note.id}
                  className={`p-4 shadow-md rounded-xl transition-transform duration-300 hover:shadow-lg transform hover:-translate-y-1 max-w-full flex flex-col ${
                    note.is_pinned ? "bg-[#E0E7FF]" : ""
                  }`}
                  style={{
                    background: note.is_pinned ? "#E0E7FF" : "var(--background)",
                    border: "1px solid var(--border-color)",
                  }}
                  onMouseEnter={() => setPreviewNoteId(note.id)}
                  onMouseLeave={() => setPreviewNoteId(null)}
                >
                <div className="relative">
                  <h3
                    className="font-semibold inline"
                    style={{ color: "var(--text-color)" }}
                  >
                    📊 {note.title}
                  </h3>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`absolute top-0 right-0 text-lg ${
                      note.is_pinned ? "text-[#A78BFA]" : "text-gray-400"
                    } hover:text-[#A78BFA]`}
                    title={note.is_pinned ? "Bỏ ghim" : "Ghim"}
                  >
                    📌
                  </button>
                </div>
                <p
                  className={`line-clamp-2 min-h-[40px] ${previewNoteId === note.id ? "hidden" : ""}`}
                  style={{ color: "var(--text-color)" }}
                >
                  {note.content}
                </p>
                {previewNoteId === note.id && (
                  <div
                    className="p-2"
                    style={{
                      background: "var(--background)",
                      color: "var(--text-color)",
                    }}
                  >
                    <h4 className="font-semibold">{note.title}</h4>
                    <p>{note.content}</p>
                    <small>Category: {note.category}</small>
                    {note.spreadsheet_data && note.spreadsheet_data.length > 0 && (
                      <table className="border-collapse text-xs mt-2">
                        <tbody>
                          {note.spreadsheet_data.slice(0, 2).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.slice(0, 2).map((cell, colIndex) => (
                                <td key={colIndex} className="p-1 border">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
                {previewNoteId !== note.id && note.spreadsheet_data && note.spreadsheet_data.length > 0 && (
                  <div className="overflow-x-auto min-h-[80px]">
                    <table
                      className="border-collapse text-sm"
                      style={{ border: "1px solid var(--border-color)" }}
                    >
                      <tbody>
                        {note.spreadsheet_data.slice(0, 3).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.slice(0, 3).map((cell, colIndex) => (
                              <td
                                key={colIndex}
                                className="p-1"
                                style={{ border: "1px solid var(--border-color)" }}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <small style={{ color: "var(--text-color)" }}>
                      (Hiển thị 3x3, tổng {note.spreadsheet_data.length}x
                      {note.spreadsheet_data[0]?.length || 0})
                    </small>
                  </div>
                )}
                <button
                  onClick={() => setViewDetailNoteId(note.id)}
                  className="mt-2 text-left"
                  style={{ color: "var(--accent-color)" }}
                >
                  Đi đến bảng →
                </button>
                <div className="flex sm:flex-wrap overflow-x-auto gap-1 mt-2">
                  <button
                    onClick={() => handleEdit(note)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => handleShare(note)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Chia sẻ
                  </button>
                  <button
                    onClick={() => handleDownload(note)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Tải xuống
                  </button>
                  <button
                    onClick={() => handleViewVersions(note)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Lịch sử
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Markdown Notes */}
        {/* Markdown Notes */}
        <div className="mt-6">
          <h2
            className="text-xl font-bold mb-4 text-left"
            style={{ color: "var(--text-color)" }}
          >
            Ghi chú Markdown/Code
          </h2>
          {isLoading ? (
            <div className="pro-spinner">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          ) : sortNotes(
              filteredNotes.filter((note) => note.note_type === "markdown")
            ).length === 0 ? (
            <p style={{ color: "var(--text-color)" }}>
              Không có ghi chú Markdown/Code.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {sortNotes(
                filteredNotes.filter((note) => note.note_type === "markdown")
              ).map((note) => (
                <div
                  key={note.id}
                  className={`p-4 shadow-md rounded-xl transition-transform duration-300 hover:shadow-lg transform hover:-translate-y-1 max-w-full flex flex-col ${
                    note.is_pinned ? "bg-[#E0E7FF]" : ""
                  }`}
                  style={{
                    background: note.is_pinned ? "#E0E7FF" : "var(--background)",
                    border: "1px solid var(--border-color)",
                  }}
                  onMouseEnter={() => setPreviewNoteId(note.id)}
                  onMouseLeave={() => setPreviewNoteId(null)}
                >
                <div className="relative">
                  <h3
                    className="font-semibold inline"
                    style={{ color: "var(--text-color)" }}
                  >
                    💻 {note.title}
                  </h3>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`absolute top-0 right-0 text-lg ${
                      note.is_pinned ? "text-[#A78BFA]" : "text-gray-400"
                    } hover:text-[#A78BFA]`}
                    title={note.is_pinned ? "Bỏ ghim" : "Ghim"}
                  >
                    📌
                  </button>
                </div>
                <div
                  className={`markdown-preview min-h-[60px] line-clamp-3 ${previewNoteId === note.id ? "hidden" : ""}`}
                  style={{ color: "var(--text-color)" }}
                >
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {note.content}
                  </ReactMarkdown>
                </div>
                {previewNoteId === note.id && (
                  <div
                    className="p-2"
                    style={{
                      background: "var(--background)",
                      color: "var(--text-color)",
                    }}
                  >
                    <h4 className="font-semibold">{note.title}</h4>
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {note.content}
                    </ReactMarkdown>
                    <small>Category: {note.category}</small>
                  </div>
                )}
                <button
                  onClick={() => setViewDetailNoteId(note.id)}
                  className="mt-2 text-left"
                  style={{ color: "var(--accent-color)" }}
                >
                  Xem chi tiết →
                </button>
                <div className="flex sm:flex-wrap overflow-x-auto gap-1 mt-2">
                  <button
                    onClick={() => handleEdit(note)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => handleShare(note)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Chia sẻ
                  </button>
                  <button
                    onClick={() => handleDownload(note)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Tải xuống
                  </button>
                  <button
                    onClick={() => handleViewVersions(note)}
                    className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                    style={{
                      background: "var(--accent-color)",
                      color: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Lịch sử
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

       {/* Voice Notes */}
       <div className="mt-6">
       <h2
         className="text-xl font-bold mb-4 text-left"
         style={{ color: "var(--text-color)" }}
       >
         Ghi chú đính kèm (Voice)
       </h2>

       {/* Audio Notes Section */}
       <div className="mb-6">
         <h3
           className="text-lg font-semibold mb-2 text-left"
           style={{ color: "var(--text-color)" }}
         >
           Ghi chú âm thanh
         </h3>
         {isLoading ? (
           <div className="pro-spinner">
             <div></div>
             <div></div>
             <div></div>
             <div></div>
           </div>
         ) : sortNotes(
             filteredNotes.filter(
               (note) => note.note_type === "voice" && note.audio_url
             )
           ).length === 0 ? (
           <p style={{ color: "var(--text-color)" }}>
             Không có ghi chú âm thanh.
           </p>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {sortNotes(
               filteredNotes.filter(
                 (note) => note.note_type === "voice" && note.audio_url
               )
             ).map((note) => (
               <div
                 key={`audio-${note.id}`}
                 className={`p-4 shadow-md rounded-xl transition-transform duration-300 hover:shadow-lg transform hover:-translate-y-1 max-w-full flex flex-col justify-between h-[300px] ${
                   note.is_pinned ? "bg-[#E0E7FF]" : ""
                 }`}
                 style={{
                   background: note.is_pinned
                     ? "#E0E7FF"
                     : "var(--background)",
                   border: "1px solid var(--border-color)",
                 }}
                 onMouseEnter={() => setPreviewNoteId(note.id)}
                 onMouseLeave={() => setPreviewNoteId(null)}
               >
            <div className="relative">
              <h3
                className="font-semibold inline"
                style={{ color: "var(--text-color)" }}
              >
                🎙 {note.title}
              </h3>
              <button
                onClick={() => togglePin(note.id)}
                className={`absolute top-0 right-0 text-lg ${
                  note.is_pinned ? "text-[#A78BFA]" : "text-gray-400"
                } hover:text-[#A78BFA]`}
                title={note.is_pinned ? "Bỏ ghim" : "Ghim"}
              >
                📌
              </button>
            </div>
            <div
              className={`flex-1 overflow-y-auto ${
                previewNoteId === note.id ? "hidden" : ""
              }`}
            >
              <p
                className="line-clamp-2 min-h-[40px]"
                style={{ color: "var(--text-color)" }}
              >
                {note.content}
              </p>
              {previewNoteId !== note.id && (
                <div className="mt-2">
                  <p style={{ color: "var(--text-color)" }}>
                    Âm thanh: {note.audio_file_name || "Bản ghi âm"}
                  </p>
                  <audio controls src={note.audio_url} className="w-full" />
                </div>
              )}
            </div>
            {previewNoteId === note.id && (
              <div
                className="p-2 flex-1 overflow-y-auto"
                style={{
                  background: "var(--background)",
                  color: "var(--text-color)",
                }}
              >
                <h4 className="font-semibold">{note.title}</h4>
                <p>{note.content}</p>
                <small>Category: {note.category}</small>
                <div className="mt-2">
                  <p>Âm thanh: {note.audio_file_name || "Bản ghi âm"}</p>
                  <audio controls src={note.audio_url} className="w-full" />
                </div>
                {note.video_url && (
                  <div className="mt-2">
                    <p>Video: {note.video_file_name || "Video đính kèm"}</p>
                    <video
                      controls
                      src={note.video_url}
                      className="w-full h-[150px] object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            )}
            <div>
              <button
                onClick={() => setViewDetailNoteId(note.id)}
                className="mt-2 text-left"
                style={{ color: "var(--accent-color)" }}
              >
                Xem chi tiết →
              </button>
              <div className="flex sm:flex-wrap overflow-x-auto gap-1 mt-2">
                <button
                  onClick={() => handleEdit(note)}
                  className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                  style={{
                    background: "var(--accent-color)",
                    color: "var(--background)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                  style={{
                    background: "var(--accent-color)",
                    color: "var(--background)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  Xóa
                </button>
                <button
                  onClick={() => handleShare(note)}
                  className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                  style={{
                    background: "var(--accent-color)",
                    color: "var(--background)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  Chia sẻ
                </button>
                <button
                  onClick={() => handleDownload(note)}
                  className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                  style={{
                    background: "var(--accent-color)",
                    color: "var(--background)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  Tải xuống
                </button>
                <button
                  onClick={() => handleViewVersions(note)}
                  className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                  style={{
                    background: "var(--accent-color)",
                    color: "var(--background)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  Lịch sử
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>

      {/* Video Notes Section */}
      <div>
            <h3
              className="text-lg font-semibold mb-2 text-left"
              style={{ color: "var(--text-color)" }}
            >
              Ghi chú video
            </h3>
            {isLoading ? (
              <div className="pro-spinner">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            ) : sortNotes(
                filteredNotes.filter(
                  (note) => note.note_type === "voice" && note.video_url
                )
              ).length === 0 ? (
              <p style={{ color: "var(--text-color)" }}>
                Không có ghi chú video.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {sortNotes(
                  filteredNotes.filter(
                    (note) => note.note_type === "voice" && note.video_url
                  )
                ).map((note) => (
                  <div
                    key={`video-${note.id}`}
                    className={`p-4 shadow-md rounded-xl transition-transform duration-300 hover:shadow-lg transform hover:-translate-y-1 max-w-full flex flex-col justify-between h-[300px] ${
                      note.is_pinned ? "bg-[#E0E7FF]" : ""
                    }`}
                    style={{
                      background: note.is_pinned
                        ? "#E0E7FF"
                        : "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                    onMouseEnter={() => setPreviewNoteId(note.id)}
                    onMouseLeave={() => setPreviewNoteId(null)}
                  >
                <div className="relative">
                  <h3
                    className="font-semibold inline"
                    style={{ color: "var(--text-color)" }}
                  >
                    🎙 {note.title}
                  </h3>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`absolute top-0 right-0 text-lg ${
                      note.is_pinned ? "text-[#A78BFA]" : "text-gray-400"} hover:text-[#A78BFA]`}
                    title={note.is_pinned ? "Bỏ ghim" : "Ghim"}
                  >
                    📌
                  </button>
                </div>
                <div
                  className={`flex-1 overflow-y-auto ${
                    previewNoteId === note.id ? "hidden" : ""
                  }`}
                >
                  <p
                    className="line-clamp-2 min-h-[40px]"
                    style={{ color: "var(--text-color)" }}
                  >
                    {note.content}
                  </p>
                  {previewNoteId !== note.id && (
                    <div className="mt-2">
                      <p style={{ color: "var(--text-color)" }}>
                        Video: {note.video_file_name || "Video đính kèm"}
                      </p>
                      <video
                        controls
                        src={note.video_url}
                        className="w-full h-[150px] object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
                {previewNoteId === note.id && (
                  <div
                    className="p-2 flex-1 overflow-y-auto"
                    style={{
                      background: "var(--background)",
                      color: "var(--text-color)",
                    }}
                  >
                    <h4 className="font-semibold">{note.title}</h4>
                    <p>{note.content}</p>
                    <small>Category: {note.category}</small>
                    {note.audio_url && (
                      <div className="mt-2">
                        <p>Âm thanh: {note.audio_file_name || "Bản ghi âm"}</p>
                        <audio controls src={note.audio_url} className="w-full" />
                      </div>
                    )}
                    <div className="mt-2">
                      <p>Video: {note.video_file_name || "Video đính kèm"}</p>
                      <video
                        controls
                        src={note.video_url}
                        className="w-full h-[150px] object-cover rounded-md"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <button
                    onClick={() => setViewDetailNoteId(note.id)}
                    className="mt-2 text-left"
                    style={{ color: "var(--accent-color)" }}
                  >
                    Xem chi tiết →
                  </button>
                  <div className="flex sm:flex-wrap overflow-x-auto gap-1 mt-2">
                    <button
                      onClick={() => handleEdit(note)}
                      className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                      style={{
                        background: "var(--accent-color)",
                        color: "var(--background)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                      style={{
                        background: "var(--accent-color)",
                        color: "var(--background)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      Xóa
                    </button>
                    <button
                      onClick={() => handleShare(note)}
                      className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                      style={{
                        background: "var(--accent-color)",
                        color: "var(--background)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      Chia sẻ
                    </button>
                    <button
                      onClick={() => handleDownload(note)}
                      className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                      style={{
                        background: "var(--accent-color)",
                        color: "var(--background)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      Tải xuống
                    </button>
                    <button
                      onClick={() => handleViewVersions(note)}
                      className="min-w-[60px] px-2 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md sm:px-1 sm:text-xs"
                      style={{
                        background: "var(--accent-color)",
                        color: "var(--background)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      Lịch sử
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
      </div>
    );
  };

  const TrashDisplay = () => {
    return (
      <div className="mt-6">
        <h2
          className="text-xl font-bold mb-4 text-left"
          style={{ color: "var(--text-color)" }}
        >
          🗑️ Thùng Rác
        </h2>
        {isLoading ? (
          <div className="pro-spinner">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        ) : trashNotes.length === 0 ? (
          <p style={{ color: "var(--text-color)" }}>
            Thùng rác trống.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {trashNotes.map((note) => (
              <div
                key={note.id}
                className="rounded-xl p-4 shadow-sm max-w-full flex flex-col"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border-color)",
                }}
              >
              <h3
                className="font-semibold"
                style={{ color: "var(--text-color)" }}
              >
                {note.title}
              </h3>
              <p
                className="line-clamp-2 min-h-[40px]"
                style={{ color: "var(--text-color)" }}
              >
                {note.content}
              </p>
              <small style={{ color: "var(--text-color)" }}>
                Deleted at: {new Date(note.deleted_at).toLocaleString()}
              </small>
              <div className="flex gap-2 mt-3 justify-end">
                <button
                  onClick={() => handleRestore(note.id)}
                  className="min-w-[80px] px-3 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md"
                  style={{
                    background: "var(--accent-color)",
                    color: "var(--background)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  Khôi phục
                </button>
                <button
                  onClick={() => handlePermanentDelete(note.id)}
                  className="min-w-[80px] px-3 py-1 text-sm rounded-xl transition-all duration-300 hover:shadow-md"
                  style={{
                    background: "#EF4444",
                    color: "var(--background)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  Xóa vĩnh viễn
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    );
  };

  return (
      <div
        className="mt-[96px] p-5 max-w-8xl mx-auto rounded-xl shadow-lg"
        style={{
          background: "var(--background)",
          border: "2px solid var(--border-color)",
          color: "var(--text-color)",
        }}
      >
      <style jsx>{`
        .pro-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 80px;
          gap: 8px;
        }
        .pro-spinner div {
          width: 12px;
          height: 12px;
          background: linear-gradient(45deg, #93C5FD, #D8B4FE);
          border-radius: 50%;
          animation: wave 1.2s ease-in-out infinite;
        }
        .pro-spinner div:nth-child(1) { animation-delay: 0s; }
        .pro-spinner div:nth-child(2) { animation-delay: 0.1s; }
        .pro-spinner div:nth-child(3) { animation-delay: 0.2s; }
        .pro-spinner div:nth-child(4) { animation-delay: 0.3s; }
        @keyframes wave {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }
      `}</style>
      
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        🛠️ Quản lý Ghi Chú {isOffline && <span className="text-red-500">(Ngoại tuyến)</span>}
      </h1>

      {isLoading && (
        <div className="text-center text-lg mb-4" style={{ color: "var(--text-color)" }}>
          Đang tải...
        </div>
      )}

      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">📂 Danh Mục Ghi Chú</h2>
          <div className="flex items-center gap-2 relative">
            {isSearchOpen && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={advancedSearch.dateFrom}
                    onChange={(e) =>
                      setAdvancedSearch({ ...advancedSearch, dateFrom: e.target.value })
                    }
                    className="p-2 rounded-lg"
                    style={{
                      background: "var(--background)",
                      color: "var(--text-color)",
                      border: "1px solid var(--border-color)",
                    }}
                  />
                  <input
                    type="date"
                    value={advancedSearch.dateTo}
                    onChange={(e) =>
                      setAdvancedSearch({ ...advancedSearch, dateTo: e.target.value })
                    }
                    className="p-2 rounded-lg"
                    style={{
                      background: "var(--background)",
                      color: "var(--text-color)",
                      border: "1px solid var(--border-color)",
                    }}
                  />
                  <select
                    value={advancedSearch.noteType}
                    onChange={(e) =>
                      setAdvancedSearch({ ...advancedSearch, noteType: e.target.value })
                    }
                    className="p-2 rounded-lg"
                    style={{
                      background: "var(--background)",
                      color: "var(--text-color)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <option value="">Tất cả loại</option>
                    <option value="plain">Văn bản thuần</option>
                    <option value="rich">Văn bản phong phú</option>
                    <option value="whiteboard">Danh sách công việc</option>
                    <option value="spreadsheet">Bảng tính</option>
                    <option value="markdown">Markdown/Code</option>
                    <option value="voice">Đính kèm (Voice)</option>
                  </select>
                  <select
                    value={advancedSearch.isPinned === null ? "" : advancedSearch.isPinned}
                    onChange={(e) =>
                      setAdvancedSearch({
                        ...advancedSearch,
                        isPinned: e.target.value === "" ? null : e.target.value === "true",
                      })
                    }
                    className="p-2 rounded-lg"
                    style={{
                      background: "var(--background)",
                      color: "var(--text-color)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="true">Đã ghim</option>
                    <option value="false">Chưa ghim</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm ghi chú..."
                    className="w-96 p-2 rounded-lg transition-all duration-300"
                    style={{
                      background: "var(--background)",
                      color: "var(--text-color)",
                      border: "1px solid var(--border-color)",
                    }}
                  />
                </div>
              </div>
            )}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 rounded-full transition-all duration-300"
              style={{
                color: "var(--text-color)",
                background: "var(--background)",
                border: "1px solid var(--border-color)",
              }}
              title="Tìm kiếm ghi chú"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <button
              onClick={() => setIsTrashOpen(!isTrashOpen)}
              className="p-2 rounded-full transition-all duration-300"
              style={{
                color: "var(--text-color)",
                background: "var(--background)",
                border: "1px solid var(--border-color)",
              }}
              title="Xem thùng rác"
            >
              🗑️
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-full transition-all duration-300"
              style={{
                color: "var(--text-color)",
                background: "var(--background)",
                border: "1px solid var(--border-color)",
              }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v.01M12 12v.01M12 18v.01"
                />
              </svg>
            </button>
            {isMenuOpen && (
              <div
                className="absolute right-0 top-12 w-48 rounded-lg shadow-lg z-10"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <ul className="py-2">
                  <li
                    onClick={handleCreateCategory}
                    className="px-4 py-2 cursor-pointer flex items-center gap-2"
                    style={{ color: "var(--text-color)" }}
                  >
                    <span className="text-lg">➕</span> Thêm Danh Mục
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {categoryRows.map((row, rowIndex) => (
          <div key={rowIndex} className="mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {row.map((category) => (
                <div
                  key={category}
                  className={`p-4 shadow-lg rounded-xl cursor-pointer transition-transform duration-300 hover:scale-105 hover:shadow-xl ${
                    selectedCategory === category ? "border-2" : ""
                  }`}
                  style={{
                    background: selectedCategory === category
                      ? "var(--accent-color)"
                      : "var(--background)",
                    border: selectedCategory === category
                      ? "2px solid var(--border-color)"
                      : "1px solid var(--border-color)",
                    color: "var(--text-color)",
                  }}
                  onClick={() => handleCategoryClick(category)}
                >
                  <h3 className="font-semibold">
                    📒 {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h3>
                </div>
              ))}
            </div>
            {row.includes(selectedCategory) && selectedCategory && (
              <NotesDisplay category={selectedCategory} />
            )}
          </div>
        ))}

        {isTrashOpen && <TrashDisplay />}
      </div>

      {editingNote && (
    <div
      className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex justify-center items-center z-50"
      onClick={() => setEditingNote(null)}
    >
      <div
        className="p-6 rounded-xl shadow-lg w-full max-w-md animate-fadeIn"
        style={{
          background: "var(--background)",
          border: "2px solid var(--border-color)",
          color: "var(--text-color)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-center">
          Chỉnh sửa Ghi Chú
        </h2>
        <form onSubmit={handleEditSubmit}>
          <div className="mb-4">
            <label className="block mb-2 font-semibold" style={{ color: "var(--text-color)" }}>
              Tiêu đề
            </label>
            <input
              type="text"
              value={editingNote.newTitle}
              onChange={(e) =>
                setEditingNote({ ...editingNote, newTitle: e.target.value })
              }
              className="w-full p-2 rounded-lg"
              style={{
                background: "var(--background)",
                color: "var(--text-color)",
                border: "1px solid var(--border-color)",
              }}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-semibold" style={{ color: "var(--text-color)" }}>
              Nội dung
            </label>
            <textarea
              value={editingNote.newContent}
              onChange={(e) =>
                setEditingNote({ ...editingNote, newContent: e.target.value })
              }
              className="w-full p-2 rounded-lg resize-none"
              style={{
                background: "var(--background)",
                color: "var(--text-color)",
                border: "1px solid var(--border-color)",
              }}
              rows="5"
              required
            />
          </div>
          {editingNote.note_type === "rich" && (
            <div className="mb-4">
              <label className="block mb-2 font-semibold" style={{ color: "var(--text-color)" }}>
                Hình ảnh
              </label>
              {editingNote.currentImageUrl && (
                <div className="mb-2">
                  <img
                    src={editingNote.currentImageUrl}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-xl"
                  />
                </div>
              )}
              <input
      
      type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setEditingNote({ ...editingNote, newImageFile: file });
                    handleImageChange(file);
                  }
                }}
                className="w-full p-2 rounded-lg"
                style={{
                  background: "var(--background)",
                  color: "var(--text-color)",
                  border: "1px solid var(--border-color)",
                }}
              />
            </div>
          )}
          {editingNote.note_type === "voice" && (
  <>
          {editingNote.hasAudio && !editingNote.hasVideo && (
            <div className="mb-4">
              <label className="block mb-2 font-semibold" style={{ color: "var(--text-color)" }}>
                Âm thanh
              </label>
              {editingNote.currentAudioUrl && (
                <div className="mb-2">
                  <p>{editingNote.audio_file_name}</p>
                  <audio controls src={editingNote.currentAudioUrl} className="w-full" />
                </div>
              )}
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => handleAudioChange(e.target.files[0])}
                className="w-full p-2 rounded-lg"
                style={{
                  background: "var(--background)",
                  color: "var(--text-color)",
                  border: "1px solid var(--border-color)",
                }}
              />
            </div>
          )}
          {editingNote.hasVideo && !editingNote.hasAudio && (
            <div className="mb-4">
              <label className="block mb-2 font-semibold" style={{ color: "var(--text-color)" }}>
                Video
              </label>
              {editingNote.currentVideoUrl && (
                <div className="mb-2">
                  <p>{editingNote.video_file_name}</p>
                  <video
                    controls
                    src={editingNote.currentVideoUrl}
                    className="w-full h-32 object-cover rounded-xl"
                  />
                </div>
              )}
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleVideoChange(e.target.files[0])}
                className="w-full p-2 rounded-lg"
                style={{
                  background: "var(--background)",
                  color: "var(--text-color)",
                  border: "1px solid var(--border-color)",
                }}
              />
            </div>
          )}
        </>
      )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingNote(null)}
              className="px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-md"
              style={{
                background: "#EF4444",
                color: "var(--background)",
                border: "1px solid var(--border-color)",
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-md"
              style={{
                background: "var(--accent-color)",
                color: "var(--background)",
                border: "1px solid var(--border-color)",
              }}
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

      {viewDetailNoteId && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex justify-center items-center z-50"
          onClick={() => setViewDetailNoteId(null)}
        >
          <div
            className="p-6 rounded-xl shadow-lg w-full max-w-2xl animate-fadeIn"
            style={{
              background: "var(--background)",
              border: "2px solid var(--border-color)",
              color: "var(--text-color)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ChiTiet
              note={notes.find((n) => n.id === viewDetailNoteId)}
              onClose={() => setViewDetailNoteId(null)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShare={handleShare}
              onDownload={handleDownload}
              onViewVersions={handleViewVersions}
            />
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex justify-center items-center z-50"
          onClick={cancelDelete}
        >
          <div
            className="p-6 rounded-xl shadow-lg w-full max-w-md animate-fadeIn"
            style={{
              background: "var(--background)",
              border: "2px solid var(--border-color)",
              color: "var(--text-color)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-center">
              Xác nhận Xóa
            </h2>
            <p className="mb-4">
              Bạn có chắc muốn chuyển ghi chú này vào thùng rác?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-md"
                style={{
                  background: "#EF4444",
                  color: "var(--background)",
                  border: "1px solid var(--border-color)",
                }}
              >
                Hủy
              </button>
              <button
                               onClick={confirmDelete}
                               className="px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-md"
                               style={{
                                 background: "var(--accent-color)",
                                 color: "var(--background)",
                                 border: "1px solid var(--border-color)",
                               }}
                             >
                               Xóa
                             </button>
                           </div>
                         </div>
                       </div>
                     )}
               
                     {viewVersionNote && (
                       <div
                         className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex justify-center items-center z-50"
                         onClick={() => setViewVersionNote(null)}
                       >
                         <div
                           className="p-6 rounded-xl shadow-lg w-full max-w-2xl animate-fadeIn"
                           style={{
                             background: "var(--background)",
                             border: "2px solid var(--border-color)",
                             color: "var(--text-color)",
                           }}
                           onClick={(e) => e.stopPropagation()}
                         >
                           <h2 className="text-2xl font-bold mb-4 text-center">
                             Lịch sử Phiên bản
                           </h2>
                           <div className="max-h-[400px] overflow-y-auto">
                             {viewVersionNote.versions.map((version, index) => (
                               <div
                                 key={index}
                                 className={`p-4 mb-2 rounded-lg cursor-pointer ${
                                   viewVersionNote.selectedVersion === index
                                     ? "border-2 border-[var(--accent-color)]"
                                     : ""
                                 }`}
                                 style={{
                                   background: "var(--background)",
                                   border: viewVersionNote.selectedVersion === index
                                     ? "2px solid var(--accent-color)"
                                     : "1px solid var(--border-color)",
                                 }}
                                 onClick={() =>
                                   setViewVersionNote({
                                     ...viewVersionNote,
                                     selectedVersion: index,
                                   })
                                 }
                               >
                                 <h3 className="font-semibold">{version.title}</h3>
                                 <p className="line-clamp-2">{version.content}</p>
                                 <small>
                                   Cập nhật: {new Date(version.timestamp).toLocaleString()}
                                 </small>
                               </div>
                             ))}
                           </div>
                           <div className="flex justify-end gap-2 mt-4">
                             <button
                               onClick={() => setViewVersionNote(null)}
                               className="px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-md"
                               style={{
                                 background: "#EF4444",
                                 color: "var(--background)",
                                 border: "1px solid var(--border-color)",
                               }}
                             >
                               Đóng
                             </button>
                             <button
                               onClick={handleRestoreVersion}
                               className="px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-md"
                               style={{
                                 background: "var(--accent-color)",
                                 color: "var(--background)",
                                 border: "1px solid var(--border-color)",
                               }}
                               disabled={viewVersionNote.selectedVersion === null}
                             >
                               Khôi phục
                             </button>
                           </div>
                         </div>
                       </div>
                     )}
               
                     {notification && (
                       <div
                         className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg animate-fadeIn"
                         style={{
                           background: "var(--accent-color)",
                           color: "var(--background)",
                           border: "1px solid var(--border-color)",
                         }}
                       >
                         {notification}
                       </div>
                     )}
                     <ThemeSettings />
                   </div>
                 );
               }


