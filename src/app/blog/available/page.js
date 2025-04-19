"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { FaTimes, FaPaperPlane, FaSave, FaTrash, FaEye } from "react-icons/fa";
import { FileImageOutlined, FileTextOutlined } from "@ant-design/icons";
import { supabase } from "../../../lib/supabase";
import Notification from "../../../utils/notification";
import Confirm from "../../../utils/error";

const purposes = [
  "Đặt câu hỏi",
  "Tạo cuộc bình chọn",
  "Câu đố",
  "Truyện tranh",
  "Hành trình",
];
const MAX_IMAGES = 5;

export default function CreatePost() {
  const router = useRouter();
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    topics: "",
    customTopic: "",
    tags: [],
    selectedTag: "",
    customTag: "",
    questions: [{ question: "", options: ["", ""], multipleChoice: false }],
    poll: { title: "", options: ["", ""], multipleChoice: false },
    quizzes: [{ question: "", answer: "" }],
    storyType: "Truyện chữ",
    storyDescription: "",
    storyDoc: null,
    timeline: {
      title: "",
      milestones: [
        {
          time: new Date().toISOString().split("T")[0],
          description: "",
          status: "Hoàn thành",
        },
      ],
    },
    images: [],
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [topicError, setTopicError] = useState("");
  const [tagError, setTagError] = useState("");
  const [imageError, setImageError] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [topicsList, setTopicsList] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [livePreview, setLivePreview] = useState(false);
  const [progress, setProgress] = useState(0);

  // Calculate progress based on filled required fields
  useEffect(() => {
    const calculateProgress = () => {
      let totalFields = 0;
      let filledFields = 0;

      totalFields += 2;
      if (formData.topics || formData.customTopic) filledFields++;
      if (formData.tags.length > 0) filledFields++;

      if (selectedPurpose === "Đặt câu hỏi") {
        formData.questions.forEach((q) => {
          totalFields += 3;
          if (q.question) filledFields++;
          if (q.options[0]) filledFields++;
          if (q.options[1]) filledFields++;
        });
      } else if (selectedPurpose === "Tạo cuộc bình chọn") {
        totalFields += 3;
        if (formData.poll.title) filledFields++;
        if (formData.poll.options[0]) filledFields++;
        if (formData.poll.options[1]) filledFields++;
      } else if (selectedPurpose === "Câu đố") {
        formData.quizzes.forEach((q) => {
          totalFields += 2;
          if (q.question) filledFields++;
          if (q.answer) filledFields++;
        });
      } else if (selectedPurpose === "Truyện tranh") {
        totalFields += 2;
        if (formData.storyDescription) filledFields++;
        if (formData.storyType === "Truyện chữ" && formData.storyDoc)
          filledFields++;
        if (formData.storyType === "Truyện tranh" && formData.images.length > 0)
          filledFields++;
      } else if (selectedPurpose === "Hành trình") {
        totalFields += 1;
        if (formData.timeline.title) filledFields++;
        formData.timeline.milestones.forEach((m) => {
          totalFields += 2;
          if (m.time) filledFields++;
          if (m.description) filledFields++;
        });
      }

      const percentage =
        totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
      setProgress(Math.round(percentage));
    };

    calculateProgress();
  }, [formData, selectedPurpose]);

  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        setLoading(true);
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const loggedIn = !!(userData && (userData.name || userData.email));
        setIsLoggedIn(loggedIn);
        setShowLoginModal(!loggedIn);
        if (loggedIn) {
          fetchTopics();
          fetchTags();
        }
      } catch (err) {
        addNotification(`Lỗi khi kiểm tra đăng nhập: ${err.message}`, "error");
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();

    const handleStorageChange = (event) => {
      if (event.key === "user" || event.key === null) {
        checkLoginStatus();
      }
    };

    const handleLogoutEvent = () => {
      setIsLoggedIn(false);
      resetForm();
      addNotification("Bạn đã đăng xuất. Vui lòng đăng nhập lại.", "info");
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("user-logout", handleLogoutEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-logout", handleLogoutEvent);
    };
  }, []);

  useEffect(() => {
    const keywords = [
      ...formData.questions.flatMap((q) =>
        q.question.toLowerCase().split(/\W+/)
      ),
      ...(formData.poll.title.toLowerCase().split(/\W+/) || []),
      ...formData.quizzes.flatMap((q) => q.question.toLowerCase().split(/\W+/)),
      ...(formData.timeline.title.toLowerCase().split(/\W+/) || []),
      ...formData.timeline.milestones.flatMap((m) =>
        m.description.toLowerCase().split(/\W+/)
      ),
      ...(formData.storyDescription.toLowerCase().split(/\W+/) || []),
    ].filter((word) => word.length > 3);
    const suggestions = tagsList
      .filter((tag) =>
        keywords.some((keyword) => tag.value.toLowerCase().includes(keyword))
      )
      .slice(0, 5);
    setTagSuggestions(suggestions);
  }, [
    formData.questions,
    formData.poll,
    formData.quizzes,
    formData.timeline,
    formData.storyDescription,
    tagsList,
  ]);

  const addNotification = (message, type) => {
    setNotifications((prev) => [...prev, { id: Date.now(), message, type }]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("topics")
        .not("topics", "is", null);
      if (error) throw error;
      const allTopics = [
        ...new Set(data.map((item) => capitalizeFirstLetter(item.topics))),
      ];
      setTopicsList([
        ...allTopics.map((topic) => ({ value: topic, label: topic })),
        { value: "Khác", label: "Khác" },
      ]);
    } catch (err) {
      addNotification(
        `Không thể tải danh sách chủ đề: ${err.message}`,
        "error"
      );
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("tags")
        .not("tags", "is", null);
      if (error) throw error;
      const allTags = [
        ...new Set(
          data.flatMap((item) =>
            item.tags
              ? typeof item.tags === "string"
                ? item.tags.split(",").map((tag) => tag.trim())
                : Array.isArray(item.tags)
                ? item.tags
                : []
              : []
          )
        ),
      ].map((tag) => capitalizeFirstLetter(tag));
      setTagsList([
        ...new Set(allTags.map((tag) => ({ value: tag, label: tag }))),
        { value: "Khác", label: "Khác" },
      ]);
    } catch (err) {
      addNotification(`Không thể tải danh sách tags: ${err.message}`, "error");
    }
  };

  const handlePurposeChange = (e) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    const newPurpose = e.target.value;
    setSelectedPurpose(newPurpose);
    setShowForm(!!newPurpose);
    setFormData((prev) => ({
      ...prev,
      questions:
        newPurpose === "Đặt câu hỏi"
          ? [{ question: "", options: ["", ""], multipleChoice: false }]
          : [],
      poll:
        newPurpose === "Tạo cuộc bình chọn"
          ? { title: "", options: ["", ""], multipleChoice: false }
          : { title: "", options: ["", ""], multipleChoice: false },
      quizzes: newPurpose === "Câu đố" ? [{ question: "", answer: "" }] : [],
      storyType: newPurpose === "Truyện tranh" ? "Truyện chữ" : "",
      storyDescription: newPurpose === "Truyện tranh" ? "" : "",
      storyDoc: newPurpose === "Truyện tranh" ? null : null,
      timeline:
        newPurpose === "Hành trình"
          ? {
              title: "",
              milestones: [
                {
                  time: new Date().toISOString().split("T")[0],
                  description: "",
                  status: "Hoàn thành",
                },
              ],
            }
          : {
              title: "",
              milestones: [
                {
                  time: new Date().toISOString().split("T")[0],
                  description: "",
                  status: "Hoàn thành",
                },
              ],
            },
      images:
        newPurpose === "Truyện tranh" ||
        newPurpose === "Đặt câu hỏi" ||
        newPurpose === "Tạo cuộc bình chọn" ||
        newPurpose === "Câu đố" ||
        newPurpose === "Hành trình"
          ? prev.images
          : [],
    }));
  };

  const handleCreateForm = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    if (!selectedPurpose) {
      addNotification("Vui lòng chọn mục đích trước!", "warning");
      return;
    }
    setShowForm(true);
  };

  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    router.push("/login");
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name.startsWith("question-title")) {
      const index = parseInt(name.split("-")[2], 10);
      const newQuestions = [...formData.questions];
      newQuestions[index].question = value;
      setFormData((prev) => ({ ...prev, questions: newQuestions }));
    } else if (name.startsWith("option")) {
      const [_, questionIndex, optionIndex] = name
        .split("-")
        .map((part, idx) => (idx > 0 ? parseInt(part, 10) : part));
      const newQuestions = [...formData.questions];
      newQuestions[questionIndex].options[optionIndex] = value;
      setFormData((prev) => ({ ...prev, questions: newQuestions }));
    } else if (name.startsWith("multipleChoice")) {
      const index = parseInt(name.split("-")[1], 10);
      const newQuestions = [...formData.questions];
      newQuestions[index].multipleChoice = checked;
      setFormData((prev) => ({ ...prev, questions: newQuestions }));
    } else if (name === "poll-title") {
      setFormData((prev) => ({
        ...prev,
        poll: { ...prev.poll, title: value },
      }));
    } else if (name.startsWith("poll-option")) {
      const index = parseInt(name.split("-")[2], 10);
      const newOptions = [...formData.poll.options];
      newOptions[index] = value;
      setFormData((prev) => ({
        ...prev,
        poll: { ...prev.poll, options: newOptions },
      }));
    } else if (name === "poll-multipleChoice") {
      setFormData((prev) => ({
        ...prev,
        poll: { ...prev.poll, multipleChoice: checked },
      }));
    } else if (name.startsWith("quiz-question")) {
      const index = parseInt(name.split("-")[2], 10);
      const newQuizzes = [...formData.quizzes];
      newQuizzes[index].question = value;
      setFormData((prev) => ({ ...prev, quizzes: newQuizzes }));
    } else if (name.startsWith("quiz-answer")) {
      const index = parseInt(name.split("-")[2], 10);
      const newQuizzes = [...formData.quizzes];
      newQuizzes[index].answer = value;
      setFormData((prev) => ({ ...prev, quizzes: newQuizzes }));
    } else if (name.startsWith("timeline-title")) {
      setFormData((prev) => ({
        ...prev,
        timeline: { ...prev.timeline, title: value },
      }));
    } else if (name.startsWith("milestone-time")) {
      const index = parseInt(name.split("-")[2], 10);
      const newMilestones = [...formData.timeline.milestones];
      newMilestones[index].time = value;
      setFormData((prev) => ({
        ...prev,
        timeline: { ...prev.timeline, milestones: newMilestones },
      }));
    } else if (name.startsWith("milestone-description")) {
      const index = parseInt(name.split("-")[2], 10);
      const newMilestones = [...formData.timeline.milestones];
      newMilestones[index].description = value;
      setFormData((prev) => ({
        ...prev,
        timeline: { ...prev.timeline, milestones: newMilestones },
      }));
    } else if (name.startsWith("milestone-status")) {
      const index = parseInt(name.split("-")[2], 10);
      const newMilestones = [...formData.timeline.milestones];
      newMilestones[index].status = value;
      setFormData((prev) => ({
        ...prev,
        timeline: { ...prev.timeline, milestones: newMilestones },
      }));
    } else if (name === "storyDoc") {
      setFormData((prev) => ({ ...prev, storyDoc: files[0] }));
    } else if (name === "selectedTag") {
      setFormData((prev) => ({ ...prev, selectedTag: value }));
      if (value && value !== "Khác") handleAddTag(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddTag = (tagValue) => {
    const finalTag = tagValue === "Khác" ? formData.customTag : tagValue;
    if (finalTag && !formData.tags.includes(finalTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, capitalizeFirstLetter(finalTag)],
        customTag: "",
        selectedTag: "",
      }));
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { question: "", options: ["", ""], multipleChoice: false },
      ],
    }));
  };

  const removeQuestion = (index) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const addOption = (questionIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options.push("");
    setFormData((prev) => ({ ...prev, questions: newQuestions }));
  };

  const removeOption = (questionIndex, optionIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options = newQuestions[
      questionIndex
    ].options.filter((_, i) => i !== optionIndex);
    setFormData((prev) => ({ ...prev, questions: newQuestions }));
  };

  const addPollOption = () => {
    setFormData((prev) => ({
      ...prev,
      poll: { ...prev.poll, options: [...prev.poll.options, ""] },
    }));
  };

  const removePollOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      poll: {
        ...prev.poll,
        options: prev.poll.options.filter((_, i) => i !== index),
      },
    }));
  };

  const addQuiz = () => {
    setFormData((prev) => ({
      ...prev,
      quizzes: [...prev.quizzes, { question: "", answer: "" }],
    }));
  };

  const removeQuiz = (index) => {
    setFormData((prev) => ({
      ...prev,
      quizzes: prev.quizzes.filter((_, i) => i !== index),
    }));
  };

  const addMilestone = () => {
    setFormData((prev) => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        milestones: [
          ...prev.timeline.milestones,
          {
            time: new Date().toISOString().split("T")[0],
            description: "",
            status: "Hoàn thành",
          },
        ],
      },
    }));
  };

  const removeMilestone = (index) => {
    setFormData((prev) => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        milestones: prev.timeline.milestones.filter((_, i) => i !== index),
      },
    }));
  };

  const handleImageUpload = async (e) => {
    if (!isLoggedIn) return;
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > MAX_IMAGES) {
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
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
      setImageError("");
    } catch (err) {
      setImageError(err.message || "Không thể tải lên hình ảnh.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDocUpload = async (e) => {
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
      addNotification("Vui lòng chỉ tải lên tệp Word hoặc PDF.", "warning");
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
      setFormData((prev) => ({ ...prev, storyDoc: uploadedFileUrls[0] }));
    } catch (err) {
      addNotification(err.message || "Không thể tải lên tệp.", "error");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveDoc = () => {
    setFormData((prev) => ({ ...prev, storyDoc: null }));
  };

  const truncateFileName = (name, maxLength = 15) => {
    if (!name) return "unnamed";
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + "...";
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateInputs = () => {
    let hasError = false;
    setTopicError("");
    setTagError("");

    if (
      !formData.topics ||
      (formData.topics === "Khác" && !formData.customTopic)
    ) {
      setTopicError("Vui lòng chọn hoặc nhập chủ đề.");
      hasError = true;
    }
    if (formData.tags.length === 0) {
      setTagError("Vui lòng chọn ít nhất một tag.");
      hasError = true;
    }
    if (
      selectedPurpose === "Đặt câu hỏi" &&
      formData.questions.some(
        (q) =>
          !q.question || q.options.some((opt) => !opt) || q.options.length < 2
      )
    ) {
      addNotification(
        "Vui lòng điền đầy đủ câu hỏi và ít nhất 2 lựa chọn đáp án!",
        "error"
      );
      hasError = true;
    }
    if (
      selectedPurpose === "Tạo cuộc bình chọn" &&
      (!formData.poll.title ||
        formData.poll.options.some((opt) => !opt) ||
        formData.poll.options.length < 2)
    ) {
      addNotification(
        "Vui lòng điền tiêu đề và ít nhất 2 lựa chọn cho cuộc bình chọn!",
        "error"
      );
      hasError = true;
    }
    if (
      selectedPurpose === "Câu đố" &&
      formData.quizzes.some((q) => !q.question || !q.answer)
    ) {
      addNotification(
        "Vui lòng điền đầy đủ câu hỏi và đáp án cho tất cả câu đố!",
        "error"
      );
      hasError = true;
    }
    if (
      selectedPurpose === "Truyện tranh" &&
      formData.storyType === "Truyện chữ" &&
      (!formData.storyDescription || !formData.storyDoc)
    ) {
      addNotification(
        "Vui lòng nhập mô tả và tải lên file Word/PDF cho truyện chữ!",
        "error"
      );
      hasError = true;
    }
    if (
      selectedPurpose === "Truyện tranh" &&
      formData.storyType === "Truyện tranh" &&
      (!formData.storyDescription || formData.images.length === 0)
    ) {
      addNotification(
        "Vui lòng nhập mô tả và tải lên ít nhất một ảnh cho truyện tranh!",
        "error"
      );
      hasError = true;
    }
    if (
      selectedPurpose === "Hành trình" &&
      (!formData.timeline.title ||
        formData.timeline.milestones.some((m) => !m.time || !m.description))
    ) {
      addNotification(
        "Vui lòng điền tiêu đề và đầy đủ các mốc thời gian với mô tả!",
        "error"
      );
      hasError = true;
    }
    if (!isLoggedIn) {
      addNotification(
        "Vui lòng đăng nhập để thực hiện hành động này.",
        "error"
      );
      hasError = true;
    }
    return hasError;
  };

  const handleSaveDraft = async () => {
    if (!isLoggedIn) return;
    if (validateInputs()) return;

    setConfirmAction(() => async () => {
      try {
        const finalTopic = capitalizeFirstLetter(
          formData.topics === "Khác" ? formData.customTopic : formData.topics
        );
        const draftData = {
          topics: finalTopic,
          tags: formData.tags.join(","),
          purpose: selectedPurpose,
          questions:
            selectedPurpose === "Đặt câu hỏi" ? formData.questions : [],
          poll: selectedPurpose === "Tạo cuộc bình chọn" ? formData.poll : null,
          quizzes: selectedPurpose === "Câu đố" ? formData.quizzes : [],
          storyType:
            selectedPurpose === "Truyện tranh" ? formData.storyType : "",
          storyDescription:
            selectedPurpose === "Truyện tranh" ? formData.storyDescription : "",
          storyDoc: formData.storyDoc ? formData.storyDoc.url : null,
          timeline: selectedPurpose === "Hành trình" ? formData.timeline : null,
          images: formData.images.length > 0 ? formData.images[0].url : null,
          name:
            JSON.parse(localStorage.getItem("user")).name ||
            JSON.parse(localStorage.getItem("user")).email,
        };

        const { data, error } = await supabase
          .from("demos")
          .insert([draftData])
          .select()
          .single();
        if (error) throw error;

        addNotification("Bản nháp đã được lưu thành công!", "success");
        resetForm();
        await fetchTopics();
        await fetchTags();
      } catch (error) {
        addNotification(`Không thể lưu bản nháp: ${error.message}`, "error");
      }
    });
    setShowConfirm(true);
  };

  const handlePublishPost = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) return;
    if (validateInputs()) return;

    setConfirmAction(() => async () => {
      try {
        const finalTopic = capitalizeFirstLetter(
          formData.topics === "Khác" ? formData.customTopic : formData.topics
        );
        const newPost = {
          topics: finalTopic,
          tags: formData.tags.join(","),
          purpose: selectedPurpose,
          questions:
            selectedPurpose === "Đặt câu hỏi" ? formData.questions : [],
          poll: selectedPurpose === "Tạo cuộc bình chọn" ? formData.poll : null,
          quizzes: selectedPurpose === "Câu đố" ? formData.quizzes : [],
          storyType:
            selectedPurpose === "Truyện tranh" ? formData.storyType : "",
          storyDescription:
            selectedPurpose === "Truyện tranh" ? formData.storyDescription : "",
          storyDoc: formData.storyDoc ? formData.storyDoc.url : null,
          timeline: selectedPurpose === "Hành trình" ? formData.timeline : null,
          images: formData.images.length > 0 ? formData.images[0].url : null,
          name:
            JSON.parse(localStorage.getItem("user")).name ||
            JSON.parse(localStorage.getItem("user")).email,
        };

        const { data, error } = await supabase
          .from("posts")
          .insert([newPost])
          .select()
          .single();
        if (error) throw error;

        addNotification("Bài viết đã được đăng thành công!", "success");
        resetForm();
        await fetchTopics();
        await fetchTags();
        router.push("/blog/post");
      } catch (err) {
        addNotification(`Không thể đăng bài viết: ${err.message}`, "error");
      }
    });
    setShowConfirm(true);
  };

  const resetForm = () => {
    setFormData({
      topics: "",
      customTopic: "",
      tags: [],
      selectedTag: "",
      customTag: "",
      questions: [{ question: "", options: ["", ""], multipleChoice: false }],
      poll: { title: "", options: ["", ""], multipleChoice: false },
      quizzes: [{ question: "", answer: "" }],
      storyType: "Truyện chữ",
      storyDescription: "",
      storyDoc: null,
      timeline: {
        title: "",
        milestones: [
          {
            time: new Date().toISOString().split("T")[0],
            description: "",
            status: "Hoàn thành",
          },
        ],
      },
      images: [],
    });
    setTopicError("");
    setTagError("");
    setImageError("");
    setIsUploadingImage(false);
    setIsUploadingFile(false);
    setLivePreview(false);
    setProgress(0);
    setNotifications([]);
  };

  const handleResetForm = () => {
    setConfirmAction(() => async () => {
      resetForm();
      addNotification("Dữ liệu trong form đã được xóa!", "success");
      setShowConfirm(false);
    });
    setShowConfirm(true);
  };

  if (loading) {
    return (
      <div className="text-center p-5 rounded-lg bg-white min-h-screen">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="p-5 rounded-lg shadow-md text-gray-700 flex flex-col min-h-screen px-8 text-sm pt-8">
      {notifications.map((notif) => (
        <Notification
          key={notif.id}
          message={notif.message}
          type={notif.type}
          onClose={() => removeNotification(notif.id)}
        />
      ))}

      {showConfirm && (
        <Confirm
          message="Bạn có chắc muốn xóa toàn bộ dữ liệu trong form?"
          onConfirm={() => {
            confirmAction();
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {showLoginModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold text-teal-600 mb-4">
              Vui lòng đăng nhập
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn cần đăng nhập để tạo bài viết. Hãy đăng nhập ngay!
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowLoginModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-all duration-200"
              >
                Hủy
              </button>
              <button
                onClick={handleLoginRedirect}
                className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-all duration-200"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-teal-500 to-indigo-500 p-4 rounded-lg">
        <h1 className="text-2xl font-bold text-white">Mẫu bài viết</h1>
        <div className="relative w-12 h-12">
          <svg width="48" height="48" viewBox="0 0 48 48" className="absolute">
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
              strokeDashoffset={138 - (progress / 100) * 138}
              className="transform -rotate-90 origin-center transition-stroke-dashoffset duration-500"
            />
          </svg>
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-semibold text-green-500">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <div className="mb-8 flex flex-col md:flex-row items-center justify-center gap-6">
        <div className="w-full md:w-1/3">
          <select
            value={selectedPurpose}
            onChange={handlePurposeChange}
            className="h-10 p-2 rounded-lg w-full border-2 border-teal-300 bg-white shadow-sm hover:bg-teal-100 focus:bg-teal-200 focus:outline-none transition-all duration-300"
            aria-label="Chọn mục đích bài viết"
          >
            <option value="">-- Chọn mục đích --</option>
            {purposes.map((purpose) => (
              <option key={purpose} value={purpose}>
                {purpose}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showForm && selectedPurpose && (
          <form onSubmit={handlePublishPost}>
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="flex-1 relative">
                <select
                  name="topics"
                  value={formData.topics}
                  onChange={handleFormChange}
                  className="peer w-full p-4 pt-6 bg-transparent border-b-2 border-teal-300 text-teal-700 focus:outline-none focus:border-teal-500 rounded-md appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%2314b8a6%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.5em]"
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
                  htmlFor="topics"
                  className="absolute left-4 top-4 text-teal-400 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm peer-focus:text-teal-500 peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:text-sm"
                >
                  Chủ đề bài viết
                </label>
                {formData.topics === "Khác" && (
                  <input
                    type="text"
                    name="customTopic"
                    value={formData.customTopic}
                    onChange={handleFormChange}
                    className="w-full p-4 mt-4 bg-transparent border-b-2 border-teal-300 text-teal-700 focus:outline-none focus:border-teal-500 rounded-md"
                    placeholder="Nhập chủ đề tùy chỉnh"
                  />
                )}
                {topicError && (
                  <p className="text-red-500 text-sm mt-2 animate-pulse">
                    {topicError}
                  </p>
                )}
              </div>

              <div className="flex-1">
                <div className="relative">
                  <select
                    name="selectedTag"
                    value={formData.selectedTag}
                    onChange={handleFormChange}
                    className="peer w-full p-4 pt-6 bg-transparent border-b-2 border-teal-300 text-teal-700 focus:outline-none focus:border-teal-500 rounded-md appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%2314b8a6%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.5em]"
                  >
                    <option value="" disabled className="text-gray-400">
                      Chọn tag
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
                    htmlFor="selectedTag"
                    className="absolute left-4 top-4 text-teal-400 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm peer-focus:text-teal-500 peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:text-sm"
                  >
                    Thẻ tag
                  </label>
                </div>
                {formData.selectedTag === "Khác" && (
                  <input
                    type="text"
                    name="customTag"
                    value={formData.customTag}
                    onChange={handleFormChange}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && formData.customTag)
                        handleAddTag("Khác");
                    }}
                    className="w-full p-4 mt-4 bg-transparent border-b-2 border-teal-300 text-teal-700 focus:outline-none focus:border-teal-500 rounded-md"
                    placeholder="Nhập tag tùy chỉnh"
                  />
                )}
                {tagSuggestions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {tagSuggestions.map((tag) => (
                      <button
                        key={tag.value}
                        type="button"
                        onClick={() => handleAddTag(tag.value)}
                        className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm hover:bg-teal-200 transition-colors duration-200"
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                )}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="bg-teal-500 text-white px-4 py-2 rounded-full flex items-center text-sm transition-transform duration-200 hover:scale-105"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-white hover:text-red-300 transition-colors"
                        >
                          <FaTimes size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {tagError && (
                  <p className="text-red-500 text-sm mt-2 animate-pulse">
                    {tagError}
                  </p>
                )}
              </div>
            </div>

            {selectedPurpose === "Đặt câu hỏi" && (
              <>
                <div className="mb-8">
                  <label className="block text-teal-600 mb-2 font-semibold">
                    Danh sách câu hỏi:
                  </label>
                  {formData.questions.map((q, questionIndex) => (
                    <div
                      key={`form-question-${questionIndex}`}
                      className="mb-6 p-4 rounded-lg bg-teal-50 shadow-sm"
                    >
                      <div className="mb-3">
                        <label className="block text-teal-700 font-medium">
                          Câu hỏi {questionIndex + 1}:
                        </label>
                        <input
                          type="text"
                          name={`question-title-${questionIndex}`}
                          value={q.question}
                          onChange={handleFormChange}
                          className="h-8 p-2 rounded-lg w-full border-2 border-teal-300 hover:border-teal-500 focus:border-teal-500 focus:outline-none transition-all duration-300"
                          placeholder="Nhập câu hỏi"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-teal-700 font-medium">
                          Đáp án:
                        </label>
                        {q.options.map((option, optionIndex) => (
                          <div
                            key={`option-${questionIndex}-${optionIndex}`}
                            className="flex items-center gap-2 mb-2"
                          >
                            <span className="text-teal-700">
                              {optionIndex + 1}.
                            </span>
                            <input
                              type="text"
                              name={`option-${questionIndex}-${optionIndex}`}
                              value={option}
                              onChange={handleFormChange}
                              className="h-8 p-2 rounded-lg w-full border-2 border-teal-300 hover:border-teal-500 focus:border-teal-500 focus:outline-none transition-all duration-300"
                              placeholder={`Đáp án ${optionIndex + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                removeOption(questionIndex, optionIndex)
                              }
                              className="text-red-500 hover:text-red-700"
                            >
                              Xóa
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOption(questionIndex)}
                          className="text-teal-500 hover:text-teal-700 mt-2"
                        >
                          + Thêm đáp án
                        </button>
                      </div>
                      <div className="mb-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name={`multipleChoice-${questionIndex}`}
                            checked={q.multipleChoice}
                            onChange={handleFormChange}
                            className="mr-2"
                          />
                          <span className="text-teal-700">
                            Cho phép chọn nhiều đáp án
                          </span>
                        </label>
                      </div>
                      {formData.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(questionIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Xóa câu hỏi
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="text-teal-500 hover:text-teal-700"
                  >
                    + Thêm câu hỏi
                  </button>
                </div>
                <div className="mb-8">
                  <label className="block text-teal-600 mb-2 font-semibold">
                    Tải lên ảnh:
                  </label>
                  <label className="bg-teal-500 text-white px-6 py-3 rounded-full flex items-center cursor-pointer hover:bg-teal-600 transition-all duration-200 hover:scale-105 shadow-md">
                    <FileImageOutlined className="mr-2" /> Ảnh
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {imageError && (
                    <p className="text-red-500 text-sm mt-4 animate-pulse">
                      {imageError}
                    </p>
                  )}
                  {isUploadingImage && (
                    <div className="mt-4 flex items-center">
                      <div className="w-6 h-6 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin mr-3"></div>
                      <span className="text-teal-600">
                        Đang tải hình ảnh...
                      </span>
                    </div>
                  )}
                  {formData.images.length > 0 && !isUploadingImage && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {formData.images.map((image, index) =>
                        image.url && isValidUrl(image.url) ? (
                          <div
                            key={`image-${index}`}
                            className="relative group rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
                          >
                            <Image
                              src={image.url}
                              alt={`Uploaded ${image.name}`}
                              className="w-full h-24 object-cover"
                              width={96}
                              height={96}
                            />
                            <p className="text-xs text-gray-600 mt-1 text-center truncate">
                              {truncateFileName(image.name)}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {selectedPurpose === "Tạo cuộc bình chọn" && (
              <>
                <div className="mb-8">
                  <label className="block text-teal-600 mb-2 font-semibold">
                    Tiêu đề cuộc bình chọn:
                  </label>
                  <input
                    type="text"
                    name="poll-title"
                    value={formData.poll.title}
                    onChange={handleFormChange}
                    className="h-8 p-2 rounded-lg w-full border-2 border-teal-300 hover:border-teal-500 focus:border-teal-500 focus:outline-none transition-all duration-300"
                    placeholder="Nhập tiêu đề cuộc bình chọn"
                  />
                </div>
                <div className="mb-8">
                  <label className="block text-teal-600 mb-2 font-semibold">
                    Lựa chọn:
                  </label>
                  {formData.poll.options.map((option, optionIndex) => (
                    <div
                      key={`poll-option-${optionIndex}`}
                      className="flex items-center gap-2 mb-2"
                    >
                      <span className="text-teal-700">{optionIndex + 1}.</span>
                      <input
                        type="text"
                        name={`poll-option-${optionIndex}`}
                        value={option}
                        onChange={handleFormChange}
                        className="h-8 p-2 rounded-lg w-full border-2 border-teal-300 hover:border-teal-500 focus:border-teal-500 focus:outline-none transition-all duration-300"
                        placeholder={`Lựa chọn ${optionIndex + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removePollOption(optionIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPollOption}
                    className="text-teal-500 hover:text-teal-700 mt-2"
                  >
                    + Thêm lựa chọn
                  </button>
                </div>
                <div className="mb-8">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="poll-multipleChoice"
                      checked={formData.poll.multipleChoice}
                      onChange={handleFormChange}
                      className="mr-2"
                    />
                    <span className="text-teal-700">
                      Cho phép chọn nhiều đáp án
                    </span>
                  </label>
                </div>
                <div className="mb-8">
                  <label className="block text-teal-600 mb-2 font-semibold">
                    Tải lên ảnh:
                  </label>
                  <label className="bg-teal-500 text-white px-6 py-3 rounded-full flex items-center cursor-pointer hover:bg-teal-600 transition-all duration-200 hover:scale-105 shadow-md">
                    <FileImageOutlined className="mr-2" /> Ảnh
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {imageError && (
                    <p className="text-red-500 text-sm mt-4 animate-pulse">
                      {imageError}
                    </p>
                  )}
                  {isUploadingImage && (
                    <div className="mt-4 flex items-center">
                      <div className="w-6 h-6 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin mr-3"></div>
                      <span className="text-teal-600">
                        Đang tải hình ảnh...
                      </span>
                    </div>
                  )}
                  {formData.images.length > 0 && !isUploadingImage && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {formData.images.map((image, index) =>
                        image.url && isValidUrl(image.url) ? (
                          <div
                            key={`image-${index}`}
                            className="relative group rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
                          >
                            <Image
                              src={image.url}
                              alt={`Uploaded ${image.name}`}
                              className="w-full h-24 object-cover"
                              width={96}
                              height={96}
                            />
                            <p className="text-xs text-gray-600 mt-1 text-center truncate">
                              {truncateFileName(image.name)}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {selectedPurpose === "Câu đố" && (
              <>
                <div className="mb-8">
                  <label className="block text-teal-600 mb-2 font-semibold">
                    Danh sách câu đố:
                  </label>
                  {formData.quizzes.map((quiz, quizIndex) => (
                    <div
                      key={`form-quiz-${quizIndex}`}
                      className="mb-6 p-4 rounded-lg bg-teal-50 shadow-sm"
                    >
                      <div className="mb-3">
                        <label className="block text-teal-700 font-medium">
                          Câu hỏi {quizIndex + 1}:
                        </label>
                        <input
                          type="text"
                          name={`quiz-question-${quizIndex}`}
                          value={quiz.question}
                          onChange={handleFormChange}
                          className="h-8 p-2 rounded-lg w-full border-2 border-teal-300 hover:border-teal-500 focus:border-teal-500 focus:outline-none transition-all duration-300"
                          placeholder="Nhập câu hỏi"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-teal-700 font-medium">
                          Đáp án:
                        </label>
                        <input
                          type="text"
                          name={`quiz-answer-${quizIndex}`}
                          value={quiz.answer}
                          onChange={handleFormChange}
                          className="h-8 p-2 rounded-lg w-full border-2 border-teal-300 hover:border-teal-500 focus:border-teal-500 focus:outline-none transition-all duration-300"
                          placeholder="Nhập đáp án"
                        />
                      </div>
                      {formData.quizzes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuiz(quizIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Xóa câu đố
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addQuiz}
                    className="text-teal-500 hover:text-teal-700"
                  >
                    + Thêm câu đố
                  </button>
                </div>
                <div className="mb-8">
                  <label className="block text-teal-600 mb-2 font-semibold">
                    Tải lên ảnh:
                  </label>
                  <label className="bg-teal-500 text-white px-6 py-3 rounded-full flex items-center cursor-pointer hover:bg-teal-600 transition-all duration-200 hover:scale-105 shadow-md">
                    <FileImageOutlined className="mr-2" /> Ảnh
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {imageError && (
                    <p className="text-red-500 text-sm mt-4 animate-pulse">
                      {imageError}
                    </p>
                  )}
                  {isUploadingImage && (
                    <div className="mt-4 flex items-center">
                      <div className="w-6 h-6 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin mr-3"></div>
                      <span className="text-teal-600">
                        Đang tải hình ảnh...
                      </span>
                    </div>
                  )}
                  {formData.images.length > 0 && !isUploadingImage && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {formData.images.map((image, index) =>
                        image.url && isValidUrl(image.url) ? (
                          <div
                            key={`image-${index}`}
                            className="relative group rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
                          >
                            <Image
                              src={image.url}
                              alt={`Uploaded ${image.name}`}
                              className="w-full h-24 object-cover"
                              width={96}
                              height={96}
                            />
                            <p className="text-xs text-gray-600 mt-1 text-center truncate">
                              {truncateFileName(image.name)}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {selectedPurpose === "Truyện tranh" && (
              <>
                <div className="mb-8">
                  <label className="block text-teal-600 mb-2 font-semibold">
                    Loại truyện:
                  </label>
                  <select
                    name="storyType"
                    value={formData.storyType}
                    onChange={handleFormChange}
                    className="h-9 p-2 rounded-lg w-full md:w-1/2 border-2 border-teal-300 hover:border-teal-500 focus:border-teal-500 focus:outline-none transition-all duration-300"
                  >
                    <option value="Truyện chữ">Truyện chữ</option>
                    <option value="Truyện tranh">Truyện tranh</option>
                  </select>
                </div>
                {formData.storyType === "Truyện chữ" && (
                  <>
                    <div className="mb-8">
                      <label className="block text-teal-600 mb-2 font-semibold">
                        Mô tả truyện:
                      </label>
                      <textarea
                        name="storyDescription"
                        value={formData.storyDescription}
                        onChange={handleFormChange}
                        className="h-20 p-2 rounded-lg w-full border-2 border-teal-300 hover:border-teal-500 focus:border-teal-500 focus:outline-none transition-all duration-300"
                        rows="6"
                        placeholder="Nhập mô tả truyện chữ"
                      />
                    </div>
                    <div className="mb-8">
                      <label className="block text-teal-600 mb-2 font-semibold">
                        Tải lên file Word/PDF truyện chữ:
                      </label>
                      <label className="bg-indigo-500 text-white px-6 py-3 rounded-full flex items-center cursor-pointer hover:bg-indigo-600 transition-all duration-200 hover:scale-105 shadow-md">
                        <FileTextOutlined className="mr-2" /> Word/PDF
                        <input
                          type="file"
                          name="storyDoc"
                          accept=".doc,.docx,.pdf"
                          onChange={handleDocUpload}
                          className="hidden"
                        />
                      </label>
                      {isUploadingFile && (
                        <div className="mt-4 flex items-center">
                          <div className="w-6 h-6 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin mr-3"></div>
                          <span className="text-teal-600">Đang tải tệp...</span>
                        </div>
                      )}
                      {formData.storyDoc && !isUploadingFile && (
                        <div className="mt-4 flex items-center justify-between bg-teal-50 p-3 rounded-lg shadow-sm hover:bg-teal-100 transition-colors duration-200">
                          <a
                            href={formData.storyDoc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-600 text-sm font-medium hover:underline"
                          >
                            {truncateFileName(formData.storyDoc.name)}
                          </a>
                          <button
                            type="button"
                            onClick={handleRemoveDoc}
                            className="text-red-500 hover:text-red-600 transition-colors"
                          >
                            <FaTimes size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {formData.storyType === "Truyện tranh" && (
                  <>
                    <div className="mb-8">
                      <label className="block text-teal-600 mb-2 font-semibold">
                        Mô tả truyện:
                      </label>
                      <textarea
                        name="storyDescription"
                        value={formData.storyDescription}
                        onChange={handleFormChange}
                        className="h-20 p-2 rounded-lg w-full border-2 border-teal-300 hover:border-teal-500 focus:border-teal-500 focus:outline-none transition-all duration-300"
                        rows="6"
                        placeholder="Nhập mô tả truyện tranh"
                      />
                    </div>
                    <div className="mb-8">
                      <label className="block text-teal-600 mb-2 font-semibold">
                        Tải lên ảnh truyện tranh:
                      </label>
                      <label className="bg-teal-500 text-white px-6 py-3 rounded-full flex items-center cursor-pointer hover:bg-teal-600 transition-all duration-200 hover:scale-105 shadow-md">
                        <FileImageOutlined className="mr-2" /> Ảnh
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      {imageError && (
                        <p className="text-red-500 text-sm mt-4 animate-pulse">
                          {imageError}
                        </p>
                      )}
                      {isUploadingImage && (
                        <div className="mt-4 flex items-center">
                          <div className="w-6 h-6 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin mr-3"></div>
                          <span className="text-teal-600">
                            Đang tải hình ảnh...
                          </span>
                        </div>
                      )}
                      {formData.images.length > 0 && !isUploadingImage && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {formData.images.map((image, index) =>
                            image.url && isValidUrl(image.url) ? (
                              <div
                                key={`image-${index}`}
                                className="relative group rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
                              >
                                <Image
                                  src={image.url}
                                  alt={`Uploaded ${image.name}`}
                                  className="w-full h-24 object-cover"
                                  width={96}
                                  height={96}
                                />
                                <p className="text-xs text-gray-600 mt-1 text-center truncate">
                                  {truncateFileName(image.name)}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(index)}
                                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                                >
                                  <FaTimes size={12} />
                                </button>
                              </div>
                            ) : null
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {selectedPurpose === "Hành trình" && (
              <>
                <div className="mb-8">
                  <label className="block text-teal-600 mb-2 font-semibold">
                    Tiêu đề hành trình:
                  </label>
                  <input
                    type="text"
                    name="timeline-title"
                    value={formData.timeline.title}
                    onChange={handleFormChange}
                    className="h-8 p-2 rounded-lg w-full border-2 border-teal-300 hover:border-teal-500 focus:border-teal-500 focus:outline-none transition-all duration-300"
                    placeholder="Nhập tiêu đề hành trình"
                  />
                </div>
                <div className="mb-8">
                  <label className="block text-teal-600 mb-2 font-semibold">
                    Các mốc thời gian:
                  </label>
                  {formData.timeline.milestones.map(
                    (milestone, milestoneIndex) => (
                      <div
                        key={`milestone-${milestoneIndex}`}
                        className="mb-6 p-4 rounded-lg bg-teal-50 shadow-sm"
                      >
                        <div className="mb-3">
                          <label className="block text-teal-700 font-medium">
                            Mốc thời gian {milestoneIndex + 1}:
                          </label>
                          <input
                            type="date"
                            name={`milestone-time-${milestoneIndex}`}
                            value={milestone.time}
                            onChange={handleFormChange}
                            className="h-8 p-2 rounded-lg w-full border-2 border-teal-300 hover:border-teal-500 focus:border-teal-500 focus:outline-none transition-all duration-300"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="block text-teal-700 font-medium">
                            Mô tả:
                          </label>
                          <textarea
                            name={`milestone-description-${milestoneIndex}`}
                            value={milestone.description}
                            onChange={handleFormChange}
                            className="h-16 p-2 rounded-lg w-full border-2 border-teal-300 hover:border-teal-500 focus:border-teal-500 focus:outline-none transition-all duration-300"
                            placeholder="Nhập mô tả mốc thời gian"
                            rows="4"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="block text-teal-700 font-medium">
                            Trạng thái:
                          </label>
                          <select
                            name={`milestone-status-${milestoneIndex}`}
                            value={milestone.status}
                            onChange={handleFormChange}
                            className="h-9 p-2 rounded-lg w-full min-w-[150px] border-2 border-teal-300 hover:border-teal-500 focus:border-teal-500 focus:outline-none transition-all duration-300"
                          >
                            <option value="Hoàn thành">Hoàn thành</option>
                            <option value="Đang tiến hành">
                              Đang tiến hành
                            </option>
                            <option value="Chưa">Chưa</option>
                          </select>
                        </div>
                        {formData.timeline.milestones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMilestone(milestoneIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Xóa mốc thời gian
                          </button>
                        )}
                      </div>
                    )
                  )}
                  <button
                    type="button"
                    onClick={addMilestone}
                    className="text-teal-500 hover:text-teal-700"
                  >
                    + Thêm mốc thời gian
                  </button>
                </div>
                <div className="mb-8">
                  <label className="block text-teal-600 mb-2 font-semibold">
                    Tải lên ảnh:
                  </label>
                  <label className="bg-teal-500 text-white px-6 py-3 rounded-full flex items-center cursor-pointer hover:bg-teal-600 transition-all duration-200 hover:scale-105 shadow-md">
                    <FileImageOutlined className="mr-2" /> Ảnh
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {imageError && (
                    <p className="text-red-500 text-sm mt-4 animate-pulse">
                      {imageError}
                    </p>
                  )}
                  {isUploadingImage && (
                    <div className="mt-4 flex items-center">
                      <div className="w-6 h-6 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin mr-3"></div>
                      <span className="text-teal-600">
                        Đang tải hình ảnh...
                      </span>
                    </div>
                  )}
                  {formData.images.length > 0 && !isUploadingImage && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {formData.images.map((image, index) =>
                        image.url && isValidUrl(image.url) ? (
                          <div
                            key={`image-${index}`}
                            className="relative group rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
                          >
                            <Image
                              src={image.url}
                              alt={`Uploaded ${image.name}`}
                              className="w-full h-24 object-cover"
                              width={96}
                              height={96}
                            />
                            <p className="text-xs text-gray-600 mt-1 text-center truncate">
                              {truncateFileName(image.name)}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-center items-center mt-8 flex-wrap gap-4">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-200"
                >
                  <FaTrash /> Xóa
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200"
                >
                  <FaSave /> Lưu bản nháp
                </button>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setLivePreview(!livePreview)}
                  className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-all duration-200"
                >
                  <FaEye /> {livePreview ? "Tắt xem trước" : "Xem trước"}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-all duration-200"
                >
                  <FaPaperPlane /> Đăng bài
                </button>
              </div>
            </div>
          </form>
      
      )}
    </div>
  );
}