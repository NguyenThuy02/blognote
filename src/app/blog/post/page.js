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
import { useRouter, useSearchParams } from "next/navigation";
import AvailableSamples from "../available/page";

export default function PostPage() {
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
  const [loading, setLoading] = useState(true);
  const MAX_IMAGES = 5;
  const router = useRouter();
  const searchParams = useSearchParams();

  // Xử lý thông báo tự động đóng sau 3 giây
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Kiểm tra trạng thái đăng nhập và đồng bộ sự kiện
  useEffect(() => {
    const checkLoginStatus = () => {
      const userData = JSON.parse(localStorage.getItem("user"));
      const loggedIn = !!userData;
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        const userName = userData.name || userData.email;
        if (userName) {
          setName(userName);
          fetchEntries(userName);
          fetchTopics();
          fetchTags();
          initFromQuery();
        } else {
          setNotification({
            message: "Không tìm thấy thông tin tên người dùng trong trạng thái đăng nhập.",
            type: "error",
          });
          setLoading(false);
        }
      } else {
        setLoading(false);
        resetForm();
        setEntries([]);
        setTopicsList([]);
        setTagsList([]);
      }
    };

    const initFromQuery = () => {
      const titleParam = searchParams.get("title");
      const contentParam = searchParams.get("content");
      const topicParam = searchParams.get("topic");
      const tagsParam = searchParams.get("tags");

      if (titleParam) setTitle(titleParam);
      if (contentParam) setContent(contentParam);
      if (topicParam) setTopic(topicParam);
      if (tagsParam)
        setTags(
          tagsParam.split(",").map((tag) => capitalizeFirstLetter(tag.trim()))
        );
    };

    checkLoginStatus();

    const handleStorageChange = (event) => {
      if (event.key === "user" || event.key === null) {
        checkLoginStatus();
      }
    };

    const handleLogoutEvent = () => {
      setIsLoggedIn(false);
      setEntries([]);
      setTopicsList([]);
      setTagsList([]);
      setUploadedImages([]);
      setUploadedFiles([]);
      setUploadedVideos([]);
      setTitle("");
      setContent("");
      setTopic("");
      setCustomTopic("");
      setTags([]);
      setSelectedTag("");
      setCustomTag("");
      setEditingId(null);
      setEditingTable(null);
      setNotification({
        message: "Bạn đã đăng xuất. Vui lòng đăng nhập lại để tiếp tục.",
        type: "info",
      });
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("user-logout", handleLogoutEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-logout", handleLogoutEvent);
    };
  }, [router, searchParams]);

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
                ? item.tags.split(",").map((tag) => tag.trim())
                : Array.isArray(item.tags)
                ? item.tags
                : []
              : []
          ),
          ...(demosData || []).flatMap((item) =>
            item.tags
              ? typeof item.tags === "string"
                ? item.tags.split(",").map((tag) => tag.trim())
                : Array.isArray(item.tags)
                ? item.tags
                : []
              : []
          ),
        ]),
      ].map((tag) => capitalizeFirstLetter(tag));

      setTagsList([
        ...new Set(allTags.map((tag) => ({ value: tag, label: tag }))),
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
        ...new Set(allTopics.map((topic) => ({ value: topic, label: topic }))),
        { value: "Khác", label: "Khác" },
      ]);
    } catch (err) {
      setNotification({
        message: `Không thể tải danh sách chủ đề: ${err.message}`,
        type: "error",
      });
    }
  };

  const fetchEntries = async (userName) => {
    try {
      setLoading(true);
      const { data: demosData, error: demosError } = await supabase
        .from("demos")
        .select(
          "id, title, content, topics, tags, images, files, videos, created_at, name"
        )
        .eq("name", userName)
        .order("created_at", { ascending: false });
      if (demosError) throw demosError;

      const normalizeMedia = (media) => {
        if (!media || typeof media !== "string") return [];
        if (isValidUrl(media)) {
          return [{ url: media, name: media.split("/").pop() || "unnamed" }];
        }
        return [];
      };

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
        images: normalizeMedia(entry.images),
        files: normalizeMedia(entry.files),
        videos: normalizeMedia(entry.videos),
      }));

      setEntries(demosFormatted);
    } catch (err) {
      console.error("Error in fetchEntries:", err);
      setNotification({
        message: `Không thể tải dữ liệu: ${err.message}`,
        type: "error",
      });
    } finally {
      setLoading(false);
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
    if (!isLoggedIn) {
      setNotification({
        message: "Bạn cần đăng nhập để thực hiện hành động này.",
        type: "error",
      });
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
    if (!isLoggedIn) {
      return;
    }
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
        images: uploadedImages.length > 0 ? uploadedImages[0].url : null,
        files: uploadedFiles.length > 0 ? uploadedFiles[0].url : null,
        videos: uploadedVideos.length > 0 ? uploadedVideos[0].url : null,
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
      await fetchEntries(name);
      await fetchTopics();
      await fetchTags();
    } catch (error) {
      console.error("Error in handleSaveDraft:", error);
      setNotification({
        message: `Không thể lưu bản nháp. Lỗi: ${error.message}`,
        type: "error",
      });
    }
  };

  const handlePublish = async () => {
    if (!isLoggedIn) {
      return;
    }
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
        images: uploadedImages.length > 0 ? uploadedImages[0].url : null,
        files: uploadedFiles.length > 0 ? uploadedFiles[0].url : null,
        videos: uploadedVideos.length > 0 ? uploadedVideos[0].url : null,
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
      await fetchEntries(name);
      await fetchTopics();
      await fetchTags();
      router.push("/blog/post");
    } catch (error) {
      console.error("Error in handlePublish:", error);
      setNotification({
        message: `Không thể đăng bài viết. Lỗi: ${error.message}`,
        type: "error",
      });
    }
  };

  const handleEditDraft = (entry) => {
    if (!isLoggedIn) {
      return;
    }
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
    setUploadedImages(entry.images || []);
    setUploadedFiles(entry.files || []);
    setUploadedVideos(entry.videos || []);
    setEditingId(entry.id);
    setEditingTable(entry.table);
    setImageError("");
    setTitleError("");
    setContentError("");
    setTopicError("");
    setTagError("");
  };

  const handleUseSample = (post) => {
    if (!isLoggedIn) {
      return;
    }
    setTitle(post.title);
    setContent(post.content);
    setTopic(post.topics);
    setTags(post.tags ? post.tags.map((tag) => capitalizeFirstLetter(tag)) : []);
    setCustomTopic("");
    setSelectedTag("");
    setCustomTag("");
    setUploadedImages([]);
    setUploadedFiles([]);
    setUploadedVideos([]);
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
    if (!isLoggedIn) {
      return;
    }
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
          if (!data.secure_url)
            throw new Error("Không nhận được URL từ Cloudinary");
          return { name: file.name, url: data.secure_url };
        })
      );
      setUploadedImages((prev) => [...prev, ...uploadedUrls]);
      setImageError("");
    } catch (err) {
      console.error("Error in handleImageUpload:", err);
      setImageError(err.message || "Không thể tải lên hình ảnh.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileUpload = async (e) => {
    if (!isLoggedIn) {
      return;
    }
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
      console.error("Error in handleFileUpload:", err);
      setNotification({
        message: err.message || "Không thể tải lên tệp.",
        type: "error",
      });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleVideoUpload = async (e) => {
    if (!isLoggedIn) {
      return;
    }
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
      console.error("Error in handleVideoUpload:", err);
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

  const truncateFileName = (name, maxLength = 10) => {
    if (!name) return "unnamed";
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + "...";
  };

  const handleLoginRedirect = () => {
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-6 w-6 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }


  const mainContent = (
    <div className="flex flex-col min-h-screen mt-[76px] mb-[-7px] gap-5 p-5 m-[-15px] relative">
      <div className="flex flex-col lg:flex-row gap-5">
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
                    console.error("Error in delete:", err);
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

            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 mb-8 text-center">
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
                  />
                  {titleError && (
                    <p className="text-red-600 text-sm mb-2">{titleError}</p>
                  )}
                </div>
                <div className="lg:w-1/3">
                  <h2 className="text-xl text-black mb-3">Chủ đề bài viết</h2>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-4 rounded-xl mb-1 text-gray-700 transition duration-300 bg-white shadow-[0_0_8px_rgba(147,197,253,0.8),0_0_8px_rgba(196,181,253,0.8)] focus:shadow-[0_0_12px_rgba(96,165,250,1)] focus:ring-2 focus:ring-blue-300"
                    style={{ outline: "none", border: "none" }}
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
                    />
                  )}
                  {topicError && (
                    <p className="text-red-600 text-sm mb-2">{topicError}</p>
                  )}
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
                        if (e.key === "Enter" && customTag)
                          handleAddTag("Khác");
                      }}
                      className="w-full p-4 rounded-xl mt-2 mb-1 text-gray-700 transition duration-300 bg-white shadow-[0_0_8px_rgba(147,197,253,0.8),0_0_8px_rgba(196,181,253,0.8)] focus:shadow-[0_0_12px_rgba(96,165,250,1)] focus:ring-2 focus:ring-purple-300"
                      style={{ outline: "none", border: "none" }}
                    />
                  )}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 text-red-400 hover:text-red-500"
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
                    {uploadedImages.map((image, index) =>
                      image.url && isValidUrl(image.url) ? (
                        <li
                          key={`image-${index}`}
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
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-0 right-0 p-1 text-red-400 hover:text-red-500"
                              title="Xóa hình ảnh"
                            >
                              <FaTimes />
                            </button>
                          </div>
                          <span className="text-blue-500 text-sm">
                            {truncateFileName(image.name)}
                          </span>
                        </li>
                      ) : (
                        <li
                          key={`image-error-${index}`}
                          className="flex flex-col items-center mb-4 mr-4"
                        >
                          <span className="text-red-500 text-sm">
                            Hình ảnh không hợp lệ
                          </span>
                        </li>
                      )
                    )}
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
                    {uploadedVideos.map((video, index) => (
                      <li
                        key={`video-${index}`}
                        className="flex flex-col items-center mb-4 mr-4"
                      >
                        <div className="relative">
                          <video
                            src={video.url}
                            controls
                            className="w-40 h-24 object-cover rounded-md mb-2"
                          />
                          <button
                            onClick={() => handleRemoveVideo(index)}
                            className="absolute top-0 right-0 p-1 text-red-400 hover:text-red-500"
                            title="Xóa video"
                          >
                            <FaTimes />
                          </button>
                        </div>
                        <span className="text-blue-500 text-sm">
                          {truncateFileName(video.name)}
                        </span>
                      </li>
                    ))}
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
                    {uploadedFiles.map((file, index) => (
                      <li key={`file-${index}`} className="mb-2">
                        <div className="flex items-center">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 text-sm"
                          >
                            {truncateFileName(file.name)}
                          </a>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="ml-2 p-1 text-red-400 hover:text-red-500"
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
                {editingId !== null && editingTable === "demos"
                  ? "Đăng từ bản nháp"
                  : "Đăng ngay"}
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="bg-red-400 text-black py-2 px-4 rounded-md transition duration-200 hover:bg-red-500 w-full max-w-md"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>

        <div className="lg:w-1/3 lg:max-w-sm">
          <div className="p-4 border border-gray-300 rounded-lg bg-white h-[calc(0.61*(100vh-5px))] flex flex-col">
            <div className="sticky top-0 bg-white z-0 pb-2 border-b border-gray-200">
              <h2 className="font-bold text-2xl text-gray-700">
                <DiffOutlined className="inline mr-2" /> Bản nháp
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hidden">
              <h3 className="font-semibold text-gray-700 mb-2">
                Danh sách bản nháp
              </h3>
              <ul>
                {entries.length > 0 ? (
                  entries.map((entry) => (
                    <li
                      key={`draft-${entry.table}-${entry.id}`}
                      className="border-2 border-gray-200 p-2 rounded-xl mb-2 flex transition duration-300 hover:shadow-lg"
                    >
                      <div className="flex-shrink-0 mr-2 flex flex-col gap-1 items-center">
                        {Array.isArray(entry.images) &&
                        entry.images.length > 0 &&
                        isValidUrl(entry.images[0].url) ? (
                          <div className="flex flex-col items-center">
                            <Image
                              src={entry.images[0].url}
                              alt={`Entry ${entry.id} image`}
                              width={40}
                              height={40}
                              className="w-10 h-10 object-cover rounded-md"
                            />
                            <span className="text-blue-500 text-sm">
                              {truncateFileName(entry.images[0].name)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">No img</span>
                        )}
                        {Array.isArray(entry.files) &&
                          entry.files.length > 0 && (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-md">
                                <FileTextOutlined className="text-gray-600" />
                              </div>
                              <span className="text-blue-500 text-sm">
                                {truncateFileName(entry.files[0].name)}
                              </span>
                            </div>
                          )}
                        {Array.isArray(entry.videos) &&
                          entry.videos.length > 0 && (
                            <div className="flex flex-col items-center">
                              <video
                                src={entry.videos[0].url}
                                className="w-10 h-10 object-cover rounded-md"
                                muted
                              />
                              <span className="text-blue-500 text-sm">
                                {truncateFileName(entry.videos[0].name)}
                              </span>
                            </div>
                          )}
                      </div>
                      <div className="flex-grow flex flex-col">
                        <strong className="text-yellow-600 text-sm">
                          {entry.title || "Không có tiêu đề"}
                        </strong>
                        <p className="text-gray-700 text-sm">
                          Nội dung:{" "}
                          {entry.content
                            ? entry.content.slice(0, 30) + "..."
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
                        <small className="text-gray-700 text-sm">
                          {new Date(entry.created_at).toLocaleString()}
                        </small>
                        <div className="flex justify-end space-x-2 mt-1">
                          <button
                            onClick={() => handleEditDraft(entry)}
                            className="text-green-500 text-sm hover:text-green-600 transition duration-200 underline"
                            title="Sửa"
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
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-700 text-sm">
                    Không tìm thấy bản nháp nào.
                  </p>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <AvailableSamples onSelectSample={handleUseSample} />
      </div>
    </div>
  );

  return (
    <>
      {mainContent}
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
    </>
  );
}