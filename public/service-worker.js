"use client";
import { useState, useEffect } from "react";
import { supabase2 } from "../../../lib/supabase";
import ChiTiet from "../../components/details";
import ThemeSettings from "../../components/ThemeSettings";
import { openDB } from 'idb'; // Thư viện IndexedDB

export default function ManageNotes() {
  // Trạng thái hiện có
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [viewDetailNoteId, setViewDetailNoteId] = useState(null);
  const [pinnedNotes, setPinnedNotes] = useState(new Set());
  const [categories, setCategories] = useState(["personal", "study", "entertainment", "upload"]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Trạng thái cho chế độ ngoại tuyến
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

  const categoryMap = {
    1: "personal",
    2: "study",
    3: "entertainment",
    4: "upload",
  };

  // Hàm hiển thị thông báo tùy chỉnh
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Khởi tạo IndexedDB
  const initDB = async () => {
    const db = await openDB('notesDB', 1, {
      upgrade(db) {
        db.createObjectStore('notes', { keyPath: 'id' });
        db.createObjectStore('changes', { autoIncrement: true });
      },
    });
    return db;
  };

  // Lưu ghi chú vào IndexedDB
  const saveToIndexedDB = async (notes) => {
    const db = await initDB();
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    notes.forEach((note) => store.put(note));
    await tx.done;
    console.log('Saved notes to IndexedDB:', notes);
  };

  // Lưu thay đổi ngoại tuyến vào IndexedDB
  const saveOfflineChange = async (change) => {
    const db = await initDB();
    const tx = db.transaction('changes', 'readwrite');
    const store = tx.objectStore('changes');
    await store.add(change);
    setOfflineChanges((prev) => [...prev, change]);
    await tx.done;
  };

  // Hàm retry cho Supabase requests
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

  // Đồng bộ thay đổi khi online
  const syncOfflineChanges = async () => {
    const db = await initDB();
    const readTx = db.transaction('changes', 'readwrite');
    const readStore = readTx.objectStore('changes');
    const changes = await readStore.getAll();
    await readTx.done; // Ensure read transaction is complete

    for (const change of changes) {
      try {
        if (change.type === 'update') {
          const { error } = await supabase2
            .from("notess")
            .update({
              ...change.data,
              updated_at: new Date().toISOString(),
            })
            .eq("id", change.id);
          if (error) {
            console.error('Supabase update error:', error.message, error.code, error.details, error.hint);
            throw error;
          }
        } else if (change.type === 'delete') {
          const { error } = await supabase2
            .from("notess")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", change.id);
          if (error) {
            console.error('Supabase delete error:', error.message, error.code, error.details, error.hint);
            throw error;
          }
        }
      } catch (err) {
        console.error("Error syncing change:", err.message, err.stack);
        showNotification("Lỗi khi đồng bộ thay đổi: " + (err.message || 'Unknown error'));
      }
    }

    // Clear changes in a new transaction
    try {
      const clearTx = db.transaction('changes', 'readwrite');
      const clearStore = clearTx.objectStore('changes');
      await clearStore.clear();
      await clearTx.done;
      console.log('Cleared offline changes from IndexedDB');
    } catch (err) {
      console.error('Error clearing changes store:', err.message, err.stack);
      showNotification("Lỗi khi xóa thay đổi cục bộ: " + (err.message || 'Unknown error'));
    }

    setOfflineChanges([]);
    fetchNotes();
    showNotification("Đã đồng bộ tất cả thay đổi!");
  };

  // Đăng ký Service Worker và xử lý trạng thái mạng
  useEffect(() => {
    /*
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
    */

    const handleOnline = () => {
      setIsOffline(false);
      showNotification("Đã kết nối lại! Đang đồng bộ dữ liệu...");
      syncOfflineChanges();
    };
    const handleOffline = () => {
      setIsOffline(true);
      showNotification("Bạn đang ở chế độ ngoại tuyến. Các thay đổi sẽ được đồng bộ khi có mạng.");
    };

    window.addEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    // Kiểm tra phiên người dùng Supabase
    const checkSession = async () => {
      const { data: { session }, error } = await supabase2.auth.getSession();
      if (error) {
        console.error('Supabase session error:', error.message);
        showNotification("Lỗi xác thực Supabase: " + (error.message || 'Unknown error'));
      } else if (!session) {
        console.warn('No active Supabase session');
        showNotification("Không có phiên đăng nhập Supabase. Vui lòng đăng nhập.");
      }
    };
    checkSession();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch ghi chú từ Supabase hoặc IndexedDB
  const fetchNotes = async () => {
    setIsLoading(true);
    if (isOffline) {
      const db = await initDB();
      const tx = db.transaction('notes', 'readonly');
      const store = tx.objectStore('notes');
      const offlineNotes = await store.getAll();
      setNotes(offlineNotes || []);
      showNotification("Đang tải ghi chú từ bộ nhớ cục bộ (ngoại tuyến).");
      setIsLoading(false);
      return;
    }

    try {
      const fetchFn = async () => {
        console.log('Fetching notes from Supabase...');
        const { data, error } = await supabase2
          .from("notess")
          .select(
            "id, title, content, image_url, created_at, updated_at, category_id, note_type, todos, spreadsheet_data, versions, deleted_at"
          )
          .is("deleted_at", null)
          .order("updated_at", { ascending: false });

        if (error) {
          console.error('Supabase fetch notes error:', error.message, error.code, error.details, error.hint);
          throw new Error(error.message || 'Unknown Supabase error');
        }
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
            console.error(`Error parsing todos for note ${note.id}:`, e.message, note.todos);
            parsedTodos = [];
          }
        }

        if (note.spreadsheet_data) {
          try {
            parsedSpreadsheetData = JSON.parse(note.spreadsheet_data);
            if (!Array.isArray(parsedSpreadsheetData))
              parsedSpreadsheetData = Array(10).fill().map(() => Array(10).fill(""));
          } catch (e) {
            console.error(`Error parsing spreadsheet_data for note ${note.id}:`, e.message, note.spreadsheet_data);
            parsedSpreadsheetData = Array(10).fill().map(() => Array(10).fill(""));
          }
        }

        if (note.versions) {
          try {
            parsedVersions = JSON.parse(note.versions);
            if (!Array.isArray(parsedVersions)) parsedVersions = [];
          } catch (e) {
            console.error(`Error parsing versions for note ${note.id}:`, e.message, note.versions);
            parsedVersions = [];
          }
        }

        return {
          ...note,
          todos: parsedTodos,
          spreadsheet_data: parsedSpreadsheetData,
          versions: parsedVersions,
          category: categoryMap[note.category_id] || "personal",
        };
      });

      setNotes(parsedNotes);
      saveToIndexedDB(parsedNotes);
      showNotification("Đã tải ghi chú từ Supabase.");
    } catch (err) {
      console.error("Error fetching notes:", err.message, err.stack);
      showNotification("Lỗi khi tải ghi chú từ Supabase: " + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch ghi chú trong thùng rác
  const fetchTrashNotes = async () => {
    if (isOffline) {
      showNotification("Không thể tải thùng rác ở chế độ ngoại tuyến.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const fetchFn = async () => {
        console.log('Fetching trash notes from Supabase...');
        const { data, error } = await supabase2
          .from("notess")
          .select(
            "id, title, content, image_url, created_at, updated_at, category_id, note_type, todos, spreadsheet_data, deleted_at"
          )
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false });

        if (error) {
          console.error('Supabase fetch trash notes error:', error.message, error.code, error.details, error.hint);
          throw new Error(error.message || 'Unknown Supabase error');
        }
        return data;
      };

      const data = await withRetry(fetchFn);
      setTrashNotes(data || []);
      showNotification("Đã tải ghi chú trong thùng rác.");
    } catch (err) {
      console.error("Error fetching trash notes:", err.message, err.stack);
      showNotification("Lỗi khi tải ghi chú trong thùng rác: " + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    if (!isOffline) fetchTrashNotes();
  }, [isOffline]);

  const togglePin = (noteId) => {
    setPinnedNotes((prev) => {
      const newPinned = new Set(prev);
      if (newPinned.has(noteId)) {
        newPinned.delete(noteId);
      } else {
        newPinned.add(noteId);
      }
      return newPinned;
    });
  };

  const handleEdit = (note) => {
    setEditingNote({
      ...note,
      newTitle: note.title,
      newContent: note.content,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editingNote.newTitle && editingNote.newContent) {
      try {
        const currentVersions = editingNote.versions || [];
        const newVersion = {
          title: editingNote.title,
          content: editingNote.content,
          updated_at: editingNote.updated_at,
          timestamp: new Date().toISOString(),
        };

        const updatedData = {
          title: editingNote.newTitle,
          content: editingNote.newContent,
          versions: JSON.stringify([...currentVersions, newVersion]),
          updated_at: new Date().toISOString(),
        };

        if (isOffline) {
          await saveOfflineChange({ type: 'update', id: editingNote.id, data: updatedData });
          setNotes((prev) =>
            prev.map((n) =>
              n.id === editingNote.id ? { ...n, ...updatedData } : n
            )
          );
          showNotification("Ghi chú đã được cập nhật cục bộ, sẽ đồng bộ khi có mạng.");
          setEditingNote(null);
          return;
        }

        const { error } = await supabase2
          .from("notess")
          .update(updatedData)
          .eq("id", editingNote.id);

        if (error) {
          console.error('Supabase update note error:', error.message, error.code, error.details, error.hint);
          throw error;
        }
        fetchNotes();
        showNotification("Ghi chú đã được cập nhật thành công!");
        setEditingNote(null);
      } catch (err) {
        console.error("Error updating note:", err.message, err.stack);
        showNotification("Lỗi khi cập nhật ghi chú: " + (err.message || 'Unknown error'));
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
        await saveOfflineChange({ type: 'delete', id: noteId });
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        showNotification("Ghi chú đã được chuyển vào thùng rác cục bộ, sẽ đồng bộ khi có mạng.");
        setShowDeleteConfirm(null);
        return;
      }

      const { error } = await supabase2
        .from("notess")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", noteId);

      if (error) {
        console.error('Supabase delete note error:', error.message, error.code, error.details, error.hint);
        throw error;
      }
      fetchNotes();
      fetchTrashNotes();
      showNotification("Ghi chú đã được chuyển vào thùng rác thành công!");
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error("Error moving note to trash:", err.message, err.stack);
      showNotification("Lỗi khi chuyển ghi chú vào thùng rác: " + (err.message || 'Unknown error'));
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

      if (error) {
        console.error('Supabase restore note error:', error.message, error.code, error.details, error.hint);
        throw error;
      }
      fetchNotes();
      fetchTrashNotes();
      showNotification("Ghi chú đã được khôi phục thành công!");
    } catch (err) {
      console.error("Error restoring note:", err.message, err.stack);
      showNotification("Lỗi khi khôi phục ghi chú: " + (err.message || 'Unknown error'));
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

        if (error) {
          console.error('Supabase permanent delete error:', error.message, error.code, error.details, error.hint);
          throw error;
        }
        fetchTrashNotes();
        showNotification("Ghi chú đã được xóa vĩnh viễn!");
      } catch (err) {
        console.error("Error permanently deleting note:", err.message, err.stack);
        showNotification("Lỗi khi xóa vĩnh viễn ghi chú: " + (err.message || 'Unknown error'));
      }
    }
  };

  const handleViewVersions = (note) => {
    if (!note.versions || note.versions.length === 0) {
      showNotification("Không có lịch sử phiên bản cho ghi chú này.");
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
        await saveOfflineChange({ type: 'update', id: viewVersionNote.id, data: updatedData });
        setNotes((prev) =>
          prev.map((n) =>
            n.id === viewVersionNote.id ? { ...n, ...updatedData } : n
          )
        );
        showNotification("Phiên bản đã được khôi phục cục bộ, sẽ đồng bộ khi có mạng.");
        setViewVersionNote(null);
        return;
      }

      const { error } = await supabase2
        .from("notess")
        .update(updatedData)
        .eq("id", viewVersionNote.id);

      if (error) {
        console.error('Supabase restore version error:', error.message, error.code, error.details, error.hint);
        throw error;
      }
      fetchNotes();
      showNotification("Phiên bản đã được khôi phục thành công!");
      setViewVersionNote(null);
    } catch (err) {
      console.error("Error restoring version:", err.message, err.stack);
      showNotification("Lỗi khi khôi phục phiên bản: " + (err.message || 'Unknown error'));
    }
  };

  const handleShare = (note) => {
    const shareText = `${note.title}\n${note.content}\nCategory: ${note.category}`;
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
        .then(() => showNotification("Nội dung ghi chú đã được sao chép vào clipboard!"))
        .catch((err) => {
          console.error("Error copying to clipboard:", err.message);
          showNotification("Lỗi khi sao chép nội dung ghi chú.");
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

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${note.title}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const handleCreateCategory = () => {
    const newCategory = prompt("Nhập tên danh mục mới:");
    if (newCategory && newCategory.trim() !== "") {
      const formattedCategory = newCategory.trim().toLowerCase();
      if (categories.includes(formattedCategory)) {
        showNotification("Danh mục này đã tồn tại!");
      } else {
        setCategories((prev) => [...prev, formattedCategory]);
        showNotification(`Danh mục "${newCategory}" đã được tạo thành công!`);
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
          ? pinnedNotes.has(note.id) === advancedSearch.isPinned
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
      if (pinnedNotes.has(a.id) && !pinnedNotes.has(b.id)) return -1;
      if (!pinnedNotes.has(a.id) && pinnedNotes.has(b.id)) return 1;
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
      <div className="mt-6">
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
          <div className="flex flex-col gap-4">
            {sortNotes(
              filteredNotes.filter(
                (note) => !note.image_url && note.note_type === "plain"
              )
            ).map((note) => (
              <div
                key={note.id}
                className={`rounded-xl p-4 relative shadow-sm max-w-full flex flex-col transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                  pinnedNotes.has(note.id) ? "bg-[#E0E7FF]" : ""
                }`}
                style={{
                  background: pinnedNotes.has(note.id) ? "#E0E7FF" : "var(--background)",
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
                      pinnedNotes.has(note.id)
                        ? "text-[#A78BFA]"
                        : "text-gray-400"
                    } hover:text-[#A78BFA]`}
                    title={pinnedNotes.has(note.id) ? "Bỏ ghim" : "Ghim"}
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
        </div>

        {/* Rich Notes */}
        <div className="mt-6">
          <h2
            className="text-xl font-bold mb-4 text-left"
            style={{ color: "var(--text-color)" }}
          >
            Ghi chú văn bản phong phú
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortNotes(
              filteredNotes.filter(
                (note) => note.image_url && note.note_type === "rich"
              )
            ).map((note) => (
              <div
                key={note.id}
                className={`p-4 shadow-md rounded-xl transition-transform duration-300 hover:shadow-lg transform hover:-translate-y-1 max-w-full flex flex-col ${
                  pinnedNotes.has(note.id) ? "bg-[#E0E7FF]" : ""
                }`}
                style={{
                  background: pinnedNotes.has(note.id) ? "#E0E7FF" : "var(--background)",
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
                      pinnedNotes.has(note.id)
                        ? "text-[#A78BFA]"
                        : "text-gray-400"
                    } hover:text-[#A78BFA]`}
                    title={pinnedNotes.has(note.id) ? "Bỏ ghim" : "Ghim"}
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
        </div>

        {/* Whiteboard Notes */}
        <div className="mt-6">
          <h2
            className="text-xl font-bold mb-4 text-left"
            style={{ color: "var(--text-color)" }}
          >
            Ghi chú danh sách công việc
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortNotes(
              filteredNotes.filter((note) => note.note_type === "whiteboard")
            ).map((note) => (
              <div
                key={note.id}
                className={`p-4 shadow-md rounded-xl transition-transform duration-300 hover:shadow-lg transform hover:-translate-y-1 max-w-full flex flex-col ${
                  pinnedNotes.has(note.id) ? "bg-[#E0E7FF]" : ""
                }`}
                style={{
                  background: pinnedNotes.has(note.id) ? "#E0E7FF" : "var(--background)",
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
                      pinnedNotes.has(note.id)
                        ? "text-[#A78BFA]"
                        : "text-gray-400"
                    } hover:text-[#A78BFA]`}
                    title={pinnedNotes.has(note.id) ? "Bỏ ghim" : "Ghim"}
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
        </div>

        {/* Spreadsheet Notes */}
        <div className="mt-6">
          <h2
            className="text-xl font-bold mb-4 text-left"
            style={{ color: "var(--text-color)" }}
          >
            Ghi chú bảng tính
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortNotes(
              filteredNotes.filter((note) => note.note_type === "spreadsheet")
            ).map((note) => (
              <div
                key={note.id}
                className={`p-4 shadow-md rounded-xl transition-transform duration-300 hover:shadow-lg transform hover:-translate-y-1 max-w-full flex flex-col ${
                  pinnedNotes.has(note.id) ? "bg-[#E0E7FF]" : ""
                }`}
                style={{
                  background: pinnedNotes.has(note.id) ? "#E0E7FF" : "var(--background)",
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
                      pinnedNotes.has(note.id)
                        ? "text-[#A78BFA]"
                        : "text-gray-400"
                    } hover:text-[#A78BFA]`}
                    title={pinnedNotes.has(note.id) ? "Bỏ ghim" : "Ghim"}
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

      {/* Form chỉnh sửa với nền trong suốt */}
      {editingNote && (
        <div 
          className="fixed top-0 left-0 w-full h-full bg-transparent flex justify-center items-center z-50"
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

      {/* Modal xác nhận xóa với nền trong suốt */}
      {showDeleteConfirm && (
        <div 
          className="fixed top-0 left-0 w-full h-full bg-transparent flex justify-center items-center z-50"
          onClick={cancelDelete}
        >
          <div
            className="p-6 rounded-xl shadow-lg w-full max-w-sm animate-fadeIn"
            style={{
              background: "var(--background)",
              border: "2px solid var(--border-color)",
              color: "var(--text-color)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 text-center">
              Xác nhận xóa
            </h2>
            <p className="mb-4 text-center">
              Bạn có chắc muốn chuyển ghi chú này vào thùng rác?
            </p>
            <div className="flex justify-center gap-4">
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
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem lịch sử phiên bản với nền trong suốt */}
      {viewVersionNote && (
        <div 
          className="fixed top-0 left-0 w-full h-full bg-transparent flex justify-center items-center z-50"
          onClick={() => setViewVersionNote(null)}
        >
          <div
            className="p-6 rounded-xl shadow-lg w-full max-w-lg animate-fadeIn"
            style={{
              background: "var(--background)",
              border: "2px solid var(--border-color)",
              color: "var(--text-color)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-center">
              Lịch sử phiên bản - {viewVersionNote.title}
            </h2>
            <div className="max-h-96 overflow-y-auto">
              {viewVersionNote.versions.map((version, index) => (
                <div
                  key={index}
                  className={`p-4 mb-2 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md ${
                    viewVersionNote.selectedVersion === index ? "bg-[#E0E7FF]" : ""
                  }`}
                  style={{
                    background: viewVersionNote.selectedVersion === index ? "#E0E7FF" : "var(--background)",
                    border: "1px solid var(--border-color)",
                  }}
                  onClick={() => setViewVersionNote({ ...viewVersionNote, selectedVersion: index })}
                >
                  <p><strong>Tiêu đề:</strong> {version.title}</p>
                  <p><strong>Nội dung:</strong> {version.content}</p>
                  <p><strong>Cập nhật lúc:</strong> {new Date(version.timestamp).toLocaleString()}</p>
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
              >
                Khôi phục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem chi tiết ghi chú */}
      {viewDetailNoteId && (
        <div 
          className="fixed top-0 left-0 w-full h-full bg-transparent flex justify-center items-center z-50"
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
            <ChiTiet note={notes.find((note) => note.id === viewDetailNoteId)} />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setViewDetailNoteId(null)}
                className="px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-md"
                style={{
                  background: "#EF4444",
                  color: "var(--background)",
                  border: "1px solid var(--border-color)",
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thông báo tùy chỉnh */}
      {notification && (
        <div 
          className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg animate-fadeIn"
          style={{
            background: "var(--accent-color)",
            color: "var(--background)",
            border: "1px solid var(--border-color)",
          }}
        >
          <p>{notification}</p>
          <button
            onClick={() => setNotification(null)}
            className="mt-2 px-4 py-1 rounded-lg transition-all duration-300 hover:shadow-md"
            style={{
              background: "var(--background)",
              color: "var(--text-color)",
              border: "1px solid var(--border-color)",
            }}
          >
            OK
          </button>
        </div>
      )}

      {/* Component ThemeSettings */}
      <ThemeSettings />
    </div>
  );
}