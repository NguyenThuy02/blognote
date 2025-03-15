"use client";
import { useState } from "react";
import Image from "next/image";
import { FaPlus, FaFileImport, FaShareAlt, FaFileExport } from "react-icons/fa";
import axios from "axios";
import { supabase } from "../../../lib/supabase";

export default function PostApp() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUploadVisible, setImageUploadVisible] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [titleError, setTitleError] = useState("");
  const [contentError, setContentError] = useState("");
  const [imageError, setImageError] = useState("");
  const [message, setMessage] = useState("");

  const MAX_IMAGES = 5; // Số lượng hình ảnh tối đa cho phép

  const validateInputs = () => {
    setTitleError("");
    setContentError("");
    let hasError = false;

    if (!title || title.length < 5 || title.length > 100) {
      setTitleError("Vui lòng điền tiêu đề từ 5 đến 100 ký tự.");
      hasError = true;
    }
    if (!content || content.length < 10) {
      setContentError("Vui lòng điền nội dung bài viết tối thiểu 10 ký tự.");
      hasError = true;
    }
    return hasError;
  };

  const handleSaveNote = async () => {
    if (validateInputs()) return; // Dừng lại nếu có lỗi

    const { data, error } = await supabase
      .from("posts")
      .insert([
        { title, content, images: uploadedImages, files: uploadedFiles },
      ]);

    if (error) {
      console.error("Lỗi khi chèn dữ liệu:", error);
      setMessage("Không thể lưu bài viết. Vui lòng thử lại.");
    } else {
      console.log("Bài viết đã được lưu thành công:", data);
      setMessage("Bài viết đã được lưu thành công!");
      setTitle("");
      setContent("");
      setUploadedImages([]);
      setUploadedFiles([]);
      setImageUploadVisible(false);
    }
  };

  const handleDraft = async () => {
    if (validateInputs()) return; // Dừng lại nếu có lỗi

    const { data, error } = await supabase
      .from("drafts")
      .insert([
        { title, content, images: uploadedImages, files: uploadedFiles },
      ]);

    if (error) {
      console.error("Lỗi khi lưu bản nháp:", error);
      setMessage("Không thể lưu bản nháp. Vui lòng thử lại.");
    } else {
      console.log("Bản nháp đã được lưu thành công:", data);
      setMessage("Bản nháp đã được lưu thành công!");
      setTitle("");
      setContent("");
      setUploadedImages([]);
      setUploadedFiles([]);
      setImageUploadVisible(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (uploadedImages.length + files.length > MAX_IMAGES) {
      setImageError(`Bạn chỉ có thể tải lên tối đa ${MAX_IMAGES} hình ảnh.`);
      return;
    }

    const images = files.map((file) => ({
      url: URL.createObjectURL(file), // URL cho hình ảnh
      name: file.name, // Tên tệp hình ảnh
    }));

    setUploadedImages((prevImages) => [...prevImages, ...images]);
    setImageError(""); // Xóa thông báo lỗi nếu tải lên thành công
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    if (validFiles.length !== files.length) {
      setMessage("Vui lòng chỉ tải lên tệp Word hoặc PDF.");
      return;
    }

    const newFiles = validFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setUploadedFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const translateText = async (text, targetLang) => {
    try {
      const response = await axios.post("YOUR_API_ENDPOINT", {
        q: text,
        target: targetLang,
      });
      return response.data.translatedText;
    } catch (error) {
      console.error(
        "Lỗi:",
        error.response ? error.response.data : error.message
      );
      return text;
    }
  };

  const handleCancel = () => {
    const confirmCancel = window.confirm("Bạn có chắc chắn muốn hủy không?");
    if (confirmCancel) {
      setTitle("");
      setContent("");
      setUploadedImages([]);
      setUploadedFiles([]);
      setImageUploadVisible(false);
    }
  };

  return (
    <div className="mt-[97px] p-5 mb-[-7px] rounded-lg shadow-md border border-gray-200 bg-gray-100 flex flex-col">
      <h1 className="text-4xl font-bold font-montserrat text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-6">
        Viết bài
      </h1>
      <h2 className="text-xl font-bold font-montserrat text-black mb-6">
        Tiêu đề bài viết
      </h2>
      <input
        type="text"
        placeholder="Nhập tiêu đề bài viết"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border-2 border-transparent p-4 rounded-xl mb-1 transition duration-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-300"
        style={{ outline: "none" }}
      />
      {titleError && <p className="text-red-600 text-sm mb-2">{titleError}</p>}

      <h2 className="text-xl font-bold font-montserrat text-black mb-6">
        Nội dung bài viết
      </h2>
      <textarea
        placeholder="Nhập nội dung bài viết"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-56 border-2 border-transparent p-4 rounded-xl transition duration-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-300"
        style={{ outline: "none" }}
      />
      {contentError && (
        <p className="text-red-600 text-sm mb-2">{contentError}</p>
      )}
      <br />

      <div className="flex space-x-4 text-blue-600 mb-4">
        <label className="bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-black py-2 px-4 rounded-md flex items-center cursor-pointer">
          <FaPlus className="mr-2" /> <span>Chèn ảnh</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        <label className="bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-black py-2 px-4 rounded-md flex items-center cursor-pointer">
          <FaFileImport className="mr-2" /> <span>Nhập Word/PDF</span>
          <input
            type="file"
            accept=".doc,.docx,.pdf"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        <button className="bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-black py-2 px-4 rounded-md flex items-center">
          <FaShareAlt className="mr-2" /> <span>Chia sẻ</span>
        </button>

        <button
          onClick={handleSaveNote}
          className="bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-black py-2 px-4 rounded-md flex items-center"
        >
          <FaFileExport className="mr-2" /> <span>Xuất File</span>
        </button>
      </div>

      {uploadedImages.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold">Hình ảnh đã tải lên:</h3>
          <ul className="flex flex-wrap">
            {uploadedImages.map((image, index) => (
              <li key={index} className="flex flex-col items-center mb-4 mr-4">
                <Image
                  src={image.url} // Sử dụng URL được lưu
                  alt={`Uploaded preview ${index}`}
                  className="w-20 h-20 object-cover rounded-md mb-2" // Thêm margin dưới ảnh
                  width={80}
                  height={80}
                />
                <span className="text-blue-600 underline">
                  {image.name} {/* Hiển thị tên hình ảnh dưới ảnh */}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold">Tệp đã tải lên:</h3>
          <ul>
            {uploadedFiles.map((file, index) => (
              <li key={index} className="text-blue-600 underline">
                {file.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex space-x-4 mb-4">
        <button
          onClick={async () => {
            const translated = await translateText(content, "en");
            setContent(translated);
          }}
          className="bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-black py-2 px-4 rounded-md flex items-center"
        >
          Dịch sang tiếng Anh
        </button>
        <button
          onClick={async () => {
            const translated = await translateText(content, "vi");
            setContent(translated);
          }}
          className="bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-black py-2 px-4 rounded-md flex items-center"
        >
          Dịch sang tiếng Việt
        </button>
      </div>

      {message && (
        <div className="mb-4 text-center text-red-600">{message}</div>
      )}

      <div className="flex justify-center mt-4 space-x-4">
        <button
          onClick={handleDraft}
          className="bg-gray-400 text-black py-2 px-4 rounded-md transition duration-200 hover:bg-gray-500 w-full max-w-md"
        >
          Lưu bản nháp
        </button>
        <button
          onClick={handleSaveNote}
          className="bg-green-400 hover:bg-green-500 text-black py-2 px-4 rounded-md transition duration-200 w-full max-w-md"
        >
          Đăng ngay
        </button>
        <button
          onClick={handleCancel}
          className="bg-red-400 text-black py-2 px-4 rounded-md transition duration-200 hover:bg-red-500 w-full max-w-md"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
