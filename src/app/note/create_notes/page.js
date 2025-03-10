"use client";


import { useState } from "react";
import { FaFileImport, FaShareAlt, FaPlus, FaSearch, FaEdit, FaTrash, FaFileExport } from "react-icons/fa";


const NoteApp = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState([]);
  const [sortBy, setSortBy] = useState("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [imageUploadVisible, setImageUploadVisible] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);


  const handleSaveNote = () => {
    if (!title.trim() || !content.trim()) return;


    const newNote = { title, content, date: new Date(), images: uploadedImages };
    setNotes([...notes, newNote]);


    setTitle("");
    setContent("");
    setUploadedImages([]);
    setImageUploadVisible(false);
  };


  const handleDeleteNote = (index) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNotes(updatedNotes);
  };


  const handleEditNote = (index) => {
    setTitle(notes[index].title);
    setContent(notes[index].content);
    setUploadedImages(notes[index].images);
    setEditingIndex(index);
  };


  const handleExportNotes = () => {
    const text = notes.map((note) => `Tiêu đề: ${note.title}\nNội dung: ${note.content}\nNgày: ${note.date.toLocaleString()}\n---\n`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ghi-chu.txt";
    link.click();
  };


  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const images = files.map(file => URL.createObjectURL(file));
    setUploadedImages(images);
  };


  const sortedNotes = [...notes]
    .filter((note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return new Date(b.date) - new Date(a.date);
    });


  return (
    <div className="max-w-7xl mx-auto p-8 border border-gray-300 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6">Ứng dụng Ghi chú</h1>


      <input
        type="text"
        placeholder="Tiêu đề ghi chú"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border-2 border-transparent p-4 rounded-xl mb-4 font-bold text-lg transition duration-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-300"
      />


      <div className="flex space-x-4 text-blue-600 mb-4">
        <button onClick={() => setImageUploadVisible(!imageUploadVisible)} className="btn-gradient">
          <FaPlus /> <span>Chèn ảnh</span>
        </button>
        <button className="btn-gradient">
          <FaFileImport /> <span>Nhập Word/PDF</span>
        </button>
        <button className="btn-gradient">
          <FaShareAlt /> <span>Chia sẻ</span>
        </button>
        <button onClick={handleExportNotes} className="btn-gradient text-green-600">
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
              <img key={index} src={image} alt={`Uploaded preview ${index}`} className="w-20 h-20 object-cover rounded-md mr-2 mb-2" />
            ))}
          </div>
        </div>
      )}


      <textarea
        placeholder="Nội dung ghi chú"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-56 border-2 border-transparent p-4 rounded-xl transition duration-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-300"
      />


      <div className="flex justify-center mt-4">
        <button onClick={handleSaveNote} className="btn-gradient w-full max-w-md px-4 py-3 text-xl font-bold flex justify-center">
          {editingIndex !== null ? "Cập nhật" : "Lưu"}
        </button>
      </div>


      {/* New Section for Sorting and Notes */}
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
          <button onClick={() => setSortBy("date")}>
            ↕ Sắp xếp theo ngày cập nhật
          </button>
        </div>


        <div className="mt-8">
          <h2 className="font-bold text-2xl text-blue-600">📌 Ghi chú đã lưu</h2>
          <ul>
            {sortedNotes.length > 0 ? (
              sortedNotes.map((note, index) => (
                <li key={index} className="border-2 border-gray-200 p-5 rounded-xl mt-4 flex items-start transition duration-300 hover:shadow-lg">
                  <div className="flex-shrink-0 mr-4">
                    {note.images.length > 0 && (
                      <div className="flex flex-wrap">
                        {note.images.map((image, imgIndex) => (
                          <img key={imgIndex} src={image} alt={`Note ${index} image ${imgIndex}`} className="w-20 h-20 object-cover rounded-md" />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <strong className="text-purple-600 text-lg">{note.title}</strong>
                    <p className="text-gray-700">{note.content}</p>
                    <small className="text-gray-500">{note.date.toLocaleString()}</small>
                  </div>
                  <div className="flex space-x-3 ml-4">
                    <button onClick={() => handleEditNote(index)} className="text-yellow-500 text-xl">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDeleteNote(index)} className="text-red-500 text-xl">
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
          background: linear-gradient(135deg, #a2d2ff, #cdb4db);
          color: white;
          padding: 12px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          transition: all 0.3s ease-in-out;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .btn-gradient:hover {
          background: linear-gradient(135deg, #cdb4db, #a2d2ff);
          transform: scale(1.08);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
};


export default NoteApp;