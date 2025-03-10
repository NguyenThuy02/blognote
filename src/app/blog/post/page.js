"use client";
import { useState } from "react";
import Image from "next/image";
import { FaPlus, FaFileImport, FaShareAlt, FaFileExport } from "react-icons/fa";
import axios from "axios";

export default function NoteApp() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUploadVisible, setImageUploadVisible] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);

  const handleSaveNote = () => {
    if (!title || !content) {
      alert("Please fill in both title and content.");
      return;
    }
    console.log("Ghi chú đã lưu:", { title, content, uploadedImages });
    setTitle("");
    setContent("");
    setUploadedImages([]);
    setImageUploadVisible(false);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const images = files.map((file) => URL.createObjectURL(file));
    setUploadedImages(images);
  };

  const translateText = async (text, targetLang) => {
    try {
      const response = await axios.post("YOUR_API_ENDPOINT", {
        q: text,
        target: targetLang,
        // Nếu cần, thêm headers hoặc thông tin khác
      });
      return response.data.translatedText; // Điều chỉnh theo cấu trúc dữ liệu của API
    } catch (error) {
      console.error(
        "Error:",
        error.response ? error.response.data : error.message
      );
      return text; // Trả về văn bản gốc nếu có lỗi
    }
  };

  return (
    <div className="mt-[97px] p-5 mb-[-7px] rounded-lg shadow-md border border-gray-200 bg-gray-100 flex flex-col">
      <h1 className="text-4xl font-bold font-montserrat text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-6">
        Tạo bài viết để đăng
      </h1>
      <h2 className="text-xl font-bold font-montserrat text-black mb-6">
        Tiêu đề bài viết
      </h2>
      <input
        type="text"
        placeholder="Nhập tiêu đề bài viết"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border-2 border-transparent p-4 rounded-xl mb-4 transition duration-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-300"
      />
      <h2 className="text-xl font-bold font-montserrat text-black mb-6">
        Nội dung bài viết
      </h2>
      <textarea
        placeholder="Nhập nội dung bài viết"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-56 border-2 border-transparent p-4 rounded-xl transition duration-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-300"
      />
      <br />

      <div className="flex space-x-4 text-blue-600 mb-4">
        <button
          onClick={() => setImageUploadVisible(!imageUploadVisible)}
          className="bg-gradient-to-r from-blue-400 to-purple-400 text-black py-2 px-4 rounded-md flex items-center"
        >
          <FaPlus className="mr-2" /> <span>Chèn ảnh</span>
        </button>
        <button className="bg-gradient-to-r from-blue-400 to-purple-400 text-black py-2 px-4 rounded-md flex items-center">
          <FaFileImport className="mr-2" /> <span>Nhập Word/PDF</span>
        </button>
        <button className="bg-gradient-to-r from-blue-400 to-purple-400 text-black py-2 px-4 rounded-md flex items-center">
          <FaShareAlt className="mr-2" /> <span>Chia sẻ</span>
        </button>
        <button
          onClick={handleSaveNote}
          className="bg-gradient-to-r from-green-400 to-green-600 text-black py-2 px-4 rounded-md flex items-center"
        >
          <FaFileExport className="mr-2" /> <span>Xuất File</span>
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
                className="w-20 h-20 object-cover rounded-md mr-2 mb-2"
                width={80}
                height={80}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-4 mb-4">
        <button
          onClick={async () => {
            const translated = await translateText(content, "en"); // Dịch sang tiếng Anh
            setContent(translated);
          }}
          className="bg-gradient-to-r from-blue-400 to-purple-400 text-black py-2 px-4 rounded-md flex items-center"
        >
          Dịch sang tiếng Anh
        </button>
        <button
          onClick={async () => {
            const translated = await translateText(content, "vi"); // Dịch sang tiếng Việt
            setContent(translated);
          }}
          className="bg-gradient-to-r from-blue-400 to-purple-400 text-black py-2 px-4 rounded-md flex items-center"
        >
          Dịch sang tiếng Việt
        </button>
      </div>

      <div className="flex justify-center mt-4 space-x-4">
        <button
          onClick={handleSaveNote}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-black py-2 px-4 rounded-md transition duration-200 hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 w-full max-w-md"
        >
          Lưu
        </button>
        <button
          onClick={() => {
            setTitle("");
            setContent("");
            setUploadedImages([]);
            setImageUploadVisible(false);
          }}
          className="bg-red-400 text-black py-2 px-4 rounded-md transition duration-200 hover:bg-red-500 w-full max-w-md"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
