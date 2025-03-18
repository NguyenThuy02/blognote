"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { FaPlus, FaFileImport, FaTimes, FaRegStickyNote } from "react-icons/fa";
import { supabase1 } from "../../../lib/supabase";
import Notification from "../../../utils/notification";
import Confirm from "../../../utils/error";
import { useRouter } from "next/navigation";

export default function PostApp() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [notification, setNotification] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [imageError, setImageError] = useState("");
  const [titleError, setTitleError] = useState("");
  const [contentError, setContentError] = useState("");
  const [posts, setPosts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const MAX_IMAGES = 5;
  const router = useRouter();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase1
        .from("demos")
        .select("id, title, content, images, files, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      setPosts(
        data.map((post) => ({
          ...post,
          images:
            post.images && typeof post.images === "string"
              ? post.images.split(",")
              : [],
          files:
            post.files && typeof post.files === "string"
              ? post.files.split(",")
              : [],
        }))
      );
    } catch (err) {
      setNotification({
        message: `Không thể tải bản nháp: ${err.message}`,
        type: "error",
      });
    }
  };

  const validateInputs = () => {
    let hasError = false;
    setTitleError("");
    setContentError("");

    if (!title) {
      setTitleError("Vui lòng điền tiêu đề bài viết.");
      hasError = true;
    }
    if (!content) {
      setContentError("Vui lòng điền nội dung bài viết.");
      hasError = true;
    }
    return hasError;
  };

  const handleSaveDraft = async () => {
    if (validateInputs()) return;
    try {
      const draftData = {
        title,
        content,
        images: uploadedImages.map((image) => image.url).join(","),
        files: uploadedFiles.map((file) => file.url).join(","),
      };

      if (editingId !== null) {
        const { data, error } = await supabase1
          .from("demos")
          .update(draftData)
          .eq("id", editingId)
          .select()
          .single();
        if (error) throw error;
        setPosts(posts.map((post) => (post.id === editingId ? data : post)));
        setNotification({
          message: "Bản nháp đã được cập nhật thành công!",
          type: "success",
        });
      } else {
        const { data, error } = await supabase1
          .from("demos")
          .insert([draftData])
          .select()
          .single();
        if (error) throw error;
        setPosts([data, ...posts]);
        setNotification({
          message: "Bản nháp đã được lưu thành công!",
          type: "success",
        });
      }

      resetForm();
      await fetchPosts();
    } catch (error) {
      setNotification({
        message: `Không thể lưu bản nháp. Lỗi: ${error.message}`,
        type: "error",
      });
    }
  };

  const handlePublish = async () => {
    if (validateInputs()) return;

    try {
      const publishedData = {
        title,
        content,
        images: uploadedImages.map((image) => image.url).join(","),
        files: uploadedFiles.map((file) => file.url).join(","),
      };

      const { data, error } = await supabase1
        .from("posts")
        .insert([publishedData])
        .select()
        .single();

      if (error) throw error;

      if (editingId !== null) {
        await supabase1.from("demos").delete().eq("id", editingId);
      }

      setNotification({
        message: "Bài viết đã được đăng thành công!",
        type: "success",
      });

      resetForm();
      await fetchPosts();
      router.push("/posts");
    } catch (error) {
      setNotification({
        message: `Không thể đăng bài viết. Lỗi: ${error.message}`,
        type: "error",
      });
    }
  };

  const handleDeleteDraft = async (postId) => {
    if (!confirm("Bạn có chắc muốn xóa bản nháp này không?")) return;
    try {
      const { error } = await supabase1.from("demos").delete().eq("id", postId);
      if (error) throw error;
      setPosts(posts.filter((post) => post.id !== postId));
      setNotification({
        message: "Bản nháp đã được xóa thành công!",
        type: "success",
      });
    } catch (err) {
      setNotification({
        message: `Không thể xóa bản nháp: ${err.message}`,
        type: "error",
      });
    }
  };

  const handleEditDraft = (post) => {
    setTitle(post.title);
    setContent(post.content);
    setUploadedImages(post.images.map((url) => ({ url, name: "Image" })));
    setUploadedFiles(post.files.map((url) => ({ url, name: "File" })));
    setEditingId(post.id);
    setImageError("");
    setTitleError("");
    setContentError("");
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setUploadedImages([]);
    setUploadedFiles([]);
    setImageError("");
    setTitleError("");
    setContentError("");
    setEditingId(null);
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (uploadedImages.length + files.length > MAX_IMAGES) {
      setImageError(`Bạn chỉ có thể tải lên tối đa ${MAX_IMAGES} hình ảnh.`);
      return;
    }

    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          if (file.size > 10 * 1024 * 1024) {
            throw new Error("File quá lớn. Vui lòng chọn file nhỏ hơn 10MB");
          }
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
          return { url: data.secure_url, name: file.name };
        })
      );
      setUploadedImages((prev) => [...prev, ...uploadedUrls]);
      setImageError("");
    } catch (err) {
      setImageError(err.message || "Không thể tải lên hình ảnh.");
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    if (validFiles.length !== files.length) {
      setNotification({
        message: "Vui lòng chỉ tải lên tệp Word hoặc PDF.",
        type: "warning",
      });
      return;
    }

    try {
      const uploadedFileUrls = await Promise.all(
        validFiles.map(async (file) => {
          if (file.size > 10 * 1024 * 1024) {
            throw new Error("File quá lớn. Vui lòng chọn file nhỏ hơn 10MB");
          }
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", "blognote");
          formData.append("cloud_name", "dlaoxrnad");
          const response = await fetch(
            "https://api.cloudinary.com/v1_1/dlaoxrnad/raw/upload",
            { method: "POST", body: formData }
          );
          if (!response.ok) throw new Error("Upload failed");
          const data = await response.json();
          return { url: data.secure_url, name: file.name };
        })
      );
      setUploadedFiles((prevFiles) => [...prevFiles, ...uploadedFileUrls]);
    } catch (err) {
      setNotification({
        message: err.message || "Không thể tải lên tệp.",
        type: "error",
      });
    }
  };

  const handleCancel = () => {
    setShowConfirm(true);
  };

  const confirmCancel = () => {
    resetForm();
    setNotification({
      message: "Đã hủy thành công!",
      type: "success",
    });
    setShowConfirm(false);
  };

  const cancelCancel = () => {
    setShowConfirm(false);
  };

  const resetNotification = () => setNotification(null);

  // Hàm xóa hình ảnh
  const handleDeleteImage = (imageUrl) => {
    setUploadedImages(uploadedImages.filter((image) => image.url !== imageUrl));
    setImageError(""); // Reset lỗi hình ảnh
  };

  // Hàm xóa tệp
  const handleDeleteFile = (fileUrl) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.url !== fileUrl));
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen mt-[76px] mb-[-7px] gap-5 p-5 m-[-25px]">
      <div className="lg:flex-1">
        <div className="p-5 rounded-lg shadow-md border border-gray-200 bg-gray-100">
          {notification && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={resetNotification}
            />
          )}
          {showConfirm && (
            <Confirm
              message="Bạn có chắc chắn muốn hủy không?"
              onConfirm={confirmCancel}
              onCancel={cancelCancel}
            />
          )}

          <h1 className="text-4xl font-bold font-montserrat text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-6">
            Viết bài
          </h1>

          <h2 className="text-xl font-bold font-montserrat text-black mb-3">
            Tiêu đề bài viết
          </h2>
          <input
            type="text"
            placeholder="Nhập tiêu đề bài viết"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-2 border-transparent p-4 rounded-xl mb-1 text-gray-700 transition duration-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-300"
            style={{ outline: "none" }}
          />
          {titleError && (
            <p className="text-red-600 text-sm mb-2">{titleError}</p>
          )}

          <h2 className="text-xl font-bold font-montserrat text-black mb-3 mt-4">
            Nội dung bài viết
          </h2>
          <textarea
            placeholder="Nhập nội dung bài viết"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-56 border-2 border-transparent p-4 rounded-xl text-gray-700 transition duration-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-300"
            style={{ outline: "none" }}
          />
          {contentError && (
            <p className="text-red-600 text-sm mb-2">{contentError}</p>
          )}

          <div className="flex space-x-4 text-blue-600 mb-4 mt-3">
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
          </div>

          {imageError && (
            <p className="text-red-600 text-sm mb-2">{imageError}</p>
          )}

          {uploadedImages.length > 0 && (
            <div className="mt-4">
              <h3 className="font-bold">Hình ảnh đã tải lên:</h3>
              <ul className="flex flex-wrap">
                {uploadedImages.map((image, index) =>
                  isValidUrl(image.url) ? (
                    <li
                      key={index}
                      className="flex flex-col items-center mb-4 mr-4"
                    >
                      <div className="relative">
                        <Image
                          src={image.url}
                          alt={`Uploaded preview ${index}`}
                          className="w-20 h-20 object-cover rounded-md mb-2"
                          width={80}
                          height={80}
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-0 right-0 p-1 text-red-500 hover:text-red-700"
                          title="Xóa hình ảnh"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <span className="text-blue-600 underline">
                        {image.name}
                      </span>
                    </li>
                  ) : (
                    <li
                      key={index}
                      className="flex flex-col items-center mb-4 mr-4"
                    >
                      <span className="text-red-600">
                        URL hình ảnh không hợp lệ
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="mt-4">
              <h3 className="font-bold">Tệp đã tải lên:</h3>
              <ul className="flex flex-wrap">
                {uploadedFiles.map((file, index) => (
                  <li
                    key={index}
                    className="flex flex-col items-center mb-4 mr-4"
                  >
                    <div className="relative">
                      <span className="text-blue-600">{file.name}</span>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="absolute top-0 right-0 p-1 text-red-500 hover:text-red-700"
                        title="Xóa tệp"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-center mt-4 space-x-4">
            <button
              onClick={handleSaveDraft}
              className="bg-gray-400 text-black py-2 px-4 rounded-md transition duration-200 hover:bg-gray-500 w-full max-w-md"
            >
              Lưu bản nháp
            </button>
            <button
              onClick={handlePublish}
              className="bg-green-400 hover:bg-green-500 text-black py-2 px-4 rounded-md transition duration-200 w-full max-w-md"
            >
              {editingId !== null ? "Đăng từ bản nháp" : "Đăng ngay"}
            </button>
            <button
              onClick={handleCancel}
              className="bg-red-400 text-black py-2 px-4 rounded-md transition duration-200 hover:bg-red-500 w-full max-w-md"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>

      <div className="lg:w-1/3 lg:max-w-sm">
        <div className="p-4 border border-gray-300 rounded-lg bg-white h-[calc(0.75*(100vh-150px))] flex flex-col">
          <div className="sticky top-0 bg-white z-0 pb-2 border-b border-gray-200">
            <h2 className="font-bold text-2xl text-gray-700">
              <FaRegStickyNote className="inline mr-2" /> Bản nháp đã lưu
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto mt-2 scrollbar-hidden">
            <ul>
              {posts.length > 0 ? (
                posts.map((post) => (
                  <li
                    key={post.id}
                    className="border-2 border-gray-200 p-4 rounded-xl mb-4 flex flex-col transition duration-300 hover:shadow-lg"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-1">
                        {post.images.length > 0 &&
                          isValidUrl(post.images[0]) && (
                            <Image
                              src={post.images[0]}
                              alt={`Draft ${post.id} image`}
                              width={60}
                              height={60}
                              className="w-16 h-16 object-cover rounded-md"
                            />
                          )}
                      </div>
                      <div className="flex-grow">
                        <strong className="text-black text-lg">
                          {post.title}
                        </strong>
                        <p className="text-gray-700 text-sm">
                          {post.content.slice(0, 50) + "..."}
                        </p>
                        <small className="text-gray-700">
                          {new Date(post.created_at).toLocaleString()}
                        </small>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-2">
                      <button
                        onClick={() => handleEditDraft(post)}
                        className="text-green-500 text-sm hover:text-green-600 transition duration-200 underline"
                        title="Sửa bản nháp"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(post.id)}
                        className="text-red-400 text-sm hover:text-red-500 transition duration-200 underline"
                        title="Xóa bản nháp"
                      >
                        Xóa
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-gray-700">Không tìm thấy bản nháp nào.</p>
              )}
            </ul>
          </div>
        </div>

        <style jsx>{`
          .scrollbar-hidden::-webkit-scrollbar {
            display: none; /* Ẩn thanh cuộn trên Chrome, Safari, Edge */
          }
          .scrollbar-hidden {
            -ms-overflow-style: none; /* Ẩn thanh cuộn trên IE và Edge */
            scrollbar-width: none; /* Ẩn thanh cuộn trên Firefox */
          }
        `}</style>
      </div>
    </div>
  );
}
