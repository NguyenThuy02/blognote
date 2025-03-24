"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { FaTimes } from "react-icons/fa";
import {
  FileImageOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  DiffOutlined,
} from "@ant-design/icons";
import { supabase } from "../../../lib/supabase";
import Notification from "../../../utils/notification";
import Confirm from "../../../utils/error";
import { useRouter } from "next/navigation";

export default function PostApp() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false); // State cho hình ảnh
  const [isUploadingFile, setIsUploadingFile] = useState(false); // State cho file
  const [isUploadingVideo, setIsUploadingVideo] = useState(false); // State cho video
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
      const { data, error } = await supabase
        .from("demos")
        .select("id, title, content, images, files, videos, created_at")
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
          videos:
            post.videos && typeof post.videos === "string"
              ? post.videos.split(",")
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
        videos: uploadedVideos.map((video) => video.url).join(","),
      };

      if (editingId !== null) {
        const { data, error } = await supabase
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
        const { data, error } = await supabase
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
        videos: uploadedVideos.map((video) => video.url).join(","),
      };

      const { data, error } = await supabase
        .from("posts")
        .insert([publishedData])
        .select()
        .single();

      if (error) throw error;

      if (editingId !== null) {
        await supabase.from("demos").delete().eq("id", editingId);
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
      const { error } = await supabase.from("demos").delete().eq("id", postId);
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
    setUploadedVideos(post.videos.map((url) => ({ url, name: "Video" })));
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
    setUploadedVideos([]);
    setIsUploadingImage(false); // Reset trạng thái hình ảnh
    setIsUploadingFile(false); // Reset trạng thái file
    setIsUploadingVideo(false); // Reset trạng thái video
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

    setIsUploadingImage(true); // Bật trạng thái tải hình ảnh
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
    } finally {
      setIsUploadingImage(false); // Tắt trạng thái tải hình ảnh
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

    setIsUploadingFile(true); // Bật trạng thái tải file
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
    } finally {
      setIsUploadingFile(false); // Tắt trạng thái tải file
    }
  };

  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    const validVideos = files.filter((file) => file.type.startsWith("video/"));

    if (validVideos.length !== files.length) {
      setNotification({
        message: "Vui lòng chỉ tải lên tệp video.",
        type: "warning",
      });
      return;
    }

    setIsUploadingVideo(true); // Bật trạng thái tải video
    try {
      const uploadedVideoUrls = await Promise.all(
        validVideos.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", "blognote");
          formData.append("cloud_name", "dlaoxrnad");
          const response = await fetch(
            "https://api.cloudinary.com/v1_1/dlaoxrnad/video/upload",
            { method: "POST", body: formData }
          );
          if (!response.ok) throw new Error("Upload video failed");
          const data = await response.json();
          return { url: data.secure_url, name: file.name };
        })
      );
      setUploadedVideos((prevVideos) => [...prevVideos, ...uploadedVideoUrls]);
    } catch (err) {
      setNotification({
        message: err.message || "Không thể tải lên video.",
        type: "error",
      });
    } finally {
      setIsUploadingVideo(false); // Tắt trạng thái tải video
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

  const handleRemoveImage = (index) => {
    setUploadedImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleRemoveVideo = (index) => {
    setUploadedVideos((prevVideos) => prevVideos.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen mt-[76px] mb-[-7px] gap-5 p-5 m-[-15px]">
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

          <h2 className="text-xl text-black mb-3">Tiêu đề bài viết</h2>
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

          <h2 className="text-xl text-black mb-3 mt-4">Nội dung bài viết</h2>
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
              <FileImageOutlined className="mr-2" /> <span>Chèn ảnh</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <label className="bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-black py-2 px-4 rounded-md flex items-center cursor-pointer">
              <FileTextOutlined className="mr-2" /> <span>Tệp Word/PDF</span>
              <input
                type="file"
                accept=".doc,.docx,.pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <label className="bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-black py-2 px-4 rounded-md flex items-center cursor-pointer">
              <VideoCameraOutlined className="mr-2" /> <span>Video</span>
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={handleVideoUpload}
                className="hidden"
              />
            </label>
          </div>

          {imageError && (
            <p className="text-red-600 text-sm mb-2">{imageError}</p>
          )}

          {/* Trạng thái tải hình ảnh */}
          {isUploadingImage && (
            <div className="mt-4">
              <h3 className="font-bold mb-3">Đang tải hình ảnh...</h3>
              <div className="flex items-center">
                <div className="loader mr-2"></div>
                <span className="text-gray-600">Vui lòng chờ...</span>
              </div>
            </div>
          )}

          {uploadedImages.length > 0 && !isUploadingImage && (
            <div className="mt-4">
              <h3 className="font-bold mb-3">Hình ảnh đã tải lên:</h3>
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
                          className="absolute top-0 right-0 p-1 text-red-400 hover:text-red-500"
                          title="Xóa hình ảnh"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <span className="text-blue-500 underline">
                        {image.name}
                      </span>
                    </li>
                  ) : (
                    <li
                      key={index}
                      className="flex flex-col items-center mb-4 mr-4"
                    >
                      <span className="text-red-500">
                        URL hình ảnh không hợp lệ
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* Trạng thái tải file */}
          {isUploadingFile && (
            <div className="mt-4">
              <h3 className="font-bold mb-3">Đang tải tệp...</h3>
              <div className="flex items-center">
                <div className="loader mr-2"></div>
                <span className="text-gray-600">Vui lòng chờ...</span>
              </div>
            </div>
          )}

          {uploadedFiles.length > 0 && !isUploadingFile && (
            <div className="mt-4">
              <h3 className="font-bold mb-3">Tệp đã tải lên:</h3>
              <ul className="mr-5">
                {uploadedFiles.map((file, index) => (
                  <li key={index} className="mb-1">
                    <div className="flex items-center">
                      <span className="text-blue-500">{file.name}</span>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="p-1 text-red-400 hover:text-red-500"
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

          {/* Trạng thái tải video */}
          {isUploadingVideo && (
            <div className="mt-4">
              <h3 className="font-bold mb-3">Đang tải video...</h3>
              <div className="flex items-center">
                <div className="loader mr-2"></div>
                <span className="text-gray-600">Vui lòng chờ...</span>
              </div>
            </div>
          )}

          {uploadedVideos.length > 0 && !isUploadingVideo && (
            <div className="mt-4">
              <h3 className="font-bold mb-3">Video đã tải lên:</h3>
              <ul className="mr-5">
                {uploadedVideos.map((video, index) => (
                  <li key={index} className="mb-4">
                    <div className="flex items-center">
                      <video
                        src={video.url}
                        controls
                        className="w-40 h-24 object-cover rounded-md mr-2"
                      />
                      <div className="flex flex-col">
                        <span className="text-blue-500">{video.name}</span>
                        <button
                          onClick={() => handleRemoveVideo(index)}
                          className="p-1 text-red-400 hover:text-red-500"
                          title="Xóa video"
                        >
                          <FaTimes />
                        </button>
                      </div>
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
        <div className="p-4 border border-gray-300 rounded-lg bg-white h-[calc(0.75*(100vh-5px))] flex flex-col">
          <div className="sticky top-0 bg-white z-0 pb-2 border-b border-gray-200">
            <h2 className="font-bold text-2xl text-gray-700">
              <DiffOutlined className="inline mr-2" /> Bản nháp đã lưu
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto mt-1 scrollbar-hidden">
            <ul>
              {posts.length > 0 ? (
                posts.map((post) => (
                  <li
                    key={post.id}
                    className="border-2 border-gray-200 p-4 rounded-xl mb-2 flex flex-col transition duration-300 hover:shadow-lg"
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
                      <div className="flex-grow ml-3">
                        <strong className="text-yellow-600 text-lg">
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
            display: none;
          }
          .scrollbar-hidden {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
