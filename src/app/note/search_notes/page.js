"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase2 } from "../../../lib/supabase";
import ThemeSettings from "../../components/ThemeSettings";

export default function NotePage() {
  const [note, setNote] = useState("");
  const [title, setTitle] = useState("");
  const [noteType, setNoteType] = useState("rich");
  const [noteTemplate, setNoteTemplate] = useState("freeform");
  const [meetingForm, setMeetingForm] = useState({
    agenda: "",
    attendees: "",
    actionItems: "",
  });
  const [studyForm, setStudyForm] = useState({
    topic: "",
    keyPoints: "",
    questions: "",
  });
  const [dailyForm, setDailyForm] = useState({
    availableTime: "",
    mood: "",
    priorities: "",
  });
  const [language, setLanguage] = useState("vi");
  const [suggestions, setSuggestions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedNotes, setSavedNotes] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [classification, setClassification] = useState("Tất cả");
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const classifications = ["Tất cả", "Công việc", "Cá nhân", "Học tập", "Khác"];
  const savedNotesRef = useRef(null);

  const emojis = [
    "😊", "😄", "😎", "😊", "😢", "😔", "😤", "😴", "🥳", "🤩",
    "😌", "🙌", "💪", "😇", "😍", "😖", "😣", "😩", "😡", "😷"
  ];

  const languages = [
    { code: "vi", label: "Tiếng Việt" },
    { code: "en", label: "Tiếng Anh" },
  ];

  const templates = {
    freeform: { label: "Ghi chú tự do", fields: [] },
    meeting: {
      label: "Ghi chú cuộc họp",
      fields: [
        { id: "agenda", label: "Chương trình nghị sự", type: "textarea", rows: 3 },
        { id: "attendees", label: "Thành phần tham dự", type: "textarea", rows: 2 },
        { id: "actionItems", label: "Hành động cần thực hiện", type: "textarea", rows: 3 },
      ],
    },
    study: {
      label: "Ghi chú học tập",
      fields: [
        { id: "topic", label: "Chủ đề", type: "text" },
        { id: "keyPoints", label: "Điểm chính", type: "textarea", rows: 3 },
        { id: "questions", label: "Câu hỏi ôn tập", type: "textarea", rows: 3 },
      ],
    },
    daily: {
      label: "Kế hoạch hôm nay",
      fields: [
        { id: "availableTime", label: "Thời gian rảnh", type: "text" },
        { id: "mood", label: "Tâm trạng", type: "textarea", rows: 2 },
        { id: "priorities", label: "Ưu tiên", type: "textarea", rows: 3 },
      ],
    },
  };

  const fetchNotes = async () => {
    try {
      const userData = localStorage.getItem("user");
      let user_id = null;
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          user_id = parsedUser.id;
          if (!user_id) {
            console.error("Không tìm thấy user_id trong dữ liệu người dùng.");
            setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
            return;
          }
        } catch (err) {
          console.error("Lỗi khi parse dữ liệu user từ localStorage:", err);
          setError("Lỗi khi lấy thông tin người dùng. Vui lòng đăng nhập lại.");
          return;
        }
      } else {
        console.error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập.");
        setError("Vui lòng đăng nhập để xem ghi chú của bạn.");
        return;
      }

      const { data, error } = await supabase2
        .from("notess")
        .select("*")
        .eq("user_id", user_id);

      if (error) {
        console.error("Lỗi khi lấy ghi chú từ Supabase:", error.message);
        setError("Không thể tải ghi chú. Vui lòng thử lại.");
      } else {
        if (!data || data.length === 0) {
          console.warn("Không tìm thấy ghi chú nào cho người dùng này.");
          setSavedNotes([]);
          setFilteredNotes([]);
        } else {
          setSavedNotes(data);
          setFilteredNotes(data);
        }
      }
    } catch (error) {
      console.error("Lỗi không mong muốn khi fetch notes:", error.message);
      setError("Lỗi hệ thống. Vui lòng thử lại sau.");
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    const results = savedNotes.filter(
      (note) =>
        (classification === "Tất cả" || note.classification === classification) &&
        (note.title.toLowerCase().includes(search.toLowerCase()) ||
          (note.tags && note.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))))
    );
    setFilteredNotes(results);
  }, [search, classification, savedNotes]);

  useEffect(() => {
    if (title.trim()) {
      const lowercaseTitle = title.toLowerCase();
      if (lowercaseTitle.includes("meeting") || lowercaseTitle.includes("họp")) {
        setNoteTemplate("meeting");
      } else if (
        lowercaseTitle.includes("study") ||
        lowercaseTitle.includes("học") ||
        lowercaseTitle.includes("exam") ||
        lowercaseTitle.includes("thi")
      ) {
        setNoteTemplate("study");
      } else if (
        lowercaseTitle.includes("today") ||
        lowercaseTitle.includes("hôm nay") ||
        lowercaseTitle.includes("plan") ||
        lowercaseTitle.includes("kế hoạch")
      ) {
        setNoteTemplate("daily");
      } else {
        setNoteTemplate("freeform");
      }
    }
  }, [title]);

  const generateTags = async (content) => {
    try {
      const response = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: content,
          instruction: "Generate 3-5 relevant tags for this note content.",
          language,
        }),
      });
      if (!response.ok) throw new Error("Lỗi từ API.");
      const data = await response.json();
      return data.tags || ["general", "note"];
    } catch (error) {
      console.error("Lỗi tạo tags:", error.message);
      return ["error"];
    }
  };

  const saveNote = async (content, title, type, template) => {
    try {
      const userData = localStorage.getItem("user");
      let user_id = null;
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          user_id = parsedUser.id;
          if (!user_id) {
            console.error("Không tìm thấy user_id trong dữ liệu người dùng.");
            setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
            return;
          }
        } catch (err) {
          console.error("Lỗi khi parse dữ liệu user từ localStorage:", err);
          setError("Lỗi khi lấy thông tin người dùng. Vui lòng đăng nhập lại.");
          return;
        }
      } else {
        console.error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập.");
        setError("Vui lòng đăng nhập để lưu ghi chú.");
        return;
      }

      const tags = await generateTags(content);
      const { data, error } = await supabase2
        .from("notess")
        .insert({
          title: title || "Ghi chú không tiêu đề",
          content,
          created_at: new Date().toISOString(),
          note_type: type,
          classification: classification === "Tất cả" ? "Khác" : classification,
          template,
          tags,
          user_id,
        })
        .select();

      if (error) {
        console.error("Lỗi khi lưu ghi chú:", error.message);
        setError("Không thể lưu ghi chú. Vui lòng thử lại.");
      } else {
        if (data && data.length > 0) {
          setSavedNotes((prev) => [...prev, { ...data[0], content, template, tags }]);
          alert("Ghi chú đã được lưu!");
          setMeetingForm({ agenda: "", attendees: "", actionItems: "" });
          setStudyForm({ topic: "", keyPoints: "", questions: "" });
          setDailyForm({ availableTime: "", mood: "", priorities: "" });
          setNote("");
          setTitle("");
        }
      }
    } catch (error) {
      console.error("Lỗi không mong muốn khi lưu ghi chú:", error.message);
      setError("Lỗi hệ thống khi lưu ghi chú.");
    }
  };

  const generateSuggestions = async (input, template) => {
    try {
      let prompt;
      if (template === "meeting") {
        prompt = {
          note: input,
          template: "meeting",
          instruction:
            "Generate creative suggestions for a meeting note based on the input context, including: 3 optimized agenda items with time estimates tailored to the meeting purpose, 3 prioritized action items with owners and deadlines, 3 recommended participants with their roles and specific issues they will address in the meeting.",
          language,
        };
      } else if (template === "study") {
        prompt = {
          note: input,
          template: "study",
          instruction:
            "Generate suggestions for a study note, including: 3 flashcards with question-answer pairs, 3 quiz questions with multiple-choice options, 3 key concepts summarized from the content.",
          language,
        };
      } else if (template === "daily") {
        prompt = {
          note: input,
          template: "daily",
          instruction:
            "Generate suggestions for a daily planner based on available time, mood, and priorities, including: 3 relaxation activities, 3 productivity tasks, 3 self-care ideas, and 2-3 motivational messages to encourage the user.",
          language,
        };
      } else {
        prompt = { note: "input", language };
      }

      const response = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prompt),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi từ API: ${errorText}`);
      }
      const data = await response.json();

      if (template === "meeting") {
        if (!data.agendaItems?.length || !data.actionItems?.length || !data.participants?.length) {
          throw new Error("Phản hồi API không đầy đủ cho ghi chú cuộc họp.");
        }
        return {
          agendaItems: data.agendaItems.slice(0, 3),
          actionItems: data.actionItems.slice(0, 3),
          participants: data.participants.slice(0, 3),
        };
      } else if (template === "study") {
        if (!data.flashcards?.length || !data.quizQuestions?.length || !data.keyConcepts?.length) {
          throw new Error("Phản hồi API không đầy đủ cho ghi chú học tập.");
        }
        return {
          flashcards: data.flashcards.slice(0, 3),
          quizQuestions: data.quizQuestions.slice(0, 3),
          keyConcepts: data.keyConcepts.slice(0, 3),
        };
      } else if (template === "daily") {
        if (
          !data.relaxationActivities?.length ||
          !data.productivityTasks?.length ||
          !data.selfCareIdeas?.length ||
          !data.motivationalMessages?.length
        ) {
          throw new Error("Phản hồi API không đầy đủ cho kế hoạch hàng ngày.");
        }
        return {
          relaxationActivities: data.relaxationActivities.slice(0, 3),
          productivityTasks: data.productivityTasks.slice(0, 3),
          selfCareIdeas: data.selfCareIdeas.slice(0, 3),
          motivationalMessages: data.motivationalMessages.slice(0, 3),
        };
      }
      return data;
    } catch (error) {
      throw new Error(`Không thể tạo gợi ý: ${error.message}`);
    }
  };

  const handleGenerate = async () => {
    const input =
      noteTemplate === "freeform"
        ? note
        : noteTemplate === "meeting"
        ? JSON.stringify(meetingForm)
        : noteTemplate === "study"
        ? JSON.stringify(studyForm)
        : JSON.stringify(dailyForm);
    if (!input.trim() || input === "{}") {
      setError("Vui lòng nhập ghi chú trước khi tạo gợi ý!");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const newSuggestions = await generateSuggestions(input, noteTemplate);
      setSuggestions(newSuggestions);
    } catch (error) {
      setError(error.message);
      setSuggestions(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (noteTemplate === "freeform" && !note.trim()) {
      alert("Vui lòng nhập ghi chú trước khi lưu!");
      return;
    }
    if (noteTemplate === "meeting" && !Object.values(meetingForm).some((v) => v.trim())) {
      alert("Vui lòng điền ít nhất một trường trong biểu mẫu!");
      return;
    }
    if (noteTemplate === "study" && !Object.values(studyForm).some((v) => v.trim())) {
      alert("Vui lòng điền ít nhất một trường trong biểu mẫu!");
      return;
    }
    if (noteTemplate === "daily" && !Object.values(dailyForm).some((v) => v.trim())) {
      alert("Vui lòng điền ít nhất một trường trong biểu mẫu!");
      return;
    }
    const content =
      noteTemplate === "freeform"
        ? note
        : noteTemplate === "meeting"
        ? JSON.stringify(meetingForm)
        : noteTemplate === "study"
        ? JSON.stringify(studyForm)
        : JSON.stringify(dailyForm);
    saveNote(content, title, noteType, noteTemplate);
  };

  const handleNoteClick = (noteItem) => {
    setTitle(noteItem.title);
    setNoteType(noteItem.note_type);
    setClassification(noteItem.classification);
    setNoteTemplate(noteItem.template || "freeform");
    if (noteItem.template === "meeting") {
      try {
        const parsedContent = JSON.parse(noteItem.content);
        setMeetingForm({
          agenda: parsedContent.agenda || "",
          attendees: parsedContent.attendees || "",
          actionItems: parsedContent.actionItems || "",
        });
        setStudyForm({ topic: "", keyPoints: "", questions: "" });
        setDailyForm({ availableTime: "", mood: "", priorities: "" });
        setNote("");
      } catch (error) {
        console.error("Lỗi parse JSON:", error.message);
        setError("Ghi chú cuộc họp không hợp lệ. Hiển thị dưới dạng văn bản.");
        setNote(noteItem.content);
        setMeetingForm({ agenda: "", attendees: "", actionItems: "" });
        setStudyForm({ topic: "", keyPoints: "", questions: "" });
        setDailyForm({ availableTime: "", mood: "", priorities: "" });
      }
    } else if (noteItem.template === "study") {
      try {
        const parsedContent = JSON.parse(noteItem.content);
        setStudyForm({
          topic: parsedContent.topic || "",
          keyPoints: parsedContent.keyPoints || "",
          questions: parsedContent.questions || "",
        });
        setMeetingForm({ agenda: "", attendees: "", actionItems: "" });
        setDailyForm({ availableTime: "", mood: "", priorities: "" });
        setNote("");
      } catch (error) {
        console.error("Lỗi parse JSON:", error.message);
        setError("Ghi chú học tập không hợp lệ. Hiển thị dưới dạng văn bản.");
        setNote(noteItem.content);
        setStudyForm({ topic: "", keyPoints: "", questions: "" });
        setMeetingForm({ agenda: "", attendees: "", actionItems: "" });
        setDailyForm({ availableTime: "", mood: "", priorities: "" });
      }
    } else if (noteItem.template === "daily") {
      try {
        const parsedContent = JSON.parse(noteItem.content);
        setDailyForm({
          availableTime: parsedContent.availableTime || "",
          mood: parsedContent.mood || "",
          priorities: parsedContent.priorities || "",
        });
        setMeetingForm({ agenda: "", attendees: "", actionItems: "" });
        setStudyForm({ topic: "", keyPoints: "", questions: "" });
        setNote("");
      } catch (error) {
        console.error("Lỗi parse JSON:", error.message);
        setError("Ghi chú kế hoạch không hợp lệ. Hiển thị dưới dạng văn bản.");
        setNote(noteItem.content);
        setDailyForm({ availableTime: "", mood: "", priorities: "" });
        setMeetingForm({ agenda: "", attendees: "", actionItems: "" });
        setStudyForm({ topic: "", keyPoints: "", questions: "" });
      }
    } else {
      setNote(noteItem.content);
      setMeetingForm({ agenda: "", attendees: "", actionItems: "" });
      setStudyForm({ topic: "", keyPoints: "", questions: "" });
      setDailyForm({ availableTime: "", mood: "", priorities: "" });
    }
  };

  const handleSuggestionClick = (type, value) => {
    if (type === "title") {
      setTitle(value);
    } else if (noteTemplate === "freeform" && (type === "idea" || type === "expanded" || type === "tip")) {
      setNote(value);
    } else if (noteTemplate === "meeting") {
      if (type === "agendaItem") {
        setMeetingForm((prev) => ({
          ...prev,
          agenda: prev.agenda ? `${prev.agenda}\n${value.text} (${value.time})` : `${value.text} (${value.time})`,
        }));
      } else if (type === "actionItem") {
        setMeetingForm((prev) => ({
          ...prev,
          actionItems: prev.actionItems
            ? `${prev.actionItems}\n${value.text} (Owner: ${value.owner}, Due: ${value.deadline})`
            : `${value.text} (Owner: ${value.owner}, Due: ${value.deadline})`,
        }));
      } else if (type === "participant") {
        setMeetingForm((prev) => ({
          ...prev,
          attendees: prev.attendees
            ? `${prev.attendees}\n${value.name} (${value.role}: ${value.issueAddressed})`
            : `${value.name} (${value.role}: ${value.issueAddressed})`,
        }));
      }
    } else if (noteTemplate === "study") {
      if (type === "flashcard") {
        setStudyForm((prev) => ({
          ...prev,
          questions: prev.questions
            ? `${prev.questions}\n${value.question}: ${value.answer}`
            : `${value.question}: ${value.answer}`,
        }));
      } else if (type === "quizQuestion") {
        setStudyForm((prev) => ({
          ...prev,
          questions: prev.questions
            ? `${prev.questions}\n${value.question} (Options: ${value.options.join(", ")}; Answer: ${value.answer})`
            : `${value.question} (Options: ${value.options.join(", ")}; Answer: ${value.answer})`,
        }));
      } else if (type === "keyConcept") {
        setStudyForm((prev) => ({
          ...prev,
          keyPoints: prev.keyPoints ? `${prev.keyPoints}\n${value}` : value,
        }));
      }
    } else if (noteTemplate === "daily") {
      if (type === "relaxationActivity" || type === "productivityTask" || type === "selfCareIdea") {
        setDailyForm((prev) => ({
          ...prev,
          priorities: prev.priorities
            ? `${prev.priorities}\n${value.text}${value.duration ? ` (${value.duration})` : value.priority ? ` (Priority: ${value.priority})` : ""}`
            : `${value.text}${value.duration ? ` (${value.duration})` : value.priority ? ` (Priority: ${value.priority})` : ""}`,
        }));
      } else if (type === "motivationalMessage") {
        setDailyForm((prev) => ({
          ...prev,
          priorities: prev.priorities ? `${prev.priorities}\n[Note]: ${value}` : `[Note]: ${value}`,
        }));
      }
    }
  };

  const handleEmojiSelect = (emoji) => {
    setDailyForm((prev) => ({
      ...prev,
      mood: prev.mood ? `${prev.mood} ${emoji}` : emoji,
    }));
    setShowEmojiPicker(false);
  };

  const handleViewSavedNotes = () => {
    if (savedNotesRef.current) {
      savedNotesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleMeetingFormChange = (field, value) => {
    setMeetingForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleStudyFormChange = (field, value) => {
    setStudyForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDailyFormChange = (field, value) => {
    setDailyForm((prev) => ({ ...prev, [field]: value }));
  };

  const renderMeetingNoteContent = (content) => {
    try {
      const parsed = JSON.parse(content);
      return (
        <div className="space-y-2">
          {parsed.agenda && <p><strong>Chương trình nghị sự:</strong> {parsed.agenda}</p>}
          {parsed.attendees && <p><strong>Thành phần tham dự:</strong> {parsed.attendees}</p>}
          {parsed.actionItems && <p><strong>Hành động cần thực hiện:</strong> {parsed.actionItems}</p>}
        </div>
      );
    } catch {
      return <p>{content}</p>;
    }
  };

  const renderStudyNoteContent = (content) => {
    try {
      const parsed = JSON.parse(content);
      return (
        <div className="space-y-2">
          {parsed.topic && <p><strong>Chủ đề:</strong> {parsed.topic}</p>}
          {parsed.keyPoints && <p><strong>Điểm chính:</strong> {parsed.keyPoints}</p>}
          {parsed.questions && <p><strong>Câu hỏi ôn tập:</strong> {parsed.questions}</p>}
        </div>
      );
    } catch {
      return <p>{content}</p>;
    }
  };

  const renderDailyNoteContent = (content) => {
    try {
      const parsed = JSON.parse(content);
      return (
        <div className="space-y-2">
          {parsed.availableTime && <p><strong>Thời gian rảnh:</strong> {parsed.availableTime}</p>}
          {parsed.mood && <p><strong>Tâm trạng:</strong> {parsed.mood}</p>}
          {parsed.priorities && <p><strong>Ưu tiên:</strong> {parsed.priorities}</p>}
        </div>
      );
    } catch {
      return <p>{content}</p>;
    }
  };

  return (
    <div
      className="mt-[97px] p-5 mb-[-7px] min-h-screen rounded-xl"
      style={{ background: "var(--background)", color: "var(--text-color)" }}
    >
      <div className="container mx-auto w-full">
        <div
          className="rounded-xl shadow-2xl p-8 transform transition-all duration-300"
          style={{
            background: "var(--background)",
            border: "1px solid var(--border-color)",
          }}
        >
          <h1
            className="text-4xl font-extrabold text-center mb-8"
            style={{ color: "var(--accent-color)" }}
          >
            BlogNote - Ghi Chú Thông Minh
          </h1>

          <div className="flex justify-end mb-6">
            <button
              onClick={handleViewSavedNotes}
              className="inline-flex items-center px-4 py-2 font-medium rounded-lg transition-all duration-200"
              style={{
                color: "var(--accent-color)",
                background: "var(--background)",
                border: "1px solid var(--border-color)",
              }}
            >
              <span>Xem danh sách ghi chú</span>
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <label
              className="block text-lg font-semibold mb-2"
              style={{ color: "var(--text-color)" }}
            >
              Chọn ngôn ngữ gợi ý
            </label>
            <select
              className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                background: "var(--background)",
                color: "var(--text-color)",
                border: "1px solid var(--border-color)",
                focusRingColor: "var(--accent-color)",
              }}
            >
              {languages.map(({ code, label }) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label
              className="block text-lg font-semibold mb-2"
              style={{ color: "var(--text-color)" }}
            >
              Chọn loại ghi chú
            </label>
            <select
              className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
              value={noteTemplate}
              onChange={(e) => setNoteTemplate(e.target.value)}
              style={{
                background: "var(--background)",
                color: "var(--text-color)",
                border: "1px solid var(--border-color)",
                focusRingColor: "var(--accent-color)",
              }}
            >
              {Object.entries(templates).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4 mb-8">
            <input
              type="text"
              className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
              placeholder="Tiêu đề ghi chú..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                background: "var(--background)",
                color: "var(--text-color)",
                border: "1px solid var(--border-color)",
                focusRingColor: "var(--accent-color)",
              }}
            />
            {noteTemplate === "freeform" ? (
              <textarea
                className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 resize-y transition-all duration-200"
                rows="6"
                placeholder="Viết ghi chú của bạn..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{
                  background: "var(--background)",
                  color: "var(--text-color)",
                  border: "1px solid var(--border-color)",
                  focusRingColor: "var(--accent-color)",
                }}
              />
            ) : noteTemplate === "meeting" ? (
              <div className="space-y-4">
                {templates.meeting.fields.map((field) => (
                  <div key={field.id}>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "var(--text-color)" }}
                    >
                      {field.label}
                    </label>
                    <textarea
                      className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 resize-y transition-all duration-200"
                      rows={field.rows}
                      placeholder={`Nhập ${field.label.toLowerCase()}...`}
                      value={meetingForm[field.id]}
                      onChange={(e) => handleMeetingFormChange(field.id, e.target.value)}
                      style={{
                        background: "var(--background)",
                        color: "var(--text-color)",
                        border: "1px solid var(--border-color)",
                        focusRingColor: "var(--accent-color)",
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : noteTemplate === "study" ? (
              <div className="space-y-4">
                {templates.study.fields.map((field) => (
                  <div key={field.id}>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "var(--text-color)" }}
                    >
                      {field.label}
                    </label>
                    {field.type === "text" ? (
                      <input
                        type="text"
                        className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
                        placeholder={`Nhập ${field.label.toLowerCase()}...`}
                        value={studyForm[field.id]}
                        onChange={(e) => handleStudyFormChange(field.id, e.target.value)}
                        style={{
                          background: "var(--background)",
                          color: "var(--text-color)",
                          border: "1px solid var(--border-color)",
                          focusRingColor: "var(--accent-color)",
                        }}
                      />
                    ) : (
                      <textarea
                        className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 resize-y transition-all duration-200"
                        rows={field.rows}
                        placeholder={`Nhập ${field.label.toLowerCase()}...`}
                        value={studyForm[field.id]}
                        onChange={(e) => handleStudyFormChange(field.id, e.target.value)}
                        style={{
                          background: "var(--background)",
                          color: "var(--text-color)",
                          border: "1px solid var(--border-color)",
                          focusRingColor: "var(--accent-color)",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {templates.daily.fields.map((field) => (
                  <div key={field.id}>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "var(--text-color)" }}
                    >
                      {field.label}
                    </label>
                    {field.id === "mood" ? (
                      <div className="relative">
                        <textarea
                          className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 resize-y transition-all duration-200"
                          rows={field.rows}
                          placeholder={`Nhập ${field.label.toLowerCase()}...`}
                          value={dailyForm[field.id]}
                          onChange={(e) => handleDailyFormChange(field.id, e.target.value)}
                          style={{
                            background: "var(--background)",
                            color: "var(--text-color)",
                            border: "1px solid var(--border-color)",
                            focusRingColor: "var(--accent-color)",
                          }}
                        />
                        <button
                          type="button"
                          className="absolute top-2 right-2 p-2 rounded-full transition-all duration-200"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          style={{
                            background: "var(--accent-color)",
                            color: "var(--background)",
                          }}
                        >
                          😊
                        </button>
                        {showEmojiPicker && (
                          <div
                            className="absolute top-12 right-0 z-10 p-4 rounded-xl shadow-md grid grid-cols-5 gap-2"
                            style={{
                              background: "var(--background)",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            {emojis.map((emoji, index) => (
                              <button
                                key={index}
                                type="button"
                                className="text-2xl p-2 rounded-full hover:bg-gray-200 transition-all duration-200"
                                onClick={() => handleEmojiSelect(emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : field.type === "text" ? (
                      <input
                        type="text"
                        className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
                        placeholder={`Nhập ${field.label.toLowerCase()}...`}
                        value={dailyForm[field.id]}
                        onChange={(e) => handleDailyFormChange(field.id, e.target.value)}
                        style={{
                          background: "var(--background)",
                          color: "var(--text-color)",
                          border: "1px solid var(--border-color)",
                          focusRingColor: "var(--accent-color)",
                        }}
                      />
                    ) : (
                      <textarea
                        className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 resize-y transition-all duration-200"
                        rows={field.rows}
                        placeholder={`Nhập ${field.label.toLowerCase()}...`}
                        value={dailyForm[field.id]}
                        onChange={(e) => handleDailyFormChange(field.id, e.target.value)}
                        style={{
                          background: "var(--background)",
                          color: "var(--text-color)",
                          border: "1px solid var(--border-color)",
                          focusRingColor: "var(--accent-color)",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 mb-8">
            <button
              className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md ${
                isLoading ? "cursor-not-allowed" : ""
              }`}
              onClick={handleGenerate}
              disabled={isLoading}
              style={{
                background: isLoading ? "#9CA3AF" : "var(--accent-color)",
                color: "var(--background)",
                border: "1px solid var(--border-color)",
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    viewBox="0 0 24 24"
                    style={{ color: "var(--background)" }}
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                    />
                  </svg>
                  Đang tạo gợi ý...
                </div>
              ) : (
                "Tạo Gợi Ý AI"
              )}
            </button>
            <button
              className="flex-1 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md"
              onClick={handleSave}
              style={{
                background: "var(--accent-color)",
                color: "var(--background)",
                border: "1px solid var(--border-color)",
              }}
            >
              Lưu Ghi Chú
            </button>
          </div>

          {error && (
            <div
              className="mb-8 p-4 rounded-xl shadow-md transition-all duration-200"
              style={{
                background: "#FEF2F2",
                color: "#DC2626",
                border: "1px solid var(--border-color)",
              }}
            >
              {error}
            </div>
          )}

          {suggestions && (
            <div className="grid gap-6 mb-8">
              {noteTemplate === "freeform" ? (
                <>
                  <div
                    className="p-6 rounded-xl shadow-md transition-all duration-200"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: "var(--text-color)" }}
                    >
                      Tiêu đề gợi ý
                    </h2>
                    <ul className="space-y-2">
                      {suggestions.titles?.map((title, index) => (
                        <li
                          key={index}
                          className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                          onClick={() => handleSuggestionClick("title", title)}
                          style={{
                            background: "var(--background)",
                            color: "var(--text-color)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {title}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className="p-6 rounded-xl shadow-md transition-all duration-200"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: "var(--text-color)" }}
                    >
                      Ý tưởng phát triển
                    </h2>
                    <ul className="space-y-2">
                      {suggestions.ideas?.map((idea, index) => (
                        <li
                          key={index}
                          className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                          onClick={() => handleSuggestionClick("idea", idea)}
                          style={{
                            background: "var(--background)",
                            color: "var(--text-color)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {idea}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className="p-6 rounded-xl shadow-md transition-all duration-200"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: "var(--text-color)" }}
                    >
                      Mở rộng bài viết
                    </h2>
                    <p
                      className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                      onClick={() => handleSuggestionClick("expanded", suggestions.expanded)}
                      style={{
                        background: "var(--background)",
                        color: "var(--text-color)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      {suggestions.expanded}
                    </p>
                  </div>
                  <div
                    className="p-6 rounded-xl shadow-md transition-all duration-200"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: "var(--text-color)" }}
                    >
                      Mẹo ghi chú hiệu quả
                    </h2>
                    <ul className="space-y-2">
                      {suggestions.tips?.map((tip, index) => (
                        <li
                          key={index}
                          className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                          onClick={() => handleSuggestionClick("tip", tip)}
                          style={{
                            background: "var(--background)",
                            color: "var(--text-color)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : noteTemplate === "meeting" ? (
                <>
                  <div
                    className="p-6 rounded-xl shadow-md transition-all duration-200"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: "var(--text-color)" }}
                    >
                      Gợi ý chương trình nghị sự tối ưu
                    </h2>
                    <ul className="space-y-2">
                      {suggestions.agendaItems?.map((item, index) => (
                        <li
                          key={index}
                          className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                          onClick={() => handleSuggestionClick("agendaItem", item)}
                          style={{
                            background: "var(--background)",
                            color: "var(--text-color)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {item.text} ({item.time})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className="p-6 rounded-xl shadow-md transition-all duration-200"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: "var(--text-color)" }}
                    >
                      Gợi ý hành động ưu tiên
                    </h2>
                    <ul className="space-y-2">
                      {suggestions.actionItems?.map((item, index) => (
                        <li
                          key={index}
                          className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                          onClick={() => handleSuggestionClick("actionItem", item)}
                          style={{
                            background: "var(--background)",
                            color: "var(--text-color)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {item.text} (Chủ sở hữu: {item.owner}, Hạn chót: {item.deadline})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className="p-6 rounded-xl shadow-md transition-all duration-200"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: "var(--text-color)" }}
                    >
                      Gợi ý thành phần tham dự
                    </h2>
                    <ul className="space-y-2">
                      {suggestions.participants?.map((participant, index) => (
                        <li
                          key={index}
                          className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                          onClick={() => handleSuggestionClick("participant", participant)}
                          style={{
                            background: "var(--background)",
                            color: "var(--text-color)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {participant.name} ({participant.role}: {participant.issueAddressed})
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : noteTemplate === "study" ? (
                <>
                  <div
                    className="p-6 rounded-xl shadow-md transition-all duration-200"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: "var(--text-color)" }}
                    >
                      Gợi ý thẻ flashcard
                    </h2>
                    <ul className="space-y-2">
                      {suggestions.flashcards?.map((card, index) => (
                        <li
                          key={index}
                          className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                          onClick={() => handleSuggestionClick("flashcard", card)}
                          style={{
                            background: "var(--background)",
                            color: "var(--text-color)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {card.question}: {card.answer}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className="p-6 rounded-xl shadow-md transition-all duration-200"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: "var(--text-color)" }}
                    >
                      Gợi ý câu hỏi trắc nghiệm
                    </h2>
                    <ul className="space-y-2">
                      {suggestions.quizQuestions?.map((quiz, index) => (
                        <li
                          key={index}
                          className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                          onClick={() => handleSuggestionClick("quizQuestion", quiz)}
                          style={{
                            background: "var(--background)",
                            color: "var(--text-color)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {quiz.question} (Đáp án: {quiz.answer})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className="p-6 rounded-xl shadow-md transition-all duration-200"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: "var(--text-color)" }}
                    >
                      Gợi ý khái niệm chính
                    </h2>
                    <ul className="space-y-2">
                      {suggestions.keyConcepts?.map((concept, index) => (
                        <li
                          key={index}
                          className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                          onClick={() => handleSuggestionClick("keyConcept", concept)}
                          style={{
                            background: "var(--background)",
                            color: "var(--text-color)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {concept}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="p-6 rounded-xl shadow-md transition-all duration-200"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: "var(--text-color)" }}
                    >
                      Gợi ý hoạt động thư giãn
                    </h2>
                    <ul className="space-y-2">
                      {suggestions.relaxationActivities?.map((activity, index) => (
                        <li
                          key={index}
                          className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                          onClick={() => handleSuggestionClick("relaxationActivity", activity)}
                          style={{
                            background: "var(--background)",
                            color: "var(--text-color)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {activity.text} ({activity.duration})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className="p-6 rounded-xl shadow-md transition-all duration-200"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: "var(--text-color)" }}
                    >
                      Gợi ý công việc hiệu quả
                    </h2>
                    <ul className="space-y-2">
                      {suggestions.productivityTasks?.map((task, index) => (
                        <li
                          key={index}
                          className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                          onClick={() => handleSuggestionClick("productivityTask", task)}
                          style={{
                            background: "var(--background)",
                            color: "var(--text-color)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {task.text} (Ưu tiên: {task.priority})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className="p-6 rounded-xl shadow-md transition-all duration-200"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: "var(--text-color)" }}
                    >
                      Gợi ý chăm sóc bản thân
                    </h2>
                    <ul className="space-y-2">
                      {suggestions.selfCareIdeas?.map((idea, index) => (
                        <li
                          key={index}
                          className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                          onClick={() => handleSuggestionClick("selfCareIdea", idea)}
                          style={{
                            background: "var(--background)",
                            color: "var(--text-color)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {idea.text} ({idea.duration})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className="p-6 rounded-xl shadow-md transition-all duration-200"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: "var(--text-color)" }}
                    >
                      Lời động viên
                    </h2>
                    <ul className="space-y-2">
                      {suggestions.motivationalMessages?.map((message, index) => (
                        <li
                          key={index}
                          className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                          onClick={() => handleSuggestionClick("motivationalMessage", message)}
                          style={{
                            background: "var(--background)",
                            color: "var(--text-color)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="mb-8">
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: "var(--text-color)" }}
            >
              Tìm Kiếm Ghi Chú
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Nhập từ khóa hoặc tag..."
                className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: "var(--background)",
                  color: "var(--text-color)",
                  border: "1px solid var(--border-color)",
                  focusRingColor: "var(--accent-color)",
                }}
              />
              <select
                className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                style={{
                  background: "var(--background)",
                  color: "var(--text-color)",
                  border: "1px solid var(--border-color)",
                  focusRingColor: "var(--accent-color)",
                }}
              >
                {classifications.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
            <div
              className="mt-4 p-6 rounded-xl shadow-md"
              style={{
                background: "var(--background)",
                border: "1px solid var(--border-color)",
              }}
            >
              {search ? (
                <div>
                  <p className="mb-4" style={{ color: "var(--text-color)" }}>
                    Kết quả tìm kiếm: <strong>{search}</strong> (Phân loại: <strong>{classification}</strong>)
                  </p>
                  {filteredNotes.length > 0 ? (
                    <ul className="space-y-2">
                      {filteredNotes.map((note) => (
                        <li
                          key={note.id}
                          className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                          onClick={() => handleNoteClick(note)}
                          style={{
                            background: "var(--background)",
                            color: "var(--text-color)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {note.title}{" "}
                          <span style={{ color: "#9CA3AF" }}>({note.classification})</span>
                          {note.tags && (
                            <p className="text-sm" style={{ color: "#9CA3AF" }}>
                              Tags: {note.tags.join(", ")}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: "var(--text-color)" }}>
                      Không tìm thấy ghi chú nào.
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ color: "var(--text-color)" }}>
                  Nhập từ khóa hoặc tag để tìm kiếm...
                </p>
              )}
            </div>
          </div>

          {savedNotes.length > 0 && (
            <div
              ref={savedNotesRef}
              className="p-6 rounded-xl shadow-md"
              style={{
                background: "var(--background)",
                border: "1px solid var(--border-color)",
              }}
            >
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: "var(--text-color)" }}
              >
                Ghi Chú Đã Lưu
              </h2>
              <ul className="space-y-2">
                {savedNotes.map((noteItem) => (
                  <li
                    key={noteItem.id}
                    className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                    onClick={() => handleNoteClick(noteItem)}
                    style={{
                      background: "var(--background)",
                      color: "var(--text-color)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <div className="flex justify-between">
                      <span>{noteItem.title}</span>
                      <span style={{ color: "#9CA3AF" }}>
                        {new Date(noteItem.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-color)" }}>
                      {noteItem.classification} {noteItem.template && `(${templates[noteItem.template].label})`}
                    </p>
                    {noteItem.tags && (
                      <p className="text-sm" style={{ color: "#9CA3AF" }}>
                        Tags: {noteItem.tags.join(", ")}
                      </p>
                    )}
                    {noteItem.template === "meeting" ? (
                      renderMeetingNoteContent(noteItem.content)
                    ) : noteItem.template === "study" ? (
                      renderStudyNoteContent(noteItem.content)
                    ) : noteItem.template === "daily" ? (
                      renderDailyNoteContent(noteItem.content)
                    ) : (
                      <p className="text-sm" style={{ color: "var(--text-color)" }}>
                        {noteItem.content.substring(0, 100)}...
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <ThemeSettings />
    </div>
  );
}