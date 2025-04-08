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
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [tagsList, setTagsList] = useState([]);
  const [topicsList, setTopicsList] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteTable, setConfirmDeleteTable] = useState(null);
  const [imageError, setImageError] = useState("");
  const [titleError, setTitleError] = useState("");
  const [contentError, setContentError] = useState("");
  const [topicError, setTopicError] = useState("");
  const [tagError, setTagError] = useState("");
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingTable, setEditingTable] = useState(null);
  const [name, setName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const MAX_IMAGES = 5;
  const router = useRouter();

  useEffect(() => {
    const checkLoginStatus = () => {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) {
        setName(userData.name || userData.email || "");
        setIsLoggedIn(true);
        fetchEntries();
        fetchTopics();
        fetchTags();
        setShowLoginModal(false);
      } else {
        setIsLoggedIn(false);
        setName("");
        setEntries([]);
        setShowLoginModal(true); // Hiển thị modal khi chưa đăng nhập hoặc vừa đăng xuất
        resetForm();
      }
    };

    // Kiểm tra trạng thái ban đầu
    checkLoginStatus();

    // Lắng nghe sự kiện thay đổi localStorage (cho các tab khác)
    const handleStorageChange = (event) => {
      if (event.key === "user" || event.key === null) {
        checkLoginStatus();
      }
    };

    // Lắng nghe sự kiện đăng xuất trong cùng tab
    const handleLogoutEvent = () => {
      checkLoginStatus();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("user-logout", handleLogoutEvent);

    // Dọn dẹp listener khi component unmount
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-logout", handleLogoutEvent);
    };
  }, [router]);

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const fetchTags = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("tags")
        .not("tags", "is", null);
      if (postsError) throw postsError;

      const { data: demosData, error: demosError } = await supabase
        .from("demos")
        .select("tags")
        .not("tags", "is", null);
      if (demosError) throw demosError;

      const allTags = [
        ...new Set([
          ...(postsData || []).flatMap((item) =>
            item.tags
              ? typeof item.tags === "string"
                ? item.tags.split(",")
                : Array.isArray(item.tags)
                ? item.tags
                : []
              : []
          ),
          ...(demosData || []).flatMap((item) =>
            item.tags
              ? typeof item.tags === "string"
                ? item.tags.split(",")
                : Array.isArray(item.tags)
                ? item.tags
                : []
              : []
          ),
        ]),
      ].map((tag) => capitalizeFirstLetter(tag.trim()));

      setTagsList([
        ...allTags.map((tag) => ({ value: tag, label: tag })),
        { value: "Khác", label: "Khác" },
      ]);
    } catch (err) {
      setNotification({
        message: `Không thể tải danh sách tags: ${err.message}`,
        type: "error",
      });
    }
  };

  const fetchTopics = async () => {
    try {
      const { data: demosData, error: demosError } = await supabase
        .from("demos")
        .select("topics")
        .not("topics", "is", null);
      if (demosError) throw demosError;

      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("topics")
        .not("topics", "is", null);
      if (postsError) throw postsError;

      const allTopics = [
        ...new Set([
          ...(demosData || []).map((item) =>
            capitalizeFirstLetter(item.topics)
          ),
          ...(postsData || []).map((item) =>
            capitalizeFirstLetter(item.topics)
          ),
        ]),
      ];

      setTopicsList([
        ...allTopics.map((topic) => ({ value: topic, label: topic })),
        { value: "Khác", label: "Khác" },
      ]);
    } catch (err) {
      setNotification({
        message: `Không thể tải danh sách chủ đề: ${err.message}`,
        type: "error",
      });
    }
  };

  const fetchEntries = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (!userData) return;

      const { data: demosData, error: demosError } = await supabase
        .from("demos")
        .select(
          "id, title, content, topics, tags, images, files, videos, created_at, name"
        )
        .eq("name", userData.name || userData.email)
        .order("created_at", { ascending: false });
      if (demosError) throw demosError;

      const demosFormatted = demosData.map((entry) => ({
        ...entry,
        table: "demos",
        topics: capitalizeFirstLetter(entry.topics || ""),
        tags: entry.tags
          ? typeof entry.tags === "string"
            ? entry.tags
                .split(",")
                .map((tag) => capitalizeFirstLetter(tag.trim()))
            : Array.isArray(entry.tags)
            ? entry.tags.map((tag) => capitalizeFirstLetter(tag.trim()))
            : []
          : [],
        images: entry.images
          ? Array.isArray(entry.images)
            ? entry.images.map((img) =>
                typeof img === "string"
                  ? { url: img, name: img.split("/").pop() }
                  : img
              )
            : []
          : [],
        files: entry.files
          ? Array.isArray(entry.files)
            ? entry.files.map((file) =>
                typeof file === "string"
                  ? { url: file, name: file.split("/").pop() }
                  : file
              )
            : []
          : [],
        videos: entry.videos
          ? Array.isArray(entry.videos)
            ? entry.videos.map((video) =>
                typeof video === "string"
                  ? { url: video, name: video.split("/").pop() }
                  : video
              )
            : []
          : [],
      }));

      setEntries(demosFormatted);
    } catch (err) {
      console.log("Error in fetchEntries:", err);
      setNotification({
        message: `Không thể tải dữ liệu: ${err.message}`,
        type: "error",
      });
    }
  };

  const validateInputs = () => {
    let hasError = false;
    setTitleError("");
    setContentError("");
    setTopicError("");
    setTagError("");

    if (!title) {
      setTitleError("Vui lòng điền tiêu đề bài viết.");
      hasError = true;
    }
    if (!content) {
      setContentError("Vui lòng điền nội dung bài viết.");
      hasError = true;
    }
    if (!topic || (topic === "Khác" && !customTopic)) {
      setTopicError("Vui lòng chọn chủ đề hoặc nhập chủ đề nếu chọn 'Khác'.");
      hasError = true;
    }
    if (!name || !isLoggedIn) {
      setNotification({
        message: "Bạn cần đăng nhập để thực hiện hành động này.",
        type: "error",
      });
      setShowLoginModal(true);
      hasError = true;
    }
    return hasError;
  };

  const handleAddTag = (tagValue) => {
    const finalTag = tagValue === "Khác" ? customTag : tagValue;
    if (finalTag && !tags.includes(finalTag)) {
      setTags([...tags, capitalizeFirstLetter(finalTag)]);
      setCustomTag("");
      setSelectedTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSaveDraft = async () => {
    if (validateInputs()) return;
    try {
      const finalTopic = capitalizeFirstLetter(
        topic === "Khác" ? customTopic : topic
      );
      const draftData = {
        title,
        content,
        topics: finalTopic,
        tags: Array.isArray(tags) ? tags.join(",") : "",
        images: uploadedImages.map((img) => img.url),
        files: uploadedFiles.map((file) => file.url),
        videos: uploadedVideos.map((video) => video.url),
        name,
      };

      if (editingId !== null && editingTable === "demos") {
        const { data, error } = await supabase
          .from("demos")
          .update(draftData)
          .eq("id", editingId)
          .select()
          .single();
        if (error) throw error;
        setEntries(
          entries.map((entry) =>
            entry.id === editingId && entry.table === "demos"
              ? { ...data, table: "demos" }
              : entry
          )
        );
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
        setEntries([{ ...data, table: "demos" }, ...entries]);
        setNotification({
          message: "Bản nháp đã được lưu thành công!",
          type: "success",
        });
      }

      resetForm();
      await fetchEntries();
      await fetchTopics();
      await fetchTags();
    } catch (error) {
      console.log("Error in handleSaveDraft:", error);
      setNotification({
        message: `Không thể lưu bản nháp. Lỗi: ${error.message}`,
        type: "error",
      });
    }
  };

  const handlePublish = async () => {
    if (validateInputs()) return;

    try {
      const finalTopic = capitalizeFirstLetter(
        topic === "Khác" ? customTopic : topic
      );
      const publishedData = {
        title,
        content,
        topics: finalTopic,
        tags: Array.isArray(tags) ? tags.join(",") : "",
        images: uploadedImages.map((img) => img.url),
        files: uploadedFiles.map((file) => file.url),
        videos: uploadedVideos.map((video) => video.url),
        name,
      };

      const { data, error } = await supabase
        .from("posts")
        .insert([publishedData])
        .select()
        .single();

      if (error) throw error;

      if (editingId !== null && editingTable === "demos") {
        await supabase.from("demos").delete().eq("id", editingId);
      }

      setNotification({
        message: "Bài viết đã được đăng thành công!",
        type: "success",
      });

      resetForm();
      await fetchEntries();
      await fetchTopics();
      await fetchTags();
      router.push("/blog/post");
    } catch (error) {
      console.log("Error in handlePublish:", error);
      setNotification({
        message: `Không thể đăng bài viết. Lỗi: ${error.message}`,
        type: "error",
      });
    }
  };

  const handleEditDraft = (entry) => {
    setTitle(entry.title || "");
    setContent(entry.content || "");
    setTopic(
      entry.topics && topicsList.some((t) => t.value === entry.topics)
        ? entry.topics
        : "Khác"
    );
    setCustomTopic(
      entry.topics && !topicsList.some((t) => t.value === entry.topics)
        ? entry.topics
        : ""
    );
    setTags(
      entry.tags
        ? typeof entry.tags === "string"
          ? entry.tags
              .split(",")
              .map((tag) => capitalizeFirstLetter(tag.trim()))
          : Array.isArray(entry.tags)
          ? entry.tags.map((tag) => capitalizeFirstLetter(tag.trim()))
          : []
        : []
    );
    setUploadedImages(
      entry.images
        ? entry.images.map((img) =>
            typeof img === "string"
              ? { url: img, name: img.split("/").pop() }
              : img
          )
        : []
    );
    setUploadedFiles(
      entry.files
        ? entry.files.map((file) =>
            typeof file === "string"
              ? { url: file, name: file.split("/").pop() }
              : file
          )
        : []
    );
    setUploadedVideos(
      entry.videos
        ? entry.videos.map((video) =>
            typeof video === "string"
              ? { url: video, name: video.split("/").pop() }
              : video
          )
        : []
    );
    setName(entry.name || "");
    setEditingId(entry.id);
    setEditingTable(entry.table);
    setImageError("");
    setTitleError("");
    setContentError("");
    setTopicError("");
    setTagError("");
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setTopic("");
    setCustomTopic("");
    setTags([]);
    setCustomTag("");
    setSelectedTag("");
    setUploadedImages([]);
    setUploadedFiles([]);
    setUploadedVideos([]);
    setIsUploadingImage(false);
    setIsUploadingFile(false);
    setIsUploadingVideo(false);
    setImageError("");
    setTitleError("");
    setContentError("");
    setTopicError("");
    setTagError("");
    setEditingId(null);
    setEditingTable(null);
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

    setIsUploadingImage(true);
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
          return { name: file.name, url: data.secure_url };
        })
      );
      setUploadedImages((prev) => [...prev, ...uploadedUrls]);
      setImageError("");
    } catch (err) {
      console.log("Error in handleImageUpload:", err);
      setImageError(err.message || "Không thể tải lên hình ảnh.");
    } finally {
      setIsUploadingImage(false);
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

    setIsUploadingFile(true);
    try {
      const uploadedFileUrls = await Promise.all(
        validFiles.map(async (file) => {
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
          return { name: file.name, url: data.secure_url };
        })
      );
      setUploadedFiles((prevFiles) => [...prevFiles, ...uploadedFileUrls]);
    } catch (err) {
      console.log("Error in handleFileUpload:", err);
      setNotification({
        message: err.message || "Không thể tải lên tệp.",
        type: "error",
      });
    } finally {
      setIsUploadingFile(false);
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

    setIsUploadingVideo(true);
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
          return { name: file.name, url: data.secure_url };
        })
      );
      setUploadedVideos((prevVideos) => [...prevVideos, ...uploadedVideoUrls]);
    } catch (err) {
      console.log("Error in handleVideoUpload:", err);
      setNotification({
        message: err.message || "Không thể tải lên video.",
        type: "error",
      });
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleRemoveImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveVideo = (index) => {
    setUploadedVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const truncateFileName = (name, maxLength = 20) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + "...";
  };

  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    router.push("/auth/login");
  };

  const mainContent = (
    <div className="flex flex-col lg:flex-row min-h-screen mt-[76px] mb-[-7px] gap-5 p-5 m-[-15px] relative">
      <div className="lg:flex-1">
        <div className="p-5 rounded-lg shadow-md border border-gray-200 bg-gray-100">
          {notification && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          )}
          {showConfirm && !confirmDeleteId && (
            <Confirm
              message="Bạn có chắc chắn muốn hủy không?"
              onConfirm={() => {
                resetForm();
                setNotification({
                  message: "Đã hủy thành công!",
                  type: "success",
                });
                setShowConfirm(false);
              }}
              onCancel={() => setShowConfirm(false)}
            />
          )}
          {confirmDeleteId && showConfirm && (
            <Confirm
              message={`Bạn có chắc chắn muốn xóa bản nháp "${
                entries.find((e) => e.id === confirmDeleteId)?.title ||
                "Không có tiêu đề"
              }" không?`}
              onConfirm={async () => {
                try {
                  const { error } = await supabase
                    .from("demos")
                    .delete()
                    .eq("id", confirmDeleteId);
                  if (error) throw error;
                  setEntries(
                    entries.filter((entry) => entry.id !== confirmDeleteId)
                  );
                  setNotification({
                    message: "Bản nháp đã được xóa thành công!",
                    type: "success",
                  });
                } catch (err) {
                  console.log("Error in delete:", err);
                  setNotification({
                    message: `Không thể xóa: ${err.message}`,
                    type: "error",
                  });
                } finally {
                  setConfirmDeleteId(null);
                  setConfirmDeleteTable(null);
                  setShowConfirm(false);
                }
              }}
              onCancel={() => {
                setShowConfirm(false);
                setConfirmDeleteId(null);
                setConfirmDeleteTable(null);
              }}
            />
          )}

          <h1 className="text-2xl font-bold font-montserrat text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-6">
            Viết bài
          </h1>

          <div className="flex flex-col mb-4 gap-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <h2 className="text-xl text-black mb-3">Tiêu đề bài viết</h2>
                <input
                  type="text"
                  placeholder="Nhập tiêu đề bài viết"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-4 rounded-xl mb-1 text-gray-700 transition duration-300 bg-white shadow-[0_0_8px_rgba(147,197,253,0.8),0_0_8px_rgba(196,181,253,0.8)] focus:shadow-[0_0_12px_rgba(96,165,250,1)] focus:ring-2 focus:ring-blue-300"
                  style={{ outline: "none", border: "none" }}
                  disabled={!isLoggedIn}
                />
                {titleError && (
                  <p className="text-red-600 text-sm mb-2">{titleError}</p>
                )}
              </div>
              <div className="lg:w-1/3">
                <div>
                  <h2 className="text-xl text-black mb-3">Chủ đề bài viết</h2>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-4 rounded-xl mb-1 text-gray-700 transition duration-300 bg-white shadow-[0_0_8px_rgba(147,197,253,0.8),0_0_8px_rgba(196,181,253,0.8)] focus:shadow-[0_0_12px_rgba(96,165,250,1)] focus:ring-2 focus:ring-blue-300"
                    style={{ outline: "none", border: "none" }}
                    disabled={!isLoggedIn}
                  >
                    <option value="" disabled>
                      Chọn chủ đề
                    </option>
                    {topicsList.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {topic === "Khác" && (
                    <input
                      type="text"
                      placeholder="Nhập chủ đề tùy chỉnh"
                      value={customTopic}
                      onChange={(e) =>
                        setCustomTopic(capitalizeFirstLetter(e.target.value))
                      }
                      className="w-full p-4 rounded-xl mt-2 mb-1 text-gray-700 transition duration-300 bg-white shadow-[0_0_8px_rgba(147,197,253,0.8),0_0_8px_rgba(196,181,253,0.8)] focus:shadow-[0_0_12px_rgba(96,165,250,1)] focus:ring-2 focus:ring-blue-300"
                      style={{ outline: "none", border: "none" }}
                      disabled={!isLoggedIn}
                    />
                  )}
                  {topicError && (
                    <p className="text-red-600 text-sm mb-2">{topicError}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <h2 className="text-xl text-black mb-3">Nội dung bài viết</h2>
                <textarea
                  placeholder="Nhập nội dung bài viết"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-56 p-4 rounded-xl text-gray-700 transition duration-300 bg-white shadow-[0_0_8px_rgba(147,197,253,0.8),0_0_8px_rgba(196,181,253,0.8)] focus:shadow-[0_0_12px_rgba(192,132,252,1)] focus:ring-2 focus:ring-purple-300"
                  style={{ outline: "none", border: "none" }}
                  disabled={!isLoggedIn}
                />
                {contentError && (
                  <p className="text-red-600 text-sm mb-2">{contentError}</p>
                )}
              </div>
              <div className="lg:w-1/3">
                <h2 className="text-xl text-black mb-3">Thẻ tag</h2>
                <select
                  value={selectedTag}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedTag(value);
                    if (value !== "Khác") handleAddTag(value);
                  }}
                  className="w-full p-4 rounded-xl mb-1 text-gray-700 transition duration-300 bg-white shadow-[0_0_8px_rgba(147,197,253,0.8),0_0_8px_rgba(196,181,253,0.8)] focus:shadow-[0_0_12px_rgba(96,165,250,1)] focus:ring-2 focus:ring-purple-300"
                  style={{ outline: "none", border: "none" }}
                  disabled={!isLoggedIn}
                >
                  <option value="" disabled>
                    Chọn tag
                  </option>
                  {tagsList.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {selectedTag === "Khác" && (
                  <input
                    type="text"
                    placeholder="Nhập tag tùy chỉnh"
                    value={customTag}
                    onChange={(e) =>
                      setCustomTag(capitalizeFirstLetter(e.target.value))
                    }
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && customTag) {
                        handleAddTag("Khác");
                      }
                    }}
                    className="w-full p-4 rounded-xl mt-2 mb-1 text-gray-700 transition duration-300 bg-white shadow-[0_0_8px_rgba(147,197,253,0.8),0_0_8px_rgba(196,181,253,0.8)] focus:shadow-[0_0_12px_rgba(96,165,250,1)] focus:ring-2 focus:ring-purple-300"
                    style={{ outline: "none", border: "none" }}
                    disabled={!isLoggedIn}
                  />
                )}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-red-400 hover:text-red-500"
                          disabled={!isLoggedIn}
                        >
                          <FaTimes size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {tagError && (
                  <p className="text-red-600 text-sm mb-2">{tagError}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-4 text-blue-600 mb-4 mt-3">
            <label className="bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-black py-2 px-4 rounded-md flex items-center cursor-pointer">
              <FileImageOutlined className="mr-2" /> <span>Chèn ảnh</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={!isLoggedIn}
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
                disabled={!isLoggedIn}
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
                disabled={!isLoggedIn}
              />
            </label>
          </div>

          {imageError && (
            <p className="text-red-600 text-sm mb-2">{imageError}</p>
          )}

          {isUploadingImage && (
            <div className="mt-4">
              <h3 className="font-bold mb-3">Đang tải hình ảnh...</h3>
              <div className="flex items-center">
                <div className="loader mr-2"></div>
                <span className="text-gray-600">Vui lòng chờ...</span>
              </div>
            </div>
          )}

          {Array.isArray(uploadedImages) &&
            uploadedImages.length > 0 &&
            !isUploadingImage && (
              <div className="mt-4">
                <h3 className="font-bold mb-3">Hình ảnh đã tải lên:</h3>
                <ul className="flex flex-wrap">
                  {uploadedImages.map((image) =>
                    isValidUrl(image.url) ? (
                      <li
                        key={image.url}
                        className="flex flex-col items-center mb-4 mr-4"
                      >
                        <div className="relative">
                          <Image
                            src={image.url}
                            alt={`Uploaded preview ${image.name}`}
                            className="w-20 h-20 object-cover rounded-md mb-2"
                            width={80}
                            height={80}
                          />
                          <button
                            onClick={() =>
                              handleRemoveImage(uploadedImages.indexOf(image))
                            }
                            className="absolute top-0 right-0 p-1 text-red-400 hover:text-red-500"
                            title="Xóa hình ảnh"
                            disabled={!isLoggedIn}
                          >
                            <FaTimes />
                          </button>
                        </div>
                        <span className="text-blue-500 underline">
                          {truncateFileName(image.name)}
                        </span>
                      </li>
                    ) : (
                      <li
                        key={image.url}
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

          {isUploadingFile && (
            <div className="mt-4">
              <h3 className="font-bold mb-3">Đang tải tệp...</h3>
              <div className="flex items-center">
                <div className="loader mr-2"></div>
                <span className="text-gray-600">Vui lòng chờ...</span>
              </div>
            </div>
          )}

          {Array.isArray(uploadedFiles) &&
            uploadedFiles.length > 0 &&
            !isUploadingFile && (
              <div className="mt-4">
                <h3 className="font-bold mb-3">Tệp đã tải lên:</h3>
                <ul className="mr-5">
                  {uploadedFiles.map((file) => (
                    <li key={file.url} className="mb-1">
                      <div className="flex items-center">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline"
                        >
                          {truncateFileName(file.name)}
                        </a>
                        <button
                          onClick={() =>
                            handleRemoveFile(uploadedFiles.indexOf(file))
                          }
                          className="ml-2 p-1 text-red-400 hover:text-red-500"
                          title="Xóa tệp"
                          disabled={!isLoggedIn}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {isUploadingVideo && (
            <div className="mt-4">
              <h3 className="font-bold mb-3">Đang tải video...</h3>
              <div className="flex items-center">
                <div className="loader mr-2"></div>
                <span className="text-gray-600">Vui lòng chờ...</span>
              </div>
            </div>
          )}

          {Array.isArray(uploadedVideos) &&
            uploadedVideos.length > 0 &&
            !isUploadingVideo && (
              <div className="mt-4">
                <h3 className="font-bold mb-3">Video đã tải lên:</h3>
                <ul className="flex flex-wrap">
                  {uploadedVideos.map((video) => (
                    <li
                      key={video.url}
                      className="flex flex-col items-center mb-4 mr-4"
                    >
                      <div className="relative">
                        <video
                          src={video.url}
                          controls
                          className="w-40 h-24 object-cover rounded-md mb-2"
                        />
                        <button
                          onClick={() =>
                            handleRemoveVideo(uploadedVideos.indexOf(video))
                          }
                          className="absolute top-0 right-0 p-1 text-red-400 hover:text-red-500"
                          title="Xóa video"
                          disabled={!isLoggedIn}
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <span className="text-blue-500 underline">
                        {truncateFileName(video.name)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          <div className="flex justify-center mt-4 space-x-4">
            <button
              onClick={handleSaveDraft}
              className="bg-gray-400 text-black py-2 px-4 rounded-md transition duration-200 hover:bg-gray-500 w-full max-w-md"
              disabled={!isLoggedIn}
            >
              Lưu bản nháp
            </button>
            <button
              onClick={handlePublish}
              className="bg-green-400 hover:bg-green-500 text-black py-2 px-4 rounded-md transition duration-200 w-full max-w-md"
              disabled={!isLoggedIn}
            >
              {editingId !== null && editingTable === "demos"
                ? "Đăng từ bản nháp"
                : "Đăng ngay"}
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="bg-red-400 text-black py-2 px-4 rounded-md transition duration-200 hover:bg-red-500 w-full max-w-md"
              disabled={!isLoggedIn}
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
              <DiffOutlined className="inline mr-2" /> Bản nháp
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto mt-1 scrollbar-hidden">
            <ul>
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <li
                    key={`${entry.table}-${entry.id}`}
                    className="border-2 border-gray-200 p-4 rounded-xl mb-2 flex flex-col transition duration-300 hover:shadow-lg"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-1">
                        {Array.isArray(entry.images) &&
                        entry.images.length > 0 &&
                        isValidUrl(entry.images[0].url) ? (
                          <Image
                            src={entry.images[0].url}
                            alt={`Entry ${entry.id} image`}
                            width={60}
                            height={60}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                        ) : (
                          <span className="text-gray-500">
                            Không có hình ảnh
                          </span>
                        )}
                      </div>
                      <div className="flex-grow ml-3">
                        <strong className="text-yellow-600 text-lg">
                          {entry.title || "Không có tiêu đề"}
                        </strong>
                        <p className="text-gray-700 text-sm">
                          {entry.content
                            ? entry.content.slice(0, 50) + "..."
                            : "Không có nội dung"}
                        </p>
                        <p className="text-gray-700 text-sm">
                          Chủ đề: {entry.topics || "Chưa chọn"}
                        </p>
                        {Array.isArray(entry.tags) && entry.tags.length > 0 && (
                          <p className="text-gray-700 text-sm">
                            Tags: {entry.tags.join(", ")}
                          </p>
                        )}
                        <p className="text-gray-700 text-sm">
                          Tên: {entry.name}
                        </p>
                        <p className="text-gray-700 text-sm">
                          Trạng thái: Bản nháp
                        </p>
                        {Array.isArray(entry.images) &&
                          entry.images.length > 0 && (
                            <p className="text-gray-700 text-sm">
                              Hình ảnh:{" "}
                              {entry.images
                                .map((img) => truncateFileName(img.name))
                                .join(", ")}
                            </p>
                          )}
                        {Array.isArray(entry.files) &&
                          entry.files.length > 0 && (
                            <p className="text-gray-700 text-sm">
                              Tệp:{" "}
                              {entry.files
                                .map((file) => truncateFileName(file.name))
                                .join(", ")}
                            </p>
                          )}
                        {Array.isArray(entry.videos) &&
                          entry.videos.length > 0 && (
                            <p className="text-gray-700 text-sm">
                              Video:{" "}
                              {entry.videos
                                .map((video) => truncateFileName(video.name))
                                .join(", ")}
                            </p>
                          )}
                        <small className="text-gray-700">
                          {new Date(entry.created_at).toLocaleString()}
                        </small>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-2">
                      <button
                        onClick={() => handleEditDraft(entry)}
                        className="text-green-500 text-sm hover:text-green-600 transition duration-200 underline"
                        title="Sửa"
                        disabled={!isLoggedIn}
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDeleteId(entry.id);
                          setConfirmDeleteTable(entry.table);
                          setShowConfirm(true);
                        }}
                        className="text-red-400 text-sm hover:text-red-500 transition duration-200 underline"
                        title="Xóa"
                        disabled={!isLoggedIn}
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
      </div>

      {showLoginModal && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full border border-gray-200">
            <h2 className="text-xl font-semibold text-black mb-4">
              Yêu cầu đăng nhập
            </h2>
            <p className="text-gray-700 mb-4">
              Bạn cần đăng nhập để tiếp tục viết bài hoặc lưu bản nháp.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleLoginRedirect}
                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => router.push("/")}
                className="bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {mainContent}
      <style jsx>{`
        .border-gradient-to-r {
          border-image: linear-gradient(to right, #93c5fd, #c4b5fd) 1;
        }
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
    </>
  );
}
