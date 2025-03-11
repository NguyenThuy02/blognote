"use client";

import { useState, useEffect } from "react";
import { supabase } from '../../../lib/supabase';
import {
  FaFileImport,
  FaShareAlt,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaFileExport,
  FaBars,
} from "react-icons/fa";
import mammoth from 'mammoth'; // For Word docx extraction
import * as pdfjsLib from 'pdfjs-dist'; // For PDF extraction
import Image from 'next/image';

// Set up pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const NoteApp = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState([]);
  const [sortBy, setSortBy] = useState("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [imageUploadVisible, setImageUploadVisible] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [noteTypeMenu, setNoteTypeMenu] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, content, image_url, created_at, updated_at, category_id, font_style, font_size")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error("Error fetching notes:", err.message);
      setError("Không thể tải ghi chú.");
    }
  };

  const handleSaveNote = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Tiêu đề và nội dung không được để trống.");
      return;
    }

    try {
      const noteData = {
        title: title.trim(),
        content: content.trim(),
        image_url: uploadedImages.length > 0 ? uploadedImages[uploadedImages.length - 1] : null, // Lấy URL hình ảnh mới nhất
        updated_at: new Date().toISOString()
      };

      console.log('Saving note with data:', noteData);

      if (editingId !== null) {
        // Cập nhật ghi chú
        const { data, error } = await supabase
          .from("notes")
          .update(noteData)
          .eq("id", editingId)
          .select()
          .single();

        if (error) throw error;

        // Cập nhật state
        setNotes(notes.map(note => 
          note.id === editingId ? { ...note, ...data } : note
        ));
        setEditingId(null);
      } else {
        // Tạo ghi chú mới
        const { data, error } = await supabase
          .from("notes")
          .insert([noteData])
          .select()
          .single();

        if (error) throw error;

        // Thêm ghi chú mới vào đầu danh sách
        setNotes([data, ...notes]);
      }

      // Reset form
      setTitle("");
      setContent("");
      setUploadedImages([]); // Reset uploaded images
      setImageUploadVisible(false);
      setEditingIndex(null);
      setError("");

      console.log('Note saved successfully');
    } catch (err) {
      console.error("Error saving note:", err);
      setError("Có lỗi khi lưu ghi chú: " + err.message);
    }
  };

  const handleDeleteNote = async (index) => {
    const noteId = notes[index].id;
    if (!confirm("Bạn có chắc muốn xóa ghi chú này không?")) return;

    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId);
      if (error) throw error;
      setNotes(notes.filter((_, i) => i !== index));
      setError("");
    } catch (err) {
      console.error("Error deleting note:", err.message);
      setError("Không thể xóa ghi chú.");
    }
  };

  const handleEditNote = (index) => {
    const note = notes[index];
    setTitle(note.title);
    setContent(note.content);
    setUploadedImages(note.image_url ? [note.image_url] : []); // Load image URL if exists
    setEditingIndex(index);
    setEditingId(note.id);
    setImageUploadVisible(true); // Show image upload section when editing
    setError("");
  };

  const handleExportNotes = () => {
    const text = notes
      .map(
        (note) =>
          `Tiêu đề: ${note.title}\nNội dung: ${
            note.content
          }\nNgày cập nhật: ${new Date(note.updated_at).toLocaleString()}\n---\n`
      )
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ghi-chu.txt";
    link.click();
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    try {
      const uploadPromises = files.map(async (file) => {
        // Kiểm tra kích thước file
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error("File quá lớn. Vui lòng chọn file nhỏ hơn 10MB");
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'blognote'); // Thay đổi thành upload preset của bạn
        formData.append('cloud_name', 'dlaoxrnad');

        const response = await fetch(
          'https://api.cloudinary.com/v1_1/dlaoxrnad/image/upload',
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Upload error details:', errorData);
          throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('Upload successful:', data);
        return data.secure_url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      console.log('All uploads completed:', uploadedUrls);
      setUploadedImages(prev => [...prev, ...uploadedUrls]);
      setError("");
    } catch (err) {
      console.error("Error uploading images:", err);
      setError(err.message || "Không thể tải lên hình ảnh. Vui lòng thử lại.");
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const fileType = file.type;

    try {
      if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
        const fileReader = new FileReader();
        fileReader.onload = async () => {
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
          setError("");
        };
        fileReader.readAsArrayBuffer(file);
      } else if (
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileName.endsWith(".docx")
      ) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setTitle(file.name.replace(".docx", ""));
        setContent(result.value.trim());
        setError("");
      } else if (fileType === "application/msword" || fileName.endsWith(".doc")) {
        setError("Tệp .doc không được hỗ trợ trực tiếp. Vui lòng chuyển đổi sang .docx.");
      } else {
        setError("Chỉ hỗ trợ tệp Word (.docx) hoặc PDF.");
      }
    } catch (err) {
      console.error("Error importing file:", err.message);
      if (err.message.includes("Could not find the body element")) {
        setError("Tệp Word không hợp lệ hoặc bị hỏng. Vui lòng kiểm tra lại.");
      } else {
        setError("Không thể nhập tệp. Vui lòng thử lại.");
      }
    }
  };

  const handleShareNote = () => {
    if (!title || !content) {
      setError("Vui lòng nhập tiêu đề và nội dung trước khi chia sẻ.");
      return;
    }

    const shareData = {
      title: title,
      text: content,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() => console.log("Chia sẻ thành công!"))
        .catch((err) => console.error("Lỗi khi chia sẻ:", err));
    } else {
      const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
      navigator.clipboard.writeText(shareText).then(() => {
        alert("Đã sao chép ghi chú vào clipboard!");
      }).catch((err) => {
        console.error("Lỗi khi sao chép:", err);
        setError("Không thể sao chép ghi chú.");
      });
    }
  };

  const sortedNotes = [...notes]
    .filter(
      (note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return new Date(b.updated_at) - new Date(a.updated_at);
    });

  return (
    <div className="mt-[96px] p-5 mb-[-7px] max-w-7xl mx-auto p-8 border border-gray-300 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6">Ứng dụng Ghi chú</h1>
      <div className="flex space-x-4 text-blue-600 mb-4 relative">
        <div className="relative">
          <button
            onClick={() => setNoteTypeMenu(!noteTypeMenu)}
            className="btn-gradient"
          >
            <FaBars /> <span>Tạo Ghi Chú</span>
          </button>
          {noteTypeMenu && (
            <div className="absolute left-0 mt-2 bg-white border border-light-blue-300 rounded-lg shadow-lg w-48">
              <button className="dropdown-item hover:bg-light-blue-100">📝 Ghi chú văn bản thuần</button>
              <button className="dropdown-item hover:bg-light-blue-100">🖋 Ghi chú văn bản phong phú</button>
              <button className="dropdown-item hover:bg-light-blue-100">🎨 Ghi chú bảng trắng</button>
              <button className="dropdown-item hover:bg-light-blue-100">📊 Ghi chú bảng tính</button>
            </div>
          )}
        </div>
      </div>

      <input
        type="text"
        placeholder="Tiêu đề ghi chú"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setError("");
        }}
        className="w-full border-2 border-transparent p-4 rounded-xl mb-4 font-bold text-lg transition duration-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-300"
      />

      <div className="flex space-x-4 text-blue-600 mb-4">
        <button
          onClick={() => setImageUploadVisible(!imageUploadVisible)}
          className="btn-gradient"
        >
          <FaPlus /> <span>Chèn ảnh</span>
        </button>
        <label className="btn-gradient cursor-pointer">
          <FaFileImport /> <span>Nhập Word/PDF</span>
          <input
            type="file"
            accept=".doc,.docx,application/pdf"
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
      </div>

      {imageUploadVisible && (
        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="mb-2"
          />
          <div className="flex flex-wrap">
            {uploadedImages.map((image, index) => (
                <Image
                  key={index}
                  src={image}
                  alt={`Uploaded preview ${index}`}
                  width={80}  // Equivalent to w-20 (20 * 4px)
                  height={80} // Equivalent to h-20
                  className="object-cover rounded-md mr-2 mb-2"
                />
              ))}
          </div>
        </div>
      )}

      <textarea
        placeholder="Nội dung ghi chú"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setError("");
        }}
        className="w-full h-56 border-2 border-transparent p-4 rounded-xl transition duration-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-300"
      />

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
          <h2 className="font-bold text-2xl text-blue-600">📌 Ghi chú đã lưu</h2>
          <ul>
            {sortedNotes.length > 0 ? (
              sortedNotes.map((note, index) => (
                <li
                  key={note.id}
                  className="border-2 border-gray-200 p-5 rounded-xl mt-4 flex items-start transition duration-300 hover:shadow-lg"
                >
                  <div className="flex-shrink-0 mr-4">
                    {note.image_url && (
                      <Image
                        src={note.image_url}
                        alt={`Note ${index} image`}
                        width={500} 
                        height={300} 
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    )}
                  </div>
                  <div className="flex-grow">
                    <strong className="text-purple-600 text-lg">{note.title}</strong>
                    <p className="text-gray-700">{note.content}</p>
                    <small className="text-gray-500">{new Date(note.updated_at).toLocaleString()}</small>
                  </div>
                  <div className="flex space-x-3 ml-4">
                    <button
                      onClick={() => handleEditNote(index)}
                      className="text-green-600 text-xl hover:text-green-800 transition duration-200"
                      title="Sửa ghi chú"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(index)}
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
      `}</style>
    </div>
  );
};

export default NoteApp;