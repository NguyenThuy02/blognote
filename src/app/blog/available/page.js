"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

const purposes = ["Đặt câu hỏi", "Chia sẻ kiến thức", "Câu đố", "Chuyện tranh"];

const previewSamples = [
  {
    id: "sample-1",
    title: "Bạn biết gì về AI?",
    content:
      "Hãy cùng kiểm tra kiến thức của bạn về trí tuệ nhân tạo qua các câu hỏi dưới đây!",
    topics: "Công nghệ, Trí tuệ nhân tạo",
    purpose: "Đặt câu hỏi",
    questions: [
      {
        question: "AI là viết tắt của gì?",
        options: [
          "Artificial Intelligence",
          "Automated Interaction",
          "Advanced Integration",
        ],
        multipleChoice: false,
      },
      {
        question: "AI đầu tiên được phát triển vào năm nào?",
        options: ["1950", "1960", "1970"],
        multipleChoice: true,
      },
    ],
    tags: ["AI", "Công nghệ"],
  },
  {
    id: "sample-2",
    title: "Lợi ích của việc học lập trình",
    content:
      "Lập trình không chỉ là kỹ năng công nghệ mà còn giúp phát triển tư duy logic và sáng tạo.",
    topics: "Lập trình, Giáo dục",
    purpose: "Chia sẻ kiến thức",
    media: ["programming101.pdf", "logic_exercises.docx"],
    tags: ["Lập trình", "Giáo dục"],
  },
  {
    id: "sample-3",
    title: "Thử tài giải đố của bạn!",
    content: "Hãy thử giải các câu đố thú vị dưới đây và kiểm tra đáp án nhé!",
    topics: "Giải trí, Trí tuệ",
    purpose: "Câu đố",
    quizzes: [
      {
        question: "Tôi nói mọi thứ nhưng không bao giờ nghe. Tôi là gì?",
        answer: "Tiếng vọng",
      },
      { question: "Cái gì có 4 chân nhưng không đi được?", answer: "Cái bàn" },
    ],
    tags: ["Câu đố", "Giải trí"],
  },
  {
    id: "sample-4",
    title: "Hành trình của ngôi sao",
    content:
      "Một câu chuyện ngắn về hành trình của một ngôi sao nhỏ bé trong vũ trụ rộng lớn.",
    topics: "Truyện ngắn, Vũ trụ",
    purpose: "Chuyện tranh",
    storyType: "Truyện chữ",
    storyContent:
      "Ngày xưa, có một ngôi sao nhỏ bé luôn mơ ước tỏa sáng rực rỡ như những ngôi sao lớn...",
    tags: ["Truyện ngắn", "Vũ trụ"],
  },
  {
    id: "sample-5",
    title: "Cuộc phiêu lưu của mèo con",
    content: "Một câu chuyện hài hước về chú mèo con khám phá thế giới.",
    topics: "Truyện tranh, Động vật",
    purpose: "Chuyện tranh",
    storyType: "Truyện tranh",
    images: ["cat_adventure_1.jpg", "cat_adventure_2.jpg"],
    tags: ["Truyện tranh", "Động vật"],
  },
];

const getPurposeColor = (purpose) => {
  switch (purpose) {
    case "Đặt câu hỏi":
      return "bg-blue-50 border-blue-300";
    case "Chia sẻ kiến thức":
      return "bg-green-50 border-green-300";
    case "Câu đố":
      return "bg-yellow-50 border-yellow-300";
    case "Chuyện tranh":
      return "bg-purple-50 border-purple-300";
    default:
      return "bg-gray-50 border-gray-300";
  }
};

const SampleDisplay = ({ sample, index, onSelect }) => (
  <div
    className={`p-6 rounded-xl shadow-lg border-2 ${getPurposeColor(
      sample.purpose || ""
    )} transform hover:-translate-y-2 transition-all duration-300 animate-fade-in`}
    style={{ animationDelay: `${0.1 + index * 0.05}s` }}
  >
    <div className="mb-4">
      <label className="block text-gray-700 mb-2 font-semibold">Tiêu đề:</label>
      <input
        type="text"
        value={sample.title || ""}
        readOnly
        className="p-3 rounded-lg w-full border-2 border-gray-300 bg-gray-100 text-gray-700"
      />
    </div>
    <div className="mb-4">
      <label className="block text-gray-700 mb-2 font-semibold">
        {sample.purpose === "Đặt câu hỏi" ? "Mô tả (nếu có)" : "Nội dung"}:
      </label>
      <textarea
        value={sample.content || ""}
        readOnly
        className="p-3 rounded-lg w-full border-2 border-gray-300 bg-gray-100 text-gray-700"
        rows="4"
      />
    </div>

    {sample.purpose === "Đặt câu hỏi" && Array.isArray(sample.questions) && (
      <div className="mb-4">
        <label className="block text-gray-700 mb-2 font-semibold">
          Danh sách câu hỏi:
        </label>
        {sample.questions.map((q, qIndex) => (
          <div
            key={`question-${sample.id || index}-${qIndex}`}
            className="mb-4 p-4 rounded-lg bg-white shadow-sm"
          >
            <div className="mb-3">
              <label className="block text-gray-700 font-medium">
                Câu hỏi {qIndex + 1}:
              </label>
              <input
                type="text"
                value={q.question || ""}
                readOnly
                className="p-3 rounded-lg w-full border-2 border-gray-300 bg-gray-100 text-gray-700"
              />
            </div>
            <div className="mb-3">
              <label className="block text-gray-700 font-medium">
                Lựa chọn đáp án:
              </label>
              {Array.isArray(q.options) &&
                q.options.map((option, optIndex) => (
                  <div
                    key={`option-${sample.id || index}-${qIndex}-${optIndex}`}
                    className="flex items-center gap-2 mb-2"
                  >
                    <span className="text-gray-700">{optIndex + 1}.</span>
                    <input
                      type="text"
                      value={option || ""}
                      readOnly
                      className="p-2 rounded-lg w-full border-2 border-gray-300 bg-gray-100 text-gray-700"
                    />
                  </div>
                ))}
            </div>
            <div className="mb-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={q.multipleChoice || false}
                  readOnly
                  className="mr-2"
                />
                <span className="text-gray-700">
                  Cho phép chọn nhiều đáp án
                </span>
              </label>
            </div>
          </div>
        ))}
      </div>
    )}

    {sample.purpose === "Chia sẻ kiến thức" && Array.isArray(sample.media) && (
      <div className="mb-4">
        <label className="block text-gray-700 mb-2 font-semibold">
          Tệp đính kèm:
        </label>
        {sample.media.map((file, mIndex) => (
          <div
            key={`media-${sample.id || index}-${mIndex}`}
            className="flex items-center gap-2 mb-2"
          >
            <input
              type="text"
              value={file || ""}
              readOnly
              className="p-2 rounded-lg w-full border-2 border-gray-300 bg-gray-100 text-gray-700"
            />
          </div>
        ))}
      </div>
    )}

    {sample.purpose === "Câu đố" && Array.isArray(sample.quizzes) && (
      <div className="mb-4">
        <label className="block text-gray-700 mb-2 font-semibold">
          Danh sách câu đố:
        </label>
        {sample.quizzes.map((quiz, qIndex) => (
          <div
            key={`quiz-${sample.id || index}-${qIndex}`}
            className="mb-4 p-4 rounded-lg bg-white shadow-sm"
          >
            <div className="mb-2">
              <label className="block text-gray-700 font-medium">
                Câu hỏi {qIndex + 1}:
              </label>
              <input
                type="text"
                value={quiz.question || ""}
                readOnly
                className="p-3 rounded-lg w-full border-2 border-gray-300 bg-gray-100 text-gray-700"
              />
            </div>
            <div className="mb-2">
              <label className="block text-gray-700 font-medium">Đáp án:</label>
              <input
                type="text"
                value={quiz.answer || ""}
                readOnly
                className="p-3 rounded-lg w-full border-2 border-gray-300 bg-gray-100 text-gray-700"
              />
            </div>
          </div>
        ))}
      </div>
    )}

    {sample.purpose === "Chuyện tranh" && (
      <>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 font-semibold">
            Loại truyện:
          </label>
          <input
            type="text"
            value={sample.storyType || ""}
            readOnly
            className="p-3 rounded-lg w-full md:w-1/3 border-2 border-gray-300 bg-gray-100 text-gray-700"
          />
        </div>
        {sample.storyType === "Truyện chữ" && sample.storyContent && (
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-semibold">
              Nội dung truyện:
            </label>
            <textarea
              value={sample.storyContent || ""}
              readOnly
              className="p-3 rounded-lg w-full border-2 border-gray-300 bg-gray-100 text-gray-700"
              rows="6"
            />
          </div>
        )}
        {sample.storyType === "Truyện tranh" &&
          Array.isArray(sample.images) && (
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-semibold">
                Ảnh truyện:
              </label>
              {sample.images.map((img, imgIndex) => (
                <div
                  key={`image-${sample.id || index}-${imgIndex}`}
                  className="flex items-center gap-2 mb-2"
                >
                  <input
                    type="text"
                    value={img || ""}
                    readOnly
                    className="p-2 rounded-lg w-full border-2 border-gray-300 bg-gray-100 text-gray-700"
                  />
                </div>
              ))}
            </div>
          )}
      </>
    )}

    <div className="mb-4">
      <label className="block text-gray-700 mb-2 font-semibold">Chủ đề:</label>
      <input
        type="text"
        value={sample.topics || ""}
        readOnly
        className="p-3 rounded-lg w-full border-2 border-gray-300 bg-gray-100 text-gray-700"
      />
    </div>
    <div className="mb-4">
      <label className="block text-gray-700 mb-2 font-semibold">Tags:</label>
      <input
        type="text"
        value={Array.isArray(sample.tags) ? sample.tags.join(", ") : ""}
        readOnly
        className="p-3 rounded-lg w-full border-2 border-gray-300 bg-gray-100 text-gray-700"
      />
    </div>
    <button
      onClick={() => onSelect(sample)}
      className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-all duration-300"
    >
      Sử dụng mẫu này
    </button>
  </div>
);

export default function AvailableSamples({ onSelectSample }) {
  const router = useRouter();
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    topics: "",
    tags: [],
    questions: [{ question: "", options: ["", ""], multipleChoice: false }],
    media: [],
    quizzes: [{ question: "", answer: "" }],
    storyType: "Truyện chữ",
    storyContent: "",
    storyFile: null,
    images: [],
  });
  const [generatedPost, setGeneratedPost] = useState(null);
  const [posts, setPosts] = useState(previewSamples);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (error) {
        console.error("Error checking auth:", error.message);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select(
            "id, title, content, topics, purpose, questions, media, quizzes, storyType, storyContent, images, tags"
          )
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        const normalizedPosts = (data || []).map((post, idx) => ({
          ...post,
          id: post.id || `supabase-fallback-${idx}`,
          tags: post.tags
            ? typeof post.tags === "string"
              ? post.tags.split(",").map((tag) => tag.trim())
              : Array.isArray(post.tags)
              ? post.tags
              : []
            : [],
        }));

        const uniquePosts = [];
        const seenIds = new Set();
        for (const post of normalizedPosts) {
          if (!seenIds.has(post.id)) {
            seenIds.add(post.id);
            uniquePosts.push(post);
          } else {
            console.warn(`Duplicate ID detected: ${post.id}`);
          }
        }

        const combinedPosts = [
          ...uniquePosts,
          ...previewSamples.filter((sample) => !seenIds.has(sample.id)),
        ];

        setPosts(combinedPosts.length ? combinedPosts : previewSamples);
      } catch (err) {
        console.error("Error fetching posts:", err.message);
        setPosts(previewSamples);
      }
    };
    fetchPosts();
  }, []);

  const handlePurposeChange = (e) => {
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập để chọn mục đích!");
      router.push("/login");
      return;
    }
    setSelectedPurpose(e.target.value);
    setShowForm(false);
    setFormData({
      title: "",
      content: "",
      topics: "",
      tags: [],
      questions: [{ question: "", options: ["", ""], multipleChoice: false }],
      media: [],
      quizzes: [{ question: "", answer: "" }],
      storyType: "Truyện chữ",
      storyContent: "",
      storyFile: null,
      images: [],
    });
    setGeneratedPost(null);
  };

  const handleCreateForm = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (!selectedPurpose) {
      alert("Vui lòng chọn mục đích trước!");
      return;
    }
    setShowForm(true);
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
    } else if (name.startsWith("media")) {
      const index = parseInt(name.split("-")[1], 10);
      const newMedia = [...formData.media];
      newMedia[index] = files[0];
      setFormData((prev) => ({ ...prev, media: newMedia }));
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
    } else if (name === "storyFile") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else if (name.startsWith("image")) {
      const index = parseInt(name.split("-")[1], 10);
      const newImages = [...formData.images];
      newImages[index] = files[0];
      setFormData((prev) => ({ ...prev, images: newImages }));
    } else if (name === "tags") {
      setFormData((prev) => ({
        ...prev,
        tags: value.split(",").map((tag) => tag.trim()),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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

  const addMedia = () => {
    setFormData((prev) => ({ ...prev, media: [...prev.media, null] }));
  };

  const removeMedia = (index) => {
    setFormData((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
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

  const addImage = () => {
    setFormData((prev) => ({ ...prev, images: [...prev.images, null] }));
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSaveDraft = () => {
    const draftData = { ...formData, purpose: selectedPurpose };
    localStorage.setItem("draftPost", JSON.stringify(draftData));
    alert("Đã lưu nháp thành công!");
  };

  const handlePublishPost = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.topics) {
      alert("Vui lòng điền đầy đủ tiêu đề, nội dung và chủ đề!");
      return;
    }
    if (
      selectedPurpose === "Đặt câu hỏi" &&
      formData.questions.some(
        (q) =>
          !q.question || q.options.some((opt) => !opt) || q.options.length < 2
      )
    ) {
      alert(
        "Vui lòng điền đầy đủ câu hỏi và ít nhất 2 lựa chọn đáp án cho mỗi câu hỏi!"
      );
      return;
    }
    if (
      selectedPurpose === "Câu đố" &&
      formData.quizzes.some((q) => !q.question || !q.answer)
    ) {
      alert("Vui lòng điền đầy đủ câu hỏi và đáp án cho tất cả câu đố!");
      return;
    }
    if (
      selectedPurpose === "Chuyện tranh" &&
      formData.storyType === "Truyện chữ" &&
      !formData.storyContent &&
      !formData.storyFile
    ) {
      alert("Vui lòng nhập nội dung hoặc upload file cho truyện chữ!");
      return;
    }
    if (
      selectedPurpose === "Chuyện tranh" &&
      formData.storyType === "Truyện tranh" &&
      formData.images.some((img) => !img)
    ) {
      alert("Vui lòng chọn tất cả ảnh cho truyện tranh!");
      return;
    }

    try {
      const newPost = {
        title: formData.title,
        content: formData.content,
        topics: formData.topics,
        purpose: selectedPurpose,
        tags: Array.isArray(formData.tags) ? formData.tags.join(",") : "",
        ...(selectedPurpose === "Đặt câu hỏi" && {
          questions: formData.questions,
        }),
        ...(selectedPurpose === "Chia sẻ kiến thức" && {
          media: formData.media.map((file) => file?.name || "Không có file"),
        }),
        ...(selectedPurpose === "Câu đố" && { quizzes: formData.quizzes }),
        ...(selectedPurpose === "Chuyện tranh" && {
          storyType: formData.storyType,
          ...(formData.storyType === "Truyện chữ" && {
            storyContent:
              formData.storyContent ||
              (formData.storyFile ? formData.storyFile.name : ""),
          }),
          ...(formData.storyType === "Truyện tranh" && {
            images: formData.images.map((img) => img?.name || "Không có ảnh"),
          }),
        }),
      };

      const { data, error } = await supabase
        .from("posts")
        .insert([newPost])
        .select()
        .single();

      if (error) throw error;

      const savedPost = { ...data, id: data.id || `new-${Date.now()}` };
      setGeneratedPost(savedPost);
      setPosts((prev) => [savedPost, ...prev]);
      alert("Bài viết đã được đăng thành công!");
    } catch (err) {
      console.error("Error publishing post:", err.message);
      alert(`Không thể đăng bài viết: ${err.message}`);
    }
  };

  const handleUseSample = (post) => {
    if (onSelectSample) {
      onSelectSample(post);
    } else {
      router.push(
        `/blog/post?${new URLSearchParams({
          title: post.title || "",
          content: post.content || "",
          topic: post.topics || "",
          tags: Array.isArray(post.tags) ? post.tags.join(",") : "",
          purpose: post.purpose || "",
          ...(post.questions && { questions: JSON.stringify(post.questions) }),
          ...(post.media && { media: JSON.stringify(post.media) }),
          ...(post.quizzes && { quizzes: JSON.stringify(post.quizzes) }),
          ...(post.storyType && { storyType: post.storyType }),
          ...(post.storyContent && { storyContent: post.storyContent }),
          ...(post.images && { images: JSON.stringify(post.images) }),
        })}`
      );
    }
  };

  if (loading) {
    return <div className="text-center p-5">Đang tải...</div>;
  }

  return (
    <div className="text-gray-700 flex flex-col p-5 bg-gradient-to-r from-blue-100 to-white min-h-screen">
      <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 mb-8 text-center">
        Mẫu bài viết có sẵn
      </h1>

      <div className="mb-8 flex flex-col md:flex-row items-center justify-center gap-6">
        <div className="w-full md:w-1/3">
          <select
            value={selectedPurpose}
            onChange={handlePurposeChange}
            className={`p-3 rounded-lg w-full border-2 border-gray-300 transition-all duration-300 bg-white shadow-sm ${
              isLoggedIn
                ? "hover:border-blue-500 focus:border-purple-500"
                : "opacity-50 cursor-not-allowed"
            }`}
            disabled={!isLoggedIn}
          >
            <option value="">-- Chọn mục đích --</option>
            {purposes.map((purpose) => (
              <option key={purpose} value={purpose}>
                {purpose}
              </option>
            ))}
          </select>
          {!isLoggedIn && (
            <p className="text-red-500 text-sm mt-2">
              Vui lòng đăng nhập để chọn mục đích.
            </p>
          )}
        </div>
        <button
          onClick={handleCreateForm}
          className={`text-gray-700 py-2 px-8 rounded-lg bg-gradient-to-r from-purple-200 to-blue-200 transition-all duration-300 font-semibold ${
            isLoggedIn
              ? "hover:from-purple-300 hover:to-blue-300 hover:shadow-md"
              : "opacity-50 cursor-not-allowed"
          }`}
          disabled={!isLoggedIn}
        >
          Tạo mẫu mới
        </button>
        {!isLoggedIn && (
          <p className="text-red-500 text-sm mt-2">
            Vui lòng đăng nhập để tạo mẫu.
          </p>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handlePublishPost}
          className="mb-8 bg-white p-8 rounded-xl shadow-lg"
        >
          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">
              Tiêu đề:
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              className="p-3 rounded-lg w-full border-2 border-gray-300 hover:border-blue-500 focus:border-purple-500 focus:outline-none transition-all duration-300"
              placeholder="Nhập tiêu đề"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">
              {selectedPurpose === "Đặt câu hỏi"
                ? "Mô tả (nếu có)"
                : "Nội dung"}
              :
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleFormChange}
              className="p-3 rounded-lg w-full border-2 border-gray-300 hover:border-blue-500 focus:border-purple-500 focus:outline-none transition-all duration-300"
              rows="4"
              placeholder={
                selectedPurpose === "Đặt câu hỏi"
                  ? "Nhập mô tả (nếu có)"
                  : "Nhập nội dung"
              }
            />
          </div>

          {selectedPurpose === "Đặt câu hỏi" && (
            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-semibold">
                Danh sách câu hỏi:
              </label>
              {formData.questions.map((q, questionIndex) => (
                <div
                  key={`form-question-${questionIndex}`}
                  className="mb-6 p-4 rounded-lg bg-gray-50 shadow-sm"
                >
                  <div className="mb-3">
                    <label className="block text-gray-700 font-medium">
                      Câu hỏi {questionIndex + 1}:
                    </label>
                    <input
                      type="text"
                      name={`question-title-${questionIndex}`}
                      value={q.question}
                      onChange={handleFormChange}
                      className="p-3 rounded-lg w-full border-2 border-gray-300 hover:border-blue-500 focus:border-purple-500 focus:outline-none transition-all duration-300"
                      placeholder="Nhập câu hỏi"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-gray-700 font-medium">
                      Lựa chọn đáp án:
                    </label>
                    {q.options.map((option, optionIndex) => (
                      <div
                        key={`form-option-${questionIndex}-${optionIndex}`}
                        className="flex items-center gap-2 mb-2"
                      >
                        <span className="text-gray-700">
                          {optionIndex + 1}.
                        </span>
                        <input
                          type="text"
                          name={`option-${questionIndex}-${optionIndex}`}
                          value={option}
                          onChange={handleFormChange}
                          className="p-2 rounded-lg w-full border-2 border-gray-300 hover:border-blue-500 focus:border-purple-500 focus:outline-none transition-all duration-300"
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
                      className="text-blue-500 hover:text-blue-700 mt-2"
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
                      <span className="text-gray-700">
                        Cho phép chọn nhiều đáp án
                      </span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQuestion(questionIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Xóa câu hỏi
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addQuestion}
                className="text-blue-500 hover:text-blue-700"
              >
                + Thêm câu hỏi
              </button>
            </div>
          )}

          {selectedPurpose === "Chia sẻ kiến thức" && (
            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-semibold">
                Tệp đính kèm:
              </label>
              {formData.media.map((file, mediaIndex) => (
                <div
                  key={`form-media-${mediaIndex}`}
                  className="flex items-center gap-2 mb-2"
                >
                  <input
                    type="file"
                    name={`media-${mediaIndex}`}
                    onChange={handleFormChange}
                    className="p-2 rounded-lg w-full border-2 border-gray-300 hover:border-blue-500 focus:border-purple-500 focus:outline-none transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeMedia(mediaIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Xóa
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addMedia}
                className="text-blue-500 hover:text-blue-700"
              >
                + Thêm tệp
              </button>
            </div>
          )}

          {selectedPurpose === "Câu đố" && (
            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-semibold">
                Danh sách câu đố:
              </label>
              {formData.quizzes.map((quiz, quizIndex) => (
                <div
                  key={`form-quiz-${quizIndex}`}
                  className="mb-6 p-4 rounded-lg bg-gray-50 shadow-sm"
                >
                  <div className="mb-3">
                    <label className="block text-gray-700 font-medium">
                      Câu hỏi {quizIndex + 1}:
                    </label>
                    <input
                      type="text"
                      name={`quiz-question-${quizIndex}`}
                      value={quiz.question}
                      onChange={handleFormChange}
                      className="p-3 rounded-lg w-full border-2 border-gray-300 hover:border-blue-500 focus:border-purple-500 focus:outline-none transition-all duration-300"
                      placeholder="Nhập câu hỏi"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-gray-700 font-medium">
                      Đáp án:
                    </label>
                    <input
                      type="text"
                      name={`quiz-answer-${quizIndex}`}
                      value={quiz.answer}
                      onChange={handleFormChange}
                      className="p-3 rounded-lg w-full border-2 border-gray-300 hover:border-blue-500 focus:border-purple-500 focus:outline-none transition-all duration-300"
                      placeholder="Nhập đáp án"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQuiz(quizIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Xóa câu đố
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addQuiz}
                className="text-blue-500 hover:text-blue-700"
              >
                + Thêm câu đố
              </button>
            </div>
          )}

          {selectedPurpose === "Chuyện tranh" && (
            <>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2 font-semibold">
                  Loại truyện:
                </label>
                <select
                  name="storyType"
                  value={formData.storyType}
                  onChange={handleFormChange}
                  className="p-3 rounded-lg w-full md:w-1/3 border-2 border-gray-300 hover:border-blue-500 focus:border-purple-500 focus:outline-none transition-all duration-300"
                >
                  <option value="Truyện chữ">Truyện chữ</option>
                  <option value="Truyện tranh">Truyện tranh</option>
                </select>
              </div>
              {formData.storyType === "Truyện chữ" && (
                <>
                  <div className="mb-6">
                    <label className="block text-gray-700 mb-2 font-semibold">
                      Nội dung truyện:
                    </label>
                    <textarea
                      name="storyContent"
                      value={formData.storyContent}
                      onChange={handleFormChange}
                      className="p-3 rounded-lg w-full border-2 border-gray-300 hover:border-blue-500 focus:border-purple-500 focus:outline-none transition-all duration-300"
                      rows="6"
                      placeholder="Nhập nội dung truyện"
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-gray-700 mb-2 font-semibold">
                      Hoặc tải lên file truyện:
                    </label>
                    <input
                      type="file"
                      name="storyFile"
                      onChange={handleFormChange}
                      className="p-2 rounded-lg w-full border-2 border-gray-300 hover:border-blue-500 focus:border-purple-500 focus:outline-none transition-all duration-300"
                    />
                  </div>
                </>
              )}
              {formData.storyType === "Truyện tranh" && (
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2 font-semibold">
                    Ảnh truyện:
                  </label>
                  {formData.images.map((img, imgIndex) => (
                    <div
                      key={`form-image-${imgIndex}`}
                      className="flex items-center gap-2 mb-2"
                    >
                      <input
                        type="file"
                        name={`image-${imgIndex}`}
                        onChange={handleFormChange}
                        className="p-2 rounded-lg w-full border-2 border-gray-300 hover:border-blue-500 focus:border-purple-500 focus:outline-none transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(imgIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addImage}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    + Thêm ảnh
                  </button>
                </div>
              )}
            </>
          )}

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">
              Chủ đề:
            </label>
            <input
              type="text"
              name="topics"
              value={formData.topics}
              onChange={handleFormChange}
              className="p-3 rounded-lg w-full border-2 border-gray-300 hover:border-blue-500 focus:border-purple-500 focus:outline-none transition-all duration-300"
              placeholder="Nhập chủ đề (cách nhau bằng dấu phẩy nếu nhiều)"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">
              Tags:
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags.join(", ")}
              onChange={handleFormChange}
              className="p-3 rounded-lg w-full border-2 border-gray-300 hover:border-blue-500 focus:border-purple-500 focus:outline-none transition-all duration-300"
              placeholder="Nhập tags (cách nhau bằng dấu phẩy)"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-green-500 text-white py-2 px-6 rounded-lg hover:bg-green-600 transition-all duration-300"
            >
              Đăng bài
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition-all duration-300"
            >
              Lưu nháp
            </button>
          </div>
        </form>
      )}
      {showLoginModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Yêu cầu đăng nhập
            </h3>
            <p className="text-gray-600 mb-6">
              Vui lòng đăng nhập để xem thống kê bài viết.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowLoginModal(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-200"
              >
                Hủy
              </button>
              <button
                onClick={handleLoginRedirect}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition duration-200"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {generatedPost ? (
          <SampleDisplay
            key={generatedPost.id}
            sample={generatedPost}
            index={0}
            onSelect={handleUseSample}
          />
        ) : !showForm ? (
          posts.map((post, index) => (
            <SampleDisplay
              key={post.id || `post-${index}`}
              sample={post}
              index={index}
              onSelect={handleUseSample}
            />
          ))
        ) : null}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
