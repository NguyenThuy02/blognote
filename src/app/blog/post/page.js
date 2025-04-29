"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  FaTimes,
  FaPaperPlane,
  FaSave,
  FaTrash,
  FaSearch,
  FaEye,
} from "react-icons/fa";
import {
  FileOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  DiffOutlined,
} from "@ant-design/icons";
import { supabase } from "../../../lib/supabase";
import Notification from "../../../utils/notification";
import ThemeSelector, { themes, getThemeClasses } from "../../../utils/color";
import ScrollToTop from "../../../utils/scroll";
import Confirm from "../../../utils/error";
import { useRouter, useSearchParams } from "next/navigation";
import AvailableSamples from "../available/page";

// Tích hợp thành phần Emoji với nhập động
const Emoji = dynamic(() => import("../emoji/page"), {
  ssr: false,
  loading: () => <div>Đang tải biểu tượng cảm xúc...</div>,
});

export default function PostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  const [topicsList, setTopicsList] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadingCount, setUploadingCount] = useState({
    images: 0,
    files: 0,
    videos: 0,
  });
  const [uploadingFiles, setUploadingFiles] = useState([]);
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
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingTable, setEditingTable] = useState(null);
  const [name, setName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDrafts, setShowDrafts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [livePreview, setLivePreview] = useState(false);
  const [activeTab, setActiveTab] = useState("post");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isTitleHidden, setIsTitleHidden] = useState(false);
  const [theme, setTheme] = useState(themes[0]?.value || "default");
  const searchInputRef = useRef(null);
  const sidebarRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Ghi nhớ tham số tìm kiếm
  const memoizedSearchParams = useMemo(() => {
    return {
      title: searchParams.get("title"),
      content: searchParams.get("content"),
      topic: searchParams.get("topic"),
      tags: searchParams.get("tags"),
    };
  }, [searchParams]);

  // Xử lý tự động đóng thông báo
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
            message: "Không tìm thấy thông tin tên người dùng.",
            type: "error",
          });
          setLoading(false);
        }
      } else {
        setLoading(false);
        resetForm();
        setEntries([]);
        setFilteredEntries([]);
        setTopicsList([]);
        setTagsList([]);
      }
    };

    const initFromQuery = () => {
      if (memoizedSearchParams.title) setTitle(memoizedSearchParams.title);
      if (memoizedSearchParams.content)
        setContent(memoizedSearchParams.content);
      if (memoizedSearchParams.topic) setTopic(memoizedSearchParams.topic);
      if (memoizedSearchParams.tags)
        setTags(
          memoizedSearchParams.tags
            .split(",")
            .map((tag) => capitalizeFirstLetter(tag.trim()))
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
      setFilteredEntries([]);
      setTopicsList([]);
      setTagsList([]);
      setUploadedImages([]);
      setUploadedFiles([]);
      setUploadedVideos([]);
      resetForm();
      setNotification({
        message: "Bạn đã đăng xuất. Vui lòng đăng nhập lại.",
        type: "info",
      });
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("user-logout", handleLogoutEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-logout", handleLogoutEvent);
    };
  }, [memoizedSearchParams]);

  // Gợi ý thẻ dựa trên nội dung
  useEffect(() => {
    const keywords = content
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3);
    const suggestions = tagsList
      .filter((tag) =>
        keywords.some((keyword) => tag.value.toLowerCase().includes(keyword))
      )
      .slice(0, 5);
    setTagSuggestions(suggestions);
  }, [content, tagsList]);

  // Xử lý cuộn để ẩn thẻ
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Xử lý cuộn thanh bên để ẩn tiêu đề và tự động cuộn đến ô tìm kiếm
  useEffect(() => {
    if (showDrafts && searchInputRef.current) {
      searchInputRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      searchInputRef.current.focus();
    }

    const handleSidebarScroll = () => {
      if (scrollContainerRef.current) {
        const scrollTop = scrollContainerRef.current.scrollTop;
        setIsTitleHidden(scrollTop > 50);
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleSidebarScroll);
    }
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleSidebarScroll);
      }
    };
  }, [showDrafts]);

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

      const { data: demoPurposeData, error: demoPurposeError } = await supabase
        .from("demopurpose")
        .select("tags")
        .not("tags", "is", null);
      if (demoPurposeError) throw demoPurposeError;

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
          ...(demoPurposeData || []).flatMap((item) =>
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
        message: `Không thể tải danh sách thẻ: ${err.message}`,
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

      const { data: demoPurposeData, error: demoPurposeError } = await supabase
        .from("demopurpose")
        .select("topics")
        .not("topics", "is", null);
      if (demoPurposeError) throw demoPurposeError;

      const allTopics = [
        ...new Set([
          ...(demosData || []).map((item) =>
            capitalizeFirstLetter(item.topics)
          ),
          ...(postsData || []).map((item) =>
            capitalizeFirstLetter(item.topics)
          ),
          ...(demoPurposeData || []).map((item) =>
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

      // Fetch from demos (giữ nguyên logic gốc)
      const { data: demosData, error: demosError } = await supabase
        .from("demos")
        .select(
          "id, title, content, topics, tags, images, files, videos, created_at, name"
        )
        .eq("name", userName)
        .order("created_at", { ascending: false });
      if (demosError) throw demosError;

      // Fetch from demopurpose where purpose = 'draft'
      const { data: demoPurposeData, error: demoPurposeError } = await supabase
        .from("demopurpose")
        .select("id, topics, tags, story_description, images, name, created_at")
        .eq("name", userName)
        .eq("purpose", "draft")
        .order("created_at", { ascending: false });
      if (demoPurposeError) throw demoPurposeError;

      const normalizeMedia = (media) => {
        if (!media) return [];
        if (typeof media === "string") {
          return media.split(",").filter((url) => isValidUrl(url));
        }
        return [];
      };

      // Normalize demos data (giữ nguyên logic gốc)
      const demosFormatted = demosData.map((entry) => ({
        id: entry.id,
        table: "demos",
        title: entry.title || "Không có tiêu đề",
        content: entry.content || "",
        topics: capitalizeFirstLetter(entry.topics || ""),
        tags: entry.tags
          ? Array.isArray(entry.tags)
            ? entry.tags.map((tag) => capitalizeFirstLetter(tag.trim()))
            : typeof entry.tags === "string"
            ? entry.tags
                .split(",")
                .map((tag) => capitalizeFirstLetter(tag.trim()))
            : []
          : [],
        images: normalizeMedia(entry.images),
        files: normalizeMedia(entry.files),
        videos: normalizeMedia(entry.videos),
        created_at: entry.created_at,
        name: entry.name,
      }));

      // Normalize demopurpose data
      const demoPurposeFormatted = demoPurposeData.map((entry) => ({
        id: entry.id,
        table: "demopurpose",
        title: entry.story_description || "Không có tiêu đề",
        content: entry.story_description || "",
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
        files: [],
        videos: [],
        created_at: entry.created_at,
        name: entry.name,
      }));

      // Combine and sort entries
      const combinedEntries = [...demosFormatted, ...demoPurposeFormatted].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setEntries(combinedEntries);
      setFilteredEntries(combinedEntries);
    } catch (err) {
      console.error("Lỗi trong fetchEntries:", err);
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
      setTopicError("Vui lòng chọn hoặc nhập chủ đề.");
      hasError = true;
    }
    if (tags.length === 0) {
      setTagError("Vui lòng chọn ít nhất một thẻ.");
      hasError = true;
    }
    if (!isLoggedIn) {
      setNotification({
        message: "Vui lòng đăng nhập để thực hiện hành động này.",
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
    if (!isLoggedIn) return;
    if (validateInputs()) return;
    try {
      const finalTopic = capitalizeFirstLetter(
        topic === "Khác" ? customTopic : topic
      );
      const table = editingTable || "demopurpose"; // Mặc định lưu vào demopurpose nếu không chỉnh sửa
      const draftData =
        table === "demos"
          ? {
              title: title || "Không có tiêu đề",
              content: content || "",
              topics: finalTopic,
              tags: tags.join(","),
              images:
                uploadedImages.length > 0 ? uploadedImages.join(",") : null,
              files: uploadedFiles.length > 0 ? uploadedFiles.join(",") : null,
              videos:
                uploadedVideos.length > 0 ? uploadedVideos.join(",") : null,
              name,
            }
          : {
              topics: finalTopic,
              tags: tags.join(","),
              story_description: content || title || "Không có nội dung",
              images:
                uploadedImages.length > 0 ? uploadedImages.join(",") : null,
              purpose: "draft",
              name,
            };

      if (editingId !== null) {
        const { data, error } = await supabase
          .from(table)
          .update(draftData)
          .eq("id", editingId)
          .eq(
            table === "demos" ? "name" : "purpose",
            table === "demos" ? name : "draft"
          )
          .select()
          .single();
        if (error) throw error;
        setEntries(
          entries.map((entry) =>
            entry.id === editingId && entry.table === table
              ? {
                  ...data,
                  table,
                  title:
                    table === "demos" ? data.title : data.story_description,
                  content:
                    table === "demos" ? data.content : data.story_description,
                }
              : entry
          )
        );
        setNotification({
          message: "Bản nháp đã được cập nhật thành công!",
          type: "success",
        });
      } else {
        const { data, error } = await supabase
          .from(table)
          .insert([draftData])
          .select()
          .single();
        if (error) throw error;
        setEntries([
          {
            ...data,
            table,
            title: table === "demos" ? data.title : data.story_description,
            content: table === "demos" ? data.content : data.story_description,
          },
          ...entries,
        ]);
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
      console.error("Lỗi trong handleSaveDraft:", error);
      setNotification({
        message: `Không thể lưu bản nháp: ${error.message}`,
        type: "error",
      });
    }
  };

  const handlePublish = async () => {
    if (!isLoggedIn) return;
    if (validateInputs()) return;

    try {
      const finalTopic = capitalizeFirstLetter(
        topic === "Khác" ? customTopic : topic
      );
      const publishedData = {
        title,
        content,
        topics: finalTopic,
        tags,
        images: uploadedImages.length > 0 ? uploadedImages.join(",") : null,
        files: uploadedFiles.length > 0 ? uploadedFiles.join(",") : null,
        videos: uploadedVideos.length > 0 ? uploadedVideos.join(",") : null,
        name,
      };

      const { data, error } = await supabase
        .from("posts")
        .insert([publishedData])
        .select()
        .single();

      if (error) throw error;

      if (editingId !== null) {
        await supabase
          .from(editingTable)
          .delete()
          .eq("id", editingId)
          .eq(
            editingTable === "demos" ? "name" : "purpose",
            editingTable === "demos" ? name : "draft"
          );
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
      console.error("Lỗi trong handlePublish:", error);
      setNotification({
        message: `Không thể đăng bài viết: ${error.message}`,
        type: "error",
      });
    }
  };

  const handleEditDraft = (entry) => {
    if (!isLoggedIn) return;
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
    setTags(entry.tags || []);
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
    setActiveTab("post");
  };

  const handleUseSample = (post) => {
    if (!isLoggedIn) return;
    setTitle(post.title);
    setContent(post.content);
    setTopic(post.topics);
    setTags(
      post.tags ? post.tags.map((tag) => capitalizeFirstLetter(tag)) : []
    );
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
    setActiveTab("post");
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
    setUploadingCount({ images: 0, files: 0, videos: 0 });
    setUploadingFiles([]);
    setImageError("");
    setTitleError("");
    setContentError("");
    setTopicError("");
    setTagError("");
    setEditingId(null);
    setEditingTable(null);
    setLivePreview(false);
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const checkDuplicateFile = (file, existingFiles) => {
    return existingFiles.some((url) => url.split("/").pop() === file.name);
  };

  const handleImageUpload = async (e) => {
    if (!isLoggedIn) return;
    const files = Array.from(e.target.files);

    const duplicates = files.filter((file) =>
      checkDuplicateFile(file, uploadedImages)
    );
    if (duplicates.length > 0) {
      setImageError(
        `Các tệp trùng lặp: ${duplicates
          .map((f) => truncateFileName(f.name))
          .join(", ")}`
      );
      return;
    }

    setIsUploadingImage(true);
    setUploadingCount((prev) => ({ ...prev, images: files.length }));
    setUploadingFiles((prev) =>
      files.map((file) => ({
        name: file.name,
        type: "image",
        status: "uploading",
      }))
    );

    try {
      const uploadedUrls = [];
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("Tệp quá lớn. Vui lòng chọn tệp nhỏ hơn 10MB");
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "blognote");
        formData.append("cloud_name", "dlaoxrnad");
        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dlaoxrnad/image/upload",
          { method: "POST", body: formData }
        );
        if (!response.ok) throw new Error("Tải lên thất bại");
        const data = await response.json();
        if (!data.secure_url)
          throw new Error("Không nhận được URL từ Cloudinary");

        uploadedUrls.push(data.secure_url);

        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.name === file.name && f.type === "image"
              ? { ...f, status: "completed" }
              : f
          )
        );
        setUploadedImages((prev) => [...prev, data.secure_url]);
        setUploadingCount((prev) => ({ ...prev, images: prev.images - 1 }));
      }

      const { error } = await supabase.from("demopurpose").upsert({
        name,
        story_description: title || "Không có tiêu đề",
        images: uploadedUrls.join(","),
        purpose: "draft",
      });
      if (error) throw error;

      setImageError("");
    } catch (err) {
      console.error("Lỗi trong handleImageUpload:", err);
      setImageError(err.message || "Không thể tải lên hình ảnh.");
    } finally {
      setIsUploadingImage(false);
      setUploadingCount((prev) => ({ ...prev, images: 0 }));
      setUploadingFiles((prev) => prev.filter((f) => f.status !== "completed"));
    }
  };

  const handleFileUpload = async (e) => {
    if (!isLoggedIn) return;
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

    const duplicates = validFiles.filter((file) =>
      checkDuplicateFile(file, uploadedFiles)
    );
    if (duplicates.length > 0) {
      setNotification({
        message: `Các tệp trùng lặp: ${duplicates
          .map((f) => truncateFileName(f.name))
          .join(", ")}`,
        type: "warning",
      });
      return;
    }

    setIsUploadingFile(true);
    setUploadingCount((prev) => ({ ...prev, files: validFiles.length }));
    setUploadingFiles((prev) =>
      validFiles.map((file) => ({
        name: file.name,
        type: "file",
        status: "uploading",
      }))
    );

    try {
      const uploadedFileUrls = [];
      for (const file of validFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "blognote");
        formData.append("cloud_name", "dlaoxrnad");
        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dlaoxrnad/raw/upload",
          { method: "POST", body: formData }
        );
        if (!response.ok) throw new Error("Tải lên thất bại");
        const data = await response.json();

        uploadedFileUrls.push(data.secure_url);

        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.name === file.name && f.type === "file"
              ? { ...f, status: "completed" }
              : f
          )
        );
        setUploadedFiles((prev) => [...prev, data.secure_url]);
        setUploadingCount((prev) => ({ ...prev, files: prev.files - 1 }));
      }

      const { error } = await supabase.from("demopurpose").upsert({
        name,
        story_description: title || "Không có tiêu đề",
        files: uploadedFileUrls.join(","),
        purpose: "draft",
      });
      if (error) throw error;
    } catch (err) {
      console.error("Lỗi trong handleFileUpload:", err);
      setNotification({
        message: err.message || "Không thể tải lên tệp.",
        type: "error",
      });
    } finally {
      setIsUploadingFile(false);
      setUploadingCount((prev) => ({ ...prev, files: 0 }));
      setUploadingFiles((prev) => prev.filter((f) => f.status !== "completed"));
    }
  };

  const handleVideoUpload = async (e) => {
    if (!isLoggedIn) return;
    const files = Array.from(e.target.files);
    const validVideos = files.filter((file) => file.type.startsWith("video/"));

    if (validVideos.length !== files.length) {
      setNotification({
        message: "Vui lòng chỉ tải lên tệp video.",
        type: "warning",
      });
      return;
    }

    const duplicates = validVideos.filter((file) =>
      checkDuplicateFile(file, uploadedVideos)
    );
    if (duplicates.length > 0) {
      setNotification({
        message: `Các tệp trùng lặp: ${duplicates
          .map((f) => truncateFileName(f.name))
          .join(", ")}`,
        type: "warning",
      });
      return;
    }

    setIsUploadingVideo(true);
    setUploadingCount((prev) => ({ ...prev, videos: validVideos.length }));
    setUploadingFiles((prev) =>
      validVideos.map((file) => ({
        name: file.name,
        type: "video",
        status: "uploading",
      }))
    );

    try {
      const uploadedVideoUrls = [];
      for (const file of validVideos) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "blognote");
        formData.append("cloud_name", "dlaoxrnad");
        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dlaoxrnad/video/upload",
          { method: "POST", body: formData }
        );
        if (!response.ok) throw new Error("Tải video thất bại");
        const data = await response.json();

        uploadedVideoUrls.push(data.secure_url);

        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.name === file.name && f.type === "video"
              ? { ...f, status: "completed" }
              : f
          )
        );
        setUploadedVideos((prev) => [...prev, data.secure_url]);
        setUploadingCount((prev) => ({ ...prev, videos: prev.videos - 1 }));
      }

      const { error } = await supabase.from("demopurpose").upsert({
        name,
        story_description: title || "Không có tiêu đề",
        videos: uploadedVideoUrls.join(","),
        purpose: "draft",
      });
      if (error) throw error;
    } catch (err) {
      console.error("Lỗi trong handleVideoUpload:", err);
      setNotification({
        message: err.message || "Không thể tải lên video.",
        type: "error",
      });
    } finally {
      setIsUploadingVideo(false);
      setUploadingCount((prev) => ({ ...prev, videos: 0 }));
      setUploadingFiles((prev) => prev.filter((f) => f.status !== "completed"));
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

  const truncateFileName = (name, maxLength = 15) => {
    if (!name) return "không có tên";
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + "...";
  };

  const handleLoginRedirect = () => {
    router.push("/auth/login");
  };

  const handleSearchDrafts = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    filterDrafts(query, filterTag);
  };

  const handleFilterTag = (tag) => {
    setFilterTag(tag);
    filterDrafts(searchQuery, tag);
  };

  const filterDrafts = (query, tag) => {
    let filtered = entries;
    if (query) {
      filtered = filtered.filter(
        (entry) =>
          entry.title?.toLowerCase().includes(query) ||
          entry.content?.toLowerCase().includes(query) ||
          entry.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }
    if (tag) {
      filtered = filtered.filter((entry) => entry.tags?.includes(tag));
    }
    setFilteredEntries(filtered);
  };

  const calculateProgress = () => {
    if (activeTab === "sample") return 0;
    let filled = 0;
    if (title) filled++;
    if (content) filled++;
    if (topic || customTopic) filled++;
    if (tags.length > 0) filled++;
    if (
      uploadedImages.length > 0 ||
      uploadedFiles.length > 0 ||
      uploadedVideos.length > 0
    )
      filled++;
    return (filled / 5) * 100;
  };

  const renderForm = (formType) => {
    if (formType === "sample") {
      return <AvailableSamples onSelectSample={handleUseSample} />;
    }

    return (
      <div className="bg-teal-50 backdrop-blur-lg rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="sticky top-0 z-30 flex items-center justify-between p-4 bg-gradient-to-r from-teal-500 to-indigo-400 rounded-lg">
          <h1 className="text-2xl font-bold text-white">Viết bài mới</h1>
          <div className="relative w-12 h-12">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              className="absolute"
            >
              <circle
                cx="24"
                cy="24"
                r="22"
                stroke="#e5e7eb"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="24"
                cy="24"
                r="22"
                stroke="#22c55e"
                strokeWidth="4"
                fill="none"
                strokeDasharray="138"
                strokeDashoffset={138 - (calculateProgress() / 100) * 138}
                className="transform -rotate-90 origin-center transition-stroke-dashoffset duration-500"
              />
            </svg>
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-green-500">
              {Math.round(calculateProgress())}%
            </span>
          </div>
        </div>

        <>
          {/* Ô nhập tiêu đề */}
          <div className="relative mb-8">
            <div className="relative">
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="peer w-full p-4 pt-6 pr-12 pb-8 bg-transparent border-b-2 border-teal-300 text-teal-700 text-base focus:outline-none focus:border-teal-500 transition-colors duration-300"
                placeholder=" "
                aria-label="Tiêu đề bài viết"
                aria-invalid={!!titleError}
                aria-describedby="title-error"
              />
              <label
                htmlFor="title"
                className="mt-5 absolute left-4 top-4 text-teal-400 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm peer-focus:text-teal-500 peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:text-sm"
              >
                Tiêu đề bài viết
              </label>
              <div className="absolute right-3 bottom-2">
                <Emoji onSelect={(emoji) => setTitle((prev) => prev + emoji)} />
              </div>
            </div>
            {titleError && (
              <p
                id="title-error"
                className="text-red-500 text-sm mt-2 animate-pulse"
              >
                {titleError}
              </p>
            )}
          </div>

          {/* Ô nhập nội dung */}
          <div className="relative mb-8">
            <div className="relative">
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="peer w-full min-h-[16rem] p-4 pt-6 pr-12 pb-8 bg-transparent border-b-2 border-teal-300 text-teal-700 focus:outline-none focus:border-teal-500 rounded-md transition-colors duration-300 resize-none"
                placeholder=" "
                style={{ height: "auto" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                aria-label="Mô tả bài viết"
                aria-invalid={!!contentError}
                aria-describedby="content-error"
              />
              <label
                htmlFor="content"
                className="absolute left-4 top-4 text-teal-400 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm peer-focus:text-teal-500 peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:text-sm"
              >
                Mô tả bài viết
              </label>
              <div className="absolute right-3 bottom-2">
                <Emoji
                  onSelect={(emoji) => setContent((prev) => prev + emoji)}
                />
              </div>
            </div>
            {contentError && (
              <p
                id="content-error"
                className="text-red-500 text-sm mt-2 animate-pulse"
              >
                {contentError}
              </p>
            )}
          </div>

          {/* Chủ đề và thẻ */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-1 relative">
              <select
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="peer w-full p-4 pt-6 bg-transparent border-b-2 border-teal-300 text-teal-700 focus:outline-none focus:border-teal-500 rounded-md appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%2314b8a6%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.5em]"
                aria-label="Chủ đề bài viết"
                aria-invalid={!!topicError}
                aria-describedby="topic-error"
              >
                <option value="" disabled className="text-gray-400">
                  Chọn chủ đề
                </option>
                {topicsList.map((t) => (
                  <option
                    key={t.value}
                    value={t.value}
                    className="text-teal-700"
                  >
                    {t.label}
                  </option>
                ))}
              </select>
              <label
                htmlFor="topic"
                className="absolute left-4 top-4 text-teal-400 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm peer-focus:text-teal-500 peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:text-sm"
              >
                Chủ đề bài viết
              </label>
              {topic === "Khác" && (
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) =>
                    setCustomTopic(capitalizeFirstLetter(e.target.value))
                  }
                  className="w-full p-4 mt-4 bg-transparent border-b-2 border-teal-300 text-teal-700 focus:outline-none focus:border-teal-500 rounded-md"
                  placeholder="Nhập chủ đề tùy chỉnh"
                  aria-label="Chủ đề tùy chỉnh"
                />
              )}
              {topicError && (
                <p
                  id="topic-error"
                  className="text-red-500 text-sm mt-2 animate-pulse"
                >
                  {topicError}
                </p>
              )}
            </div>

            <div className="flex-1">
              <div className="relative">
                <select
                  id="tags"
                  value={selectedTag}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedTag(value);
                    if (value !== "Khác") handleAddTag(value);
                  }}
                  className="peer w-full p-4 pt-6 bg-transparent border-b-2 border-teal-300 text-teal-700 focus:outline-none focus:border-teal-500 rounded-md appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%2314b8a6%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.5em]"
                  aria-label="Thẻ"
                  aria-invalid={!!tagError}
                  aria-describedby="tag-error"
                >
                  <option value="" disabled className="text-gray-400">
                    Chọn thẻ
                  </option>
                  {tagsList.map((t) => (
                    <option
                      key={t.value}
                      value={t.value}
                      className="text-teal-700"
                    >
                      {t.label}
                    </option>
                  ))}
                </select>
                <label
                  htmlFor="tags"
                  className="absolute left-4 top-4 text-teal-400 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm peer-focus:text-teal-500 peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:text-sm"
                >
                  Thẻ
                </label>
              </div>
              {selectedTag === "Khác" && (
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) =>
                    setCustomTag(capitalizeFirstLetter(e.target.value))
                  }
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && customTag) handleAddTag("Khác");
                  }}
                  className="w-full p-4 mt-4 bg-transparent border-b-2 border-teal-300 text-teal-700 focus:outline-none focus:border-teal-500 rounded-md"
                  placeholder="Nhập thẻ tùy chỉnh"
                  aria-label="Thẻ tùy chỉnh"
                />
              )}
              {tagSuggestions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {tagSuggestions.map((tag) => (
                    <button
                      key={tag.value}
                      onClick={() => handleAddTag(tag.value)}
                      className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm hover:bg-teal-200 transition-colors duration-200"
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {tags.map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="bg-teal-500 text-white px-4 py-2 rounded-full flex items-center text-sm transition-transform duration-200 hover:scale-105"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-white hover:text-red-300 transition-colors"
                        aria-label={`Xóa thẻ ${tag}`}
                      >
                        <FaTimes size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {tagError && (
                <p
                  id="tag-error"
                  className="text-red-500 text-sm mt-2 animate-pulse"
                >
                  {tagError}
                </p>
              )}
            </div>
          </div>

          {/* Tải lên phương tiện */}
          <div className="mb-8 text-sm">
            <h3 className="font-bold text-teal-600 mb-4">
              Tệp đa phương tiện
            </h3>
            <div className="flex flex-wrap gap-4">
              <label className="bg-teal-500 text-white px-6 py-3 rounded-full flex items-center cursor-pointer hover:bg-teal-600 transition-all duration-200 hover:scale-105 shadow-md">
                <FileOutlined className="mr-2" /> Ảnh
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  aria-label="Tải lên hình ảnh"
                />
              </label>
              <label className="bg-indigo-500 text-white px-6 py-3 rounded-full flex items-center cursor-pointer hover:bg-indigo-600 transition-all duration-200 hover:scale-105 shadow-md">
                <FileTextOutlined className="mr-2" /> Word/PDF
                <input
                  type="file"
                  accept=".doc,.docx,.pdf"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  aria-label="Tải lên tệp Word hoặc PDF"
                />
              </label>
              <label className="bg-purple-500 text-white px-6 py-3 rounded-full flex items-center cursor-pointer hover:bg-purple-600 transition-all duration-200 hover:scale-105 shadow-md">
                <VideoCameraOutlined className="mr-2" /> Video
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoUpload}
                  className="hidden"
                  aria-label="Tải lên video"
                />
              </label>
            </div>

            {(uploadingCount.images > 0 || isUploadingImage) && (
              <div className="mt-4 flex items-center">
                <div className="w-6 h-6 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin mr-3"></div>
                <span className="text-teal-600">
                  Đang tải {uploadingCount.images} hình ảnh...
                </span>
              </div>
            )}
            {(uploadingCount.files > 0 || isUploadingFile) && (
              <div className="mt-4 flex items-center">
                <div className="w-6 h-6 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin mr-3"></div>
                <span className="text-teal-600">
                  Đang tải {uploadingCount.files} tệp...
                </span>
              </div>
            )}
            {(uploadingCount.videos > 0 || isUploadingVideo) && (
              <div className="mt-4 flex items-center">
                <div className="w-6 h-6 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin mr-3"></div>
                <span className="text-teal-600">
                  Đang tải {uploadingCount.videos} video...
                </span>
              </div>
            )}

            {imageError && (
              <p className="text-red-500 text-sm mt-4 animate-pulse">
                {imageError}
              </p>
            )}

            {uploadedImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {uploadedImages.map((url, index) =>
                  isValidUrl(url) ? (
                    <div
                      key={`image-${index}`}
                      className="file-item relative group rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
                    >
                      <Image
                        src={url}
                        alt={`Hình ảnh đã tải ${index}`}
                        className="w-full h-24 object-cover"
                        width={96}
                        height={96}
                      />
                      <p className="text-xs text-gray-600 mt-1 text-center truncate">
                        {truncateFileName(url.split("/").pop())}
                      </p>
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                        aria-label={`Xóa hình ảnh ${index}`}
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ) : null
                )}
              </div>
            )}

            {uploadedVideos.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {uploadedVideos.map((url, index) => (
                  <div
                    key={`video-${index}`}
                    className="file-item relative group rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
                  >
                    <video
                      src={url}
                      controls
                      className="w-full h-28 object-cover"
                      aria-label={`Video ${index}`}
                    />
                    <p className="text-xs text-gray-600 mt-1 text-center truncate">
                      {truncateFileName(url.split("/").pop())}
                    </p>
                    <button
                      onClick={() => handleRemoveVideo(index)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                      aria-label={`Xóa video ${index}`}
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-3">
                {uploadedFiles.map((url, index) => (
                  <div
                    key={`file-${index}`}
                    className="file-item flex items-center justify-between bg-teal-50 p-3 rounded-lg shadow-sm hover:bg-teal-100 transition-colors duration-200"
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 text-sm font-medium hover:underline"
                      aria-label={`Tải xuống tệp ${index}`}
                    >
                      {truncateFileName(url.split("/").pop())}
                    </a>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                      aria-label={`Xóa tệp ${index}`}
                    >
                      <FaTimes size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nút hành động */}
          <div className="flex justify-center items-center mt-8 flex-wrap gap-4 text-sm">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-all duration-200"
                aria-label="Xóa"
              >
                <FaTrash /> Xóa
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-all duration-200"
                aria-label="Lưu bản nháp"
              >
                <FaSave /> Lưu bản nháp
              </button>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setLivePreview(!livePreview)}
                className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 transition-all duration-200"
                aria-label={livePreview ? "Ẩn xem trước" : "Xem trước"}
              >
                <FaEye /> {livePreview ? "Ẩn xem trước" : "Xem trước"}
              </button>
              <button
                type="button"
                onClick={handlePublish}
                className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-full hover:bg-teal-600 transition-all duration-200"
                aria-label="Đăng bài"
              >
                <FaPaperPlane /> Đăng bài
              </button>
            </div>
          </div>
        </>
      </div>
    );
  };

  const renderLivePreview = () => (
    <div className="mt-6 w-full p-4">
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
        <h2 className="text-xl font-bold text-teal-600 mb-4">
          {title || "Tiêu đề"}
        </h2>
        <p className="text-gray-600 mb-2">
          Chủ đề: {topic || customTopic || "Chưa chọn"}
        </p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="text-gray-700 prose max-w-none mb-4">
          {content || "Mô tả bài viết..."}
        </div>
        <h3 className="text-base font-bold text-teal-600 mb-4">
          Tệp đa phương tiện
        </h3>
        {uploadedImages.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {uploadedImages.map((url, index) =>
              isValidUrl(url) ? (
                <div
                  key={`image-${index}`}
                  className="file-item relative group rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
                >
                  <Image
                    src={url}
                    alt={`Hình ảnh đã tải ${index}`}
                    className="w-full h-24 object-cover"
                    width={96}
                    height={96}
                  />
                  <p className="text-xs text-gray-600 mt-1 text-center truncate">
                    {truncateFileName(url.split("/").pop())}
                  </p>
                </div>
              ) : null
            )}
          </div>
        )}
        {uploadedVideos.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {uploadedVideos.map((url, index) => (
              <div
                key={`video-${index}`}
                className="file-item relative group rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <video
                  src={url}
                  controls
                  className="w-full h-28 object-cover"
                  aria-label={`Video ${index}`}
                />
                <p className="text-xs text-gray-600 mt-1 text-center truncate">
                  {truncateFileName(url.split("/").pop())}
                </p>
              </div>
            ))}
          </div>
        )}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-3">
            {uploadedFiles.map((url, index) => (
              <div
                key={`file-${index}`}
                className="file-item flex items-center justify-between bg-teal-50 p-3 rounded-lg shadow-sm hover:bg-teal-100 transition-colors duration-200"
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 text-sm font-medium hover:underline"
                  aria-label={`Tải xuống tệp ${index}`}
                >
                  {truncateFileName(url.split("/").pop())}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="mt-24 p-5 rounded-lg shadow-md border border-blue-200 text-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-teal-200 rounded w-1/2"></div>
          <div className="h-48 bg-teal-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mt-24 p-5 rounded-lg shadow-md border border-blue-200 text-gray-700 ${themes[theme]}`}
    >
      <h1
        className={`text-white text-2xl bg-gradient-to-r from-teal-400 to-indigo-400 border-2 border-blue-200 rounded-lg shadow-md font-bold text-center py-5 mb-3`}
      >
        Viết bài
      </h1>

      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-20px);
            opacity: 0;
          }
        }
        .hide-title {
          animation: slideUp 0.3s ease forwards;
        }
        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .file-item {
          background: linear-gradient(145deg, #e6fffa, #ccfbf1);
          border: 1px solid #4fd1c5;
          border-radius: 8px;
          padding: 8px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .file-item:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      `}</style>
      <div className="min-h-screen rounded-lg bg-blue-100 flex flex-col">
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
                  .from(confirmDeleteTable)
                  .delete()
                  .eq("id", confirmDeleteId)
                  .eq(
                    confirmDeleteTable === "demos" ? "name" : "purpose",
                    confirmDeleteTable === "demos" ? name : "draft"
                  );
                if (error) throw error;
                setEntries(
                  entries.filter((entry) => entry.id !== confirmDeleteId)
                );
                setFilteredEntries(
                  filteredEntries.filter(
                    (entry) => entry.id !== confirmDeleteId
                  )
                );
                setNotification({
                  message: "Bản nháp đã được xóa thành công!",
                  type: "success",
                });
              } catch (err) {
                console.error("Lỗi trong delete:", err);
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

        {!isLoggedIn ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] p-8">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
              <h2 className="text-2xl font-bold text-teal-600 mb-4">
                Vui lòng đăng nhập
              </h2>
              <p className="text-gray-600 mb-6">
                Bạn cần đăng nhập để viết bài, xem bản nháp hoặc sử dụng mẫu bài
                viết.
              </p>
              <button
                onClick={handleLoginRedirect}
                className="bg-indigo-500 text-white px-6 py-3 rounded-full hover:bg-indigo-600 transition-all duration-200 hover:scale-105 shadow-lg"
                aria-label="Đăng nhập"
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        ) : (
          <div className={`flex flex-col lg:flex-row gap-6 ${getThemeClasses(
          theme,
          "container"
        )}`}>
            <div className="w-full lg:w-2/3 p-4">
              <div className="mb-4 flex border-b border-teal-200">
                <button
                  onClick={() => {
                    setActiveTab("post");
                    resetForm();
                  }}
                  className={`px-6 py-3 text-lg font-bold transition-all duration-200 ${
                    activeTab === "post"
                      ? "border-b-2 border-teal-500 text-teal-600"
                      : "text-gray-500 hover:text-teal-500"
                  }`}
                  aria-label="Viết bài mới"
                >
                  Viết bài mới
                </button>
                <button
                  onClick={() => {
                    setActiveTab("sample");
                    resetForm();
                  }}
                  className={`px-6 py-3 text-lg font-bold transition-all duration-200 ${
                    activeTab === "sample"
                      ? "border-b-2 border-teal-500 text-teal-600"
                      : "text-gray-500 hover:text-teal-500"
                  }`}
                  aria-label="Mẫu bài viết"
                >
                  Mẫu bài viết
                </button>
              </div>
              <div className="bg-white/90">{renderForm(activeTab)}</div>

              {livePreview && activeTab === "post" && renderLivePreview()}
            </div>

            {showDrafts && (
              <div
                className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                onClick={() => setShowDrafts(false)}
                aria-hidden="true"
              ></div>
            )}
            <div className="lg:w-1/3 mr-4">
              <div
                ref={sidebarRef}
                className={`mt-[86px] fixed lg:static top-0 right-0 h-[calc(100vh-86px)] bg-teal-50 backdrop-blur-lg rounded-2xl p-6 shadow-xl transition-transform duration-300 ${
                  showDrafts ? "translate-x-0" : "translate-x-full"
                } lg:translate-x-0 z-40 flex flex-col`}
                style={{
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <div className="flex-shrink-0">
                  <div
                    className={`flex justify-between items-center mb-6 transition-all duration-300 ${
                      isTitleHidden ? "hide-title h-0 overflow-hidden" : ""
                    }`}
                  >
                    <h2 className="text-xl font-bold text-teal-600 flex items-center">
                      <DiffOutlined className="mr-2 text-teal-500" /> Bản nháp (
                      {filteredEntries.length})
                    </h2>
                    <button
                      onClick={() => setShowDrafts(!showDrafts)}
                      className="lg:hidden text-teal-600 hover:text-teal-700 transition-colors"
                      aria-label="Đóng danh sách bản nháp"
                    >
                      <FaTimes size={24} />
                    </button>
                  </div>
                  <div className="relative mb-4">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Tìm kiếm..."
                      value={searchQuery}
                      onChange={handleSearchDrafts}
                      className="w-full pl-12 p-3 bg-teal-50 border border-teal-200 rounded-full focus:outline-none focus:border-teal-500 text-teal-700 transition-colors duration-200"
                      aria-label="Tìm kiếm bản nháp"
                    />
                  </div>
                </div>
                <div
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto scrollbar-hidden"
                >
                  <ul className="space-y-4 pb-8">
                    {filteredEntries.length > 0 ? (
                      filteredEntries.map((entry) => (
                        <li
                          key={`draft-${entry.table}-${entry.id}`}
                          className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                        >
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12">
                              {Array.isArray(entry.images) &&
                              entry.images.length > 0 &&
                              isValidUrl(entry.images[0]) ? (
                                <Image
                                  src={entry.images[0]}
                                  alt={`Hình ảnh bản nháp ${entry.id}`}
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center text-teal-500 text-xs px-1">
                                  Không có media
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <strong className="text-teal-600 text-sm font-bold">
                                {entry.title || "Không có tiêu đề"}
                              </strong>
                              <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                                {entry.content
                                  ? entry.content.slice(0, 50) + "..."
                                  : "Không có nội dung"}
                              </p>
                              {Array.isArray(entry.tags) &&
                                entry.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {entry.tags
                                      .slice(0, 3)
                                      .map((tag, index) => (
                                        <span
                                          key={`${tag}-${index}`}
                                          className="bg-teal-100 text-teal-700 px-2 py-1 rounded-full text-xs"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                  </div>
                                )}
                              <small className="text-gray-500 text-xs block mt-2">
                                {new Date(entry.created_at).toLocaleString()}
                              </small>
                              <div className="flex justify-end gap-3 mt-3">
                                <button
                                  onClick={() => handleEditDraft(entry)}
                                  className="bg-teal-500 text-white px-4 py-2 rounded-full text-xs hover:bg-teal-600 transition-all duration-200"
                                  aria-label={`Chỉnh sửa bản nháp ${
                                    entry.title || "Không có tiêu đề"
                                  }`}
                                >
                                  Chỉnh sửa
                                </button>
                                <button
                                  onClick={() => {
                                    setConfirmDeleteId(entry.id);
                                    setConfirmDeleteTable(entry.table);
                                    setShowConfirm(true);
                                  }}
                                  className="bg-red-500 text-white px-4 py-2 rounded-full text-xs hover:bg-red-600 transition-all duration-200"
                                  aria-label={`Xóa bản nháp ${
                                    entry.title || "Không có tiêu đề"
                                  }`}
                                >
                                  Xóa
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm text-center pt-4">
                        Không tìm thấy bản nháp nào.
                      </p>
                    )}
                  </ul>
                </div>
              </div>

              <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
              <ScrollToTop />
            </div>

            {isLoggedIn && !showDrafts && (
              <button
                onClick={() => setShowDrafts(true)}
                className="fixed bottom-8 right-8 bg-teal-500 text-white p-4 rounded-full z-50 lg:hidden shadow-lg hover:bg-teal-600 transition-all duration-200 hover:scale-110"
                aria-label="Mở danh sách bản nháp"
              >
                <DiffOutlined className="text-xl" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
