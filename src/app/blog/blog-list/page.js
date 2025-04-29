"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  MessageOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  ApartmentOutlined,
  SaveOutlined,
  FileWordOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dynamic from "next/dynamic";
import { supabase } from "../../../lib/supabase";
import ThemeSelector, { themes, getThemeClasses } from "../../../utils/color";
import ScrollToTop from "../../../utils/scroll";
import Notification from "../../../utils/notification";
import Confirm from "../../../utils/error";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <p className="text-red-500 text-base">
          Error: {this.state.error.message} (Component:{" "}
          {this.props.componentName})
        </p>
      );
    }
    return this.props.children;
  }
}

// Dynamically import components
const ForceGraph2D = dynamic(
  () => import("react-force-graph").then((mod) => mod.ForceGraph2D),
  {
    ssr: false,
    loading: () => <p className="text-gray-600 text-base">Loading graph...</p>,
  }
);

const Emoji = dynamic(() => import("../emoji/page"), {
  ssr: false,
  loading: () => (
    <div className="text-gray-600 text-base">Loading emojis...</div>
  ),
});

const Sticker = dynamic(() => import("../stickers/page"), {
  ssr: false,
  loading: () => (
    <div className="text-gray-600 text-base">Loading stickers...</div>
  ),
});

export default function BloglistApp() {
  const [theme, setTheme] = useState("light");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCommentsForArticle, setShowCommentsForArticle] = useState(null);
  const [showDiagramForArticle, setShowDiagramForArticle] = useState(null);
  const [comments, setComments] = useState({});
  const [newCommentContent, setNewCommentContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [selectedCommentStickers, setSelectedCommentStickers] = useState([]);
  const [selectedReplyStickers, setSelectedReplyStickers] = useState([]);
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentContent, setEditedCommentContent] = useState("");
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [nodeSize, setNodeSize] = useState(6);
  const [savedArticles, setSavedArticles] = useState([]);
  const [posts, setPosts] = useState([]);
  const [topAuthors, setTopAuthors] = useState([]);
  const [authorInfo, setAuthorInfo] = useState({
    name: "",
    email: "",
  });
  const [loadingStates, setLoadingStates] = useState({});
  const [exportingStates, setExportingStates] = useState({});
  const [selectedSavedArticle, setSelectedSavedArticle] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);
  const [isAFrameLoaded, setIsAFrameLoaded] = useState(false);
  const [isWriting, setIsWriting] = useState(false);

  const graphRef = useRef();
  const commentTextareaRef = useRef(null);
  const replyTextareaRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Load A-Frame via script tag
  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;

    const loadAFrame = () => {
      if (window.AFRAME) {
        console.log("A-Frame already loaded");
        setIsAFrameLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://aframe.io/releases/1.5.0/aframe.min.js";
      script.async = true;
      script.onload = () => {
        console.log("A-Frame loaded successfully");
        setIsAFrameLoaded(true);
      };
      script.onerror = () => {
        console.error("Failed to load A-Frame");
        setError(
          "Không thể tải A-Frame. Một số tính năng có thể không hoạt động."
        );
      };
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    };

    loadAFrame();
  }, [isMounted]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;

    const checkLoginStatus = async () => {
      const userData = JSON.parse(localStorage.getItem("user") || "null");
      if (userData) {
        setIsLoggedIn(true);
        setCurrentUser(userData);

        try {
          const { data: savedData, error: savedError } = await supabase
            .from("saves")
            .select("*")
            .eq("user_id", userData.id);

          if (savedError) {
            setError("Lỗi khi lấy bài viết đã lưu: " + savedError.message);
          } else {
            setSavedArticles(savedData);
          }
        } catch (error) {
          setError("Lỗi khi lấy bài viết đã lưu: " + error.message);
        }
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setSavedArticles([]);
        setComments({});
        setAuthorInfo({ name: "", email: "" });
      }
    };

    checkLoginStatus();

    const handleStorageChange = (event) => {
      if (event.key === "user" || event.key === null) {
        checkLoginStatus();
      }
    };

    const handleLogoutEvent = () => {
      checkLoginStatus();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("user-logout", handleLogoutEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-logout", handleLogoutEvent);
    };
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;

    const fetchPostsAndAuthorsAndComments = async () => {
      try {
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select(
            "id, title, content, images, files, videos, topics, tags, name, created_at"
          );

        if (postsError) {
          setError("Lỗi khi lấy bài viết: " + postsError.message);
          return;
        }

        const normalizedPosts = postsData.map((post) => ({
          ...post,
          tags: normalizeTags(post.tags),
          images: normalizeImages(post.images),
          videos: normalizeVideos(post.videos),
          files: normalizeFiles(post.files),
          author: post.name || "Chưa có tác giả",
          created_at: new Date(post.created_at).toLocaleDateString("vi-VN"),
        }));
        setPosts(normalizedPosts);

        const initialComments = {};
        normalizedPosts.forEach((post) => {
          initialComments[post.id] = [];
        });

        const { data: commentsData, error: commentsError } = await supabase
          .from("comments")
          .select(
            "id, article_id, user_id, content, updated_at, contentson, stickers"
          )
          .in(
            "article_id",
            normalizedPosts.map((post) => post.id)
          );

        if (commentsError) {
          setError("Lỗi khi lấy bình luận: " + commentsError.message);
          return;
        }

        const uniqueComments = Array.from(
          new Map(commentsData.map((comment) => [comment.id, comment])).values()
        );

        const userIds = [...new Set(uniqueComments.map((c) => c.user_id))];
        let userMap = {};
        if (userIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("id, name")
            .in("id", userIds);

          if (usersError) {
            setError("Lỗi khi lấy tên người dùng: " + usersError.message);
          } else {
            userMap = Object.fromEntries(
              usersData.map((user) => [user.id, user.name])
            );
          }
        }

        uniqueComments.forEach((comment) => {
          let replies = [];
          if (comment.contentson && typeof comment.contentson === "string") {
            try {
              replies = JSON.parse(comment.contentson);
              if (!Array.isArray(replies)) {
                replies = [];
              }
              replies = replies.map((reply) => ({
                ...reply,
                stickers: normalizeStickers(reply.stickers),
              }));
            } catch (e) {
              setError(
                `Lỗi phân tích contentson cho bình luận ${comment.id}: ` +
                  e.message
              );
              replies = [];
            }
          }

          let stickers = normalizeStickers(comment.stickers);

          initialComments[comment.article_id].push({
            id: comment.id,
            user_id: comment.user_id,
            author: userMap[comment.user_id] || "Tác giả",
            content: comment.content || "",
            replies,
            stickers,
          });
        });

        setComments(initialComments);

        const { data: authorsData, error: authorsError } = await supabase
          .from("posts")
          .select("name");

        if (authorsError) {
          setError("Lỗi khi lấy tác giả: " + authorsError.message);
        } else {
          const authorCounts = authorsData.reduce((acc, { name }) => {
            if (name) acc[name] = (acc[name] || 0) + 1;
            return acc;
          }, {});
          const sortedAuthors = Object.entries(authorCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 7)
            .map(([name]) => ({ name }));
          setTopAuthors(sortedAuthors);
        }
      } catch (error) {
        setError("Lỗi khi tải dữ liệu: " + error.message);
      }
    };

    fetchPostsAndAuthorsAndComments();
  }, [isMounted]);

  const normalizeStickers = (stickers) => {
    if (!stickers) return [];
    let result = [];
    try {
      if (typeof stickers === "string") {
        if (stickers === "[]" || stickers.trim() === "") return [];
        if (stickers.startsWith("[") && stickers.endsWith("]")) {
          try {
            const parsed = JSON.parse(stickers);
            result = Array.isArray(parsed) ? parsed : [stickers];
          } catch {
            result = stickers.split(",").map((url) => url.trim());
          }
        } else {
          result = stickers.split(",").map((url) => url.trim());
        }
      } else if (Array.isArray(stickers)) {
        result = stickers;
      }
      return result
        .filter((url) => {
          if (!url || typeof url !== "string") return false;
          try {
            new URL(url);
            return url.startsWith("http://") || url.startsWith("https://");
          } catch {
            return false;
          }
        })
        .map((url) => url.trim());
    } catch (e) {
      return [];
    }
  };

  const normalizeTags = (tags) => {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === "string")
      return tags.split(",").map((tag) => tag.trim());
    return [];
  };

  const normalizeImages = (images) => {
    if (typeof images === "string" && images.startsWith("http")) return images;
    if (Array.isArray(images) && images.length > 0) return images[0];
    if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
      } catch {
        return null;
      }
    }
    return null;
  };

  const normalizeVideos = (videos) => {
    if (typeof videos === "string" && videos.startsWith("http")) return videos;
    return null;
  };

  const normalizeFiles = (files) => {
    if (typeof files === "string" && files.startsWith("http")) return files;
    return null;
  };

  const handlePostClick = async (post) => {
    if (!isMounted) return;

    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("name, email")
        .eq("name", post.author)
        .single();

      if (error) {
        setAuthorInfo({
          name: post.author,
          email: "Không có",
        });
      } else {
        setAuthorInfo({
          name: userData.name || post.author,
          email: userData.email || "Không có",
        });
      }
    } catch (error) {
      setAuthorInfo({
        name: post.author,
        email: "Không có",
      });
    }
  };

  const handleSearchChange = (event) => {
    if (!isMounted) return;
    setSearchTerm(event.target.value);
  };

  const toggleComments = (articleId) => {
    if (!isLoggedIn || !isMounted) return;
    if (showCommentsForArticle !== articleId) {
      setLoadingStates((prev) => ({ ...prev, [articleId]: true }));
      setTimeout(() => {
        setShowCommentsForArticle(articleId);
        setLoadingStates((prev) => ({ ...prev, [articleId]: false }));
      }, 500);
    } else {
      setShowCommentsForArticle(null);
    }
    setReplyContent("");
    setReplyToCommentId(null);
    setNewCommentContent("");
    setSelectedCommentStickers([]);
    setSelectedReplyStickers([]);
    setEditingCommentId(null);
  };

  const toggleDiagram = (articleId) => {
    if (!isLoggedIn || !isMounted) return;
    if (showDiagramForArticle !== articleId) {
      setLoadingStates((prev) => ({ ...prev, [articleId]: true }));
      setTimeout(() => {
        setShowDiagramForArticle(articleId);
        setLoadingStates((prev) => ({ ...prev, [articleId]: false }));
      }, 500);
    } else {
      setShowDiagramForArticle(null);
    }
  };

  const handleNewCommentChange = (event) => {
    if (!isMounted) return;
    setNewCommentContent(event.target.value);
  };

  const handleReplyChange = (event) => {
    if (!isMounted) return;
    setReplyContent(event.target.value);
  };
  const insertEmojiAtCursor = (textareaRef, emoji, isReply = false) => {
    if (!isMounted || typeof window === "undefined" || !textareaRef.current)
      return;

    const textarea = textareaRef.current;
    const scrollContainer = scrollContainerRef.current;

    // Lưu vị trí cuộn và tiêu điểm
    const scrollPosition = scrollContainer
      ? scrollContainer.scrollTop
      : window.scrollY;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const text = textarea.value || "";
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + emoji + after;

    // Cập nhật state đồng bộ
    if (isReply) {
      setReplyContent(newText);
    } else {
      setNewCommentContent(newText);
    }

    // Duy trì tiêu điểm và vị trí con trỏ
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;

      // Khôi phục vị trí cuộn
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollPosition;
      } else {
        window.scrollTo(0, scrollPosition);
      }
    });
  };

  const handleEmojiSelect = (emoji, isReply = false) => {
    if (!isMounted) return;
    insertEmojiAtCursor(
      isReply ? replyTextareaRef : commentTextareaRef,
      emoji,
      isReply
    );
  };

  const handleStickerSelect = (url, isReply = false) => {
    if (!isMounted || !url) return;
    try {
      const stickerUrl = Array.isArray(url) && url.length === 1 ? url[0] : url;
      if (typeof stickerUrl !== "string") return;
      new URL(stickerUrl);
      if (
        !stickerUrl.startsWith("http://") &&
        !stickerUrl.startsWith("https://")
      )
        return;
      if (isReply) {
        setSelectedReplyStickers((prev) => [...prev, stickerUrl]);
      } else {
        setSelectedCommentStickers((prev) => [...prev, stickerUrl]);
      }
    } catch (e) {
      // Handle invalid URL silently
    }
  };

  const handleRemoveSticker = (url, isReply = false) => {
    if (isReply) {
      setSelectedReplyStickers((prev) =>
        prev.filter((sticker) => sticker !== url)
      );
    } else {
      setSelectedCommentStickers((prev) =>
        prev.filter((sticker) => sticker !== url)
      );
    }
  };

  const submitComment = async (articleId) => {
    if (!isLoggedIn || !currentUser || !isMounted) return;
    if (!newCommentContent.trim() && selectedCommentStickers.length === 0)
      return;

    const newComment = {
      article_id: articleId,
      user_id: currentUser.id,
      content: newCommentContent,
      updated_at: new Date().toISOString(),
      contentson: JSON.stringify([]),
      stickers: selectedCommentStickers.join(","),
    };

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert([newComment])
        .select();

      if (error) {
        setError("Lỗi khi gửi bình luận: " + error.message);
        return;
      }

      setComments((prev) => ({
        ...prev,
        [articleId]: [
          ...(prev[articleId] || []),
          {
            id: data[0].id,
            user_id: currentUser.id,
            author: currentUser.name || "Tác giả",
            content: newComment.content,
            replies: [],
            stickers: selectedCommentStickers,
          },
        ],
      }));
      setNewCommentContent("");
      setSelectedCommentStickers([]);
      setNotification({
        message: "Bình luận đã được gửi thành công!",
        type: "success",
      });
    } catch (error) {
      setError("Lỗi khi gửi bình luận: " + error.message);
    }
  };

  const submitReply = async (articleId, commentId) => {
    if (!isLoggedIn || !currentUser || !isMounted) return;
    if (!replyContent.trim() && selectedReplyStickers.length === 0) return;

    const newReply = {
      id: Date.now(),
      user_id: currentUser.id,
      author: currentUser.name || "Tác giả",
      content: replyContent,
      stickers: selectedReplyStickers,
    };

    try {
      const { data: commentData, error: fetchError } = await supabase
        .from("comments")
        .select("contentson")
        .eq("id", commentId)
        .single();

      if (fetchError) {
        setError("Lỗi khi lấy bình luận để phản hồi: " + fetchError.message);
        return;
      }

      let currentReplies = [];
      if (
        commentData.contentson &&
        typeof commentData.contentson === "string"
      ) {
        try {
          currentReplies = JSON.parse(commentData.contentson);
          if (!Array.isArray(currentReplies)) {
            currentReplies = [];
          }
        } catch (e) {
          setError(
            `Lỗi phân tích contentson cho bình luận ${commentId}: ` + e.message
          );
          currentReplies = [];
        }
      }

      const updatedReplies = [...currentReplies, newReply];

      const { error: updateError } = await supabase
        .from("comments")
        .update({ contentson: JSON.stringify(updatedReplies) })
        .eq("id", commentId)
        .eq("user_id", currentUser.id);

      if (updateError) {
        setError("Lỗi khi lưu phản hồi: " + updateError.message);
        return;
      }

      setComments((prev) => ({
        ...prev,
        [articleId]: prev[articleId].map((comment) =>
          comment.id === commentId
            ? { ...comment, replies: updatedReplies }
            : comment
        ),
      }));
      setReplyContent("");
      setSelectedReplyStickers([]);
      setReplyToCommentId(null);
      setNotification({
        message: "Phản hồi đã được gửi thành công!",
        type: "success",
      });
    } catch (error) {
      setError("Lỗi khi gửi phản hồi: " + error.message);
    }
  };

  const deleteComment = async (articleId, commentId) => {
    if (!isLoggedIn || !currentUser || !isMounted) return;

    setError({
      message: "Bạn có chắc muốn xóa bình luận này không?",
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from("comments")
            .delete()
            .eq("id", commentId)
            .eq("user_id", currentUser.id);

          if (error) {
            setError("Lỗi khi xóa bình luận: " + error.message);
            return;
          }

          setComments((prev) => ({
            ...prev,
            [articleId]: prev[articleId].filter(
              (comment) => comment.id !== commentId
            ),
          }));
          setNotification({
            message: "Bình luận đã được xóa thành công!",
            type: "success",
          });
        } catch (error) {
          setError("Lỗi khi xóa bình luận: " + error.message);
        }
        setError(null);
      },
      onCancel: () => setError(null),
    });
  };

  const startEditingComment = (comment) => {
    if (!isMounted) return;
    setEditingCommentId(comment.id);
    setEditedCommentContent(comment.content);
  };

  const cancelEditing = () => {
    if (!isMounted) return;
    setEditingCommentId(null);
    setEditedCommentContent("");
  };

  const saveEditedComment = async (articleId, commentId) => {
    if (!isLoggedIn || !currentUser || !isMounted) return;
    if (!editedCommentContent.trim()) return;

    try {
      const { error } = await supabase
        .from("comments")
        .update({
          content: editedCommentContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", commentId)
        .eq("user_id", currentUser.id);

      if (error) {
        setError("Lỗi khi cập nhật bình luận: " + error.message);
        return;
      }

      setComments((prev) => ({
        ...prev,
        [articleId]: prev[articleId].map((comment) =>
          comment.id === commentId
            ? { ...comment, content: editedCommentContent }
            : comment
        ),
      }));
      setEditingCommentId(null);
      setEditedCommentContent("");
      setNotification({
        message: "Bình luận đã được chỉnh sửa thành công!",
        type: "success",
      });
    } catch (error) {
      setError("Lỗi khi lưu bình luận đã chỉnh sửa: " + error.message);
    }
  };

  const saveArticle = async (article) => {
    if (!isLoggedIn || !currentUser || !isMounted) return;
    if (savedArticles.some((saved) => saved.article_id === article.id)) return;

    const savedArticleEntry = {
      user_id: currentUser.id,
      name: currentUser.name || "Tác giả",
      article_id: article.id,
      title: article.title,
      content: article.content,
      author: article.author,
      tags: article.tags,
    };

    try {
      const { data, error } = await supabase
        .from("saves")
        .insert([savedArticleEntry])
        .select();

      if (error) {
        setError("Lỗi khi lưu bài viết: " + error.message);
        return;
      }

      setSavedArticles((prev) => [...prev, data[0]]);
      setNotification({
        message: "Bài viết đã được lưu thành công!",
        type: "success",
      });
    } catch (error) {
      setError("Lỗi khi lưu bài viết: " + error.message);
    }
  };

  const deleteSavedArticle = async (saveId) => {
    if (!isLoggedIn || !currentUser || !isMounted) return;

    try {
      const { error } = await supabase
        .from("saves")
        .delete()
        .eq("id", saveId)
        .eq("user_id", currentUser.id);

      if (error) {
        setError("Lỗi khi xóa bài viết đã lưu: " + error.message);
        return;
      }

      setSavedArticles((prev) =>
        prev.filter((article) => article.id !== saveId)
      );
      setNotification({
        message: "Bài viết đã được xóa khỏi danh sách lưu!",
        type: "success",
      });
    } catch (error) {
      setError("Lỗi khi xóa bài viết đã lưu: " + error.message);
    }
  };

  const resettingDiagram = () => {
    if (!isMounted) return;
    setNodeSize(6);
    if (graphRef.current) {
      graphRef.current.zoomToFit(300);
    }
  };

  const reloadDiagram = () => {
    if (!isMounted) return;
    if (showDiagramForArticle) {
      setLoadingStates((prev) => ({ ...prev, [showDiagramForArticle]: true }));
      setTimeout(() => {
        const nodes = [{ id: "center", name: "Bài viết", group: 0 }];
        const links = [];
        const articleComments = comments[showDiagramForArticle] || [];

        articleComments.forEach((comment) => {
          nodes.push({
            id: `comment-${comment.id}`,
            name: comment.author,
            group: 1,
          });
          links.push({
            source: "center",
            target: `comment-${comment.id}`,
          });

          if (Array.isArray(comment.replies)) {
            comment.replies.forEach((reply) => {
              nodes.push({
                id: `reply-${reply.id}`,
                name: reply.author,
                group: 2,
              });
              links.push({
                source: `comment-${comment.id}`,
                target: `reply-${reply.id}`,
              });
            });
          }
        });

        setGraphData({ nodes, links });
        setNodeSize(6);
        if (graphRef.current) {
          graphRef.current.zoomToFit(300);
        }
        setLoadingStates((prev) => ({
          ...prev,
          [showDiagramForArticle]: false,
        }));
      }, 500);
    }
  };

  const exportToWord = async (articleId) => {
    if (!isMounted || typeof window === "undefined") return;

    setExportingStates((prev) => ({ ...prev, [articleId]: true }));
    try {
      const { Document, Packer, Paragraph, TextRun } = await import("docx");
      const article = posts.find((a) => a.id === articleId);
      const articleComments = comments[articleId] || [];

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: article.title,
                    bold: true,
                    size: 32,
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Nội dung: ${article.content}`,
                    size: 24,
                  }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Chủ đề: ${article.topics || "Không có"}`,
                    size: 24,
                  }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Tags: ${article.tags.join(", ") || "Không có"}`,
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Bình luận:",
                    bold: true,
                    size: 28,
                  }),
                ],
                spacing: { after: 200 },
              }),
              ...articleComments.flatMap((comment) => [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${comment.author}: ${comment.content}`,
                      size: 24,
                    }),
                  ],
                  spacing: { after: 100 },
                }),
                ...(Array.isArray(comment.replies) && comment.replies.length > 0
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Phản hồi:",
                            italics: true,
                            size: 20,
                          }),
                        ],
                        indent: { left: 400 },
                        spacing: { after: 100 },
                      }),
                      ...comment.replies.map(
                        (reply) =>
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `${reply.author}: ${reply.content}`,
                                size: 20,
                              }),
                            ],
                            indent: { left: 400 },
                            spacing: { after: 100 },
                          })
                      ),
                    ]
                  : []),
              ]),
            ],
          },
        ],
      });

      const buffer = await Packer.toBlob(doc);
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      let saved = false;

      try {
        if (window.showSaveFilePicker) {
          const handle = await window.showSaveFilePicker({
            suggestedName: `${article.title}.docx`,
            types: [
              {
                description: "Word Document",
                accept: {
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                    [".docx"],
                },
              },
            ],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          saved = true;
        } else {
          const { saveAs } = await import("file-saver");
          saveAs(blob, `${article.title}.docx`);
          saved = true;
        }

        if (saved) {
          setNotification({
            message: "Xuất file Word thành công!",
            type: "success",
          });
        }
      } catch (pickerError) {
        if (pickerError.name === "AbortError") {
          setNotification({
            message: "Xuất file Word thất bại!",
            type: "error",
          });
        } else {
          setNotification({
            message: `Xuất file Word thất bại: ${pickerError.message}`,
            type: "error",
          });
        }
      }
    } catch (error) {
      setNotification({
        message: `Lỗi khi xuất file Word: ${error.message}`,
        type: "error",
      });
    } finally {
      setExportingStates((prev) => ({ ...prev, [articleId]: false }));
    }
  };

  useEffect(() => {
    if (!isMounted) return;
    if (showDiagramForArticle) {
      const nodes = [{ id: "center", name: "Bài viết", group: 0 }];
      const links = [];

      const articleComments = comments[showDiagramForArticle] || [];

      articleComments.forEach((comment) => {
        nodes.push({
          id: `comment-${comment.id}`,
          name: comment.author,
          group: 1,
        });
        links.push({
          source: "center",
          target: `comment-${comment.id}`,
        });

        if (Array.isArray(comment.replies)) {
          comment.replies.forEach((reply) => {
            nodes.push({
              id: `reply-${reply.id}`,
              name: reply.author,
              group: 2,
            });
            links.push({
              source: `comment-${comment.id}`,
              target: `reply-${reply.id}`,
            });
          });
        }
      });

      setGraphData({ nodes, links });
    } else {
      setGraphData({ nodes: [], links: [] });
    }
  }, [showDiagramForArticle, comments, isMounted]);

  const handleSavedArticleClick = (article) => {
    if (!isMounted) return;
    setSelectedSavedArticle(
      selectedSavedArticle === article.id ? null : article.id
    );
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={`text-gray-700 mt-[97px] shadow-2xl border border-blue-300 rounded-lg min-h-screen flex flex-row ${getThemeClasses(
        theme,
        "editor"
      )}`}
    >
      <div
        className={`flex-1 mx-4 pt-5 pb-5 my-3 rounded-lg shadow-md ${getThemeClasses(
          theme,
          "container"
        )}`}
      >
        <div className="flex items-center justify-between mb-6 px-4">
          <h1 className="text-2xl font-bold font-montserrat bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Danh sách bài viết
          </h1>
          <div className="relative w-1/2 max-w-md">
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-blue-100 border border-gray-300 rounded-full px-4 py-2 pr-10 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 hover:border-blue-400 hover:ring-1 hover:ring-blue-400 transition duration-200 text-base"
            />
            <Image
              src="http://res.cloudinary.com/dlaoxrnad/image/upload/v1741681498/nkydita1doyqs2igrdbd.svg"
              alt="Biểu tượng tìm kiếm"
              width={20}
              height={20}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            />
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="max-h-[calc(3*360px)] overflow-y-auto scrollbar-hidden px-4 space-y-1"
        >
          {posts
            .filter((post) =>
              searchTerm
                ? post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  post.content.toLowerCase().includes(searchTerm.toLowerCase())
                : true
            )
            .map((post) => (
              <div key={post.id} className="relative">
                <div
                  className="rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-[0_0_15px_rgba(0,0,0,0.2)] transition-shadow duration-200 cursor-pointer bg-blue-50"
                  onClick={() => handlePostClick(post)}
                >
                  <div className="flex items-center mb-3">
                    <div
                      className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: "#A855F7" }}
                    >
                      {post.author === "Chưa có tác giả"
                        ? "?"
                        : post.author[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-blue-600 text-sm">
                        {post.author}
                      </p>
                      <p className="text-sm text-gray-500">{post.created_at}</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-3 text-base">{post.content}</p>

                  {(post.images || post.videos) && (
                    <div className="flex flex-wrap justify-center items-end gap-4 mb-3">
                      {post.images && (
                        <div className="flex-1 min-w-[150px] max-w-[527px]">
                          <Image
                            src={post.images}
                            alt={post.title}
                            width={527}
                            height={435}
                            className="rounded-md object-cover w-full h-auto"
                          />
                        </div>
                      )}

                      {post.videos && (
                        <div className="flex-1 min-w-[150px] max-w-[527px] flex justify-center">
                          <video
                            src={post.videos}
                            controls
                            width={527}
                            height={435}
                            className="rounded-md w-full h-auto mx-auto"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mb-3">
                    {post.files && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        <a
                          href={post.files}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center text-sm"
                        >
                          <svg
                            className="w-5 h-5 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Tải file
                        </a>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-100 text-blue-600 text-sm px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-2 flex justify-around text-gray-500 text-sm">
                      {isLoggedIn ? (
                        <>
                          <button
                            className="flex items-center hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleComments(post.id);
                            }}
                          >
                            <MessageOutlined className="mr-1" />
                            Bình luận
                          </button>
                          <button
                            className="flex items-center hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDiagram(post.id);
                            }}
                          >
                            <ApartmentOutlined className="mr-1" />
                            Sơ đồ
                          </button>
                          <button
                            className="flex items-center hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              saveArticle(post);
                            }}
                          >
                            <SaveOutlined className="mr-1" />
                            Lưu bài viết
                          </button>
                          <button
                            className="flex items-center hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              exportToWord(post.id);
                            }}
                            disabled={exportingStates[post.id]}
                          >
                            <FileWordOutlined className="mr-1" />
                            {exportingStates[post.id]
                              ? "Đang xuất..."
                              : "Xuất ra file Word"}
                          </button>
                        </>
                      ) : (
                        <p className="text-gray-500 flex items-center text-sm">
                          Đăng nhập để Bình luận, Lưu bài viết và Xuất file
                        </p>
                      )}
                    </div>
                  </div>

                  {isLoggedIn && (
                    <div
                      className={`text-gray-700 p-5 rounded-lg shadow-md mt-4 relative transition-all duration-700 ease-in-out ${getThemeClasses(
                        theme,
                        "support"
                      )} ${
                        showCommentsForArticle === post.id
                          ? "opacity-100"
                          : "max-h-0 opacity-0 overflow-hidden"
                      }`}
                    >
                      {loadingStates[post.id] &&
                      showCommentsForArticle === post.id ? (
                        <p className="text-gray-600 text-base">Đang tải...</p>
                      ) : (
                        <>
                          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-400 mb-6">
                            Nhận xét và phản hồi
                          </h1>

                          {!isWriting && (
                            <button
                              className="text-sm text-blue-600 hover:text-blue-800 font-bold mb-4"
                              onClick={() => setIsWriting(true)}
                            >
                              ✍️ Viết bình luận
                            </button>
                          )}

                          {isWriting && (
                            <div className="mb-6">
                              <div className="relative">
                                <textarea
                                  ref={commentTextareaRef}
                                  placeholder="Nhập bình luận của bạn..."
                                  value={newCommentContent}
                                  onChange={handleNewCommentChange}
                                  rows="3"
                                  className="w-full p-4 rounded-xl transition duration-300 focus:ring-2 focus:ring-purple-300 resize-none text-base"
                                  style={{
                                    border: "1px solid transparent",
                                    backgroundColor: "transparent",
                                    boxShadow:
                                      "inset 0 0 0 1px #A855F7, 0 0 0 2px #3B82F6",
                                    outline: "none",
                                  }}
                                />
                                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                  {isAFrameLoaded ? (
                                    <>
                                      <ErrorBoundary componentName="Emoji">
                                        <div className="mt-0">
                                          <Emoji
                                            onSelect={(emoji) =>
                                              handleEmojiSelect(emoji)
                                            }
                                          />
                                        </div>
                                      </ErrorBoundary>
                                      <ErrorBoundary componentName="Sticker">
                                        <div className="mt-0">
                                          <Sticker
                                            onSelect={(url) =>
                                              handleStickerSelect(url)
                                            }
                                          />
                                        </div>
                                      </ErrorBoundary>
                                    </>
                                  ) : (
                                    <p className="text-gray-500 text-sm">
                                      Đang tải Emoji/Sticker...
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <button
                                  className="bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-black px-4 py-2 rounded text-sm"
                                  onClick={() => {
                                    submitComment(post.id);
                                    setIsWriting(false);
                                  }}
                                >
                                  Gửi bình luận
                                </button>
                                <button
                                  className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded text-sm"
                                  onClick={() => setIsWriting(false)}
                                >
                                  Hủy
                                </button>
                              </div>

                              {selectedCommentStickers.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2 overflow-x-auto">
                                  {selectedCommentStickers.map((url, index) => (
                                    <div
                                      key={`${url}-${index}`}
                                      className="relative w-16 h-16"
                                    >
                                      {url.endsWith(".mp4") ? (
                                        <video
                                          src={url}
                                          controls
                                          width={64}
                                          height={64}
                                          className="rounded-sm"
                                        />
                                      ) : (
                                        <Image
                                          src={url}
                                          alt={`sticker-${index}`}
                                          width={64}
                                          height={64}
                                          style={{ objectFit: "contain" }}
                                          className="rounded-sm"
                                        />
                                      )}
                                      <button
                                        onClick={() => handleRemoveSticker(url)}
                                        className="absolute top-0 right-0 text-red-500 text-xs font-bold"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {(comments[post.id] || []).map((comment) => (
                            <div
                              key={comment.id}
                              className="pb-4 mb-4 border-b border-gray-200"
                            >
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                                  {comment.author[0]?.toUpperCase() || "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-blue-600 text-sm">
                                    {comment.author}
                                  </p>
                                  {editingCommentId === comment.id ? (
                                    <div className="mt-2">
                                      <textarea
                                        value={editedCommentContent}
                                        onChange={(e) =>
                                          setEditedCommentContent(e.target.value)
                                        }
                                        rows="2"
                                        className="w-full p-2 rounded-xl transition duration-300 focus:ring-2 focus:ring-purple-300 resize-none text-base"
                                        style={{
                                          border: "1px solid transparent",
                                          backgroundColor: "transparent",
                                          boxShadow:
                                            "inset 0 0 0 1px #A855F7, 0 0 0 2px #3B82F6",
                                          outline: "none",
                                        }}
                                      />
                                      <div className="mt-2 space-x-2">
                                        <button
                                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                          onClick={() =>
                                            saveEditedComment(post.id, comment.id)
                                          }
                                        >
                                          Lưu
                                        </button>
                                        <button
                                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                                          onClick={cancelEditing}
                                        >
                                          Hủy
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p
                                      className="text-base"
                                      style={{ wordBreak: "break-word" }}
                                    >
                                      {comment.content}
                                    </p>
                                  )}
                                  {Array.isArray(comment.stickers) &&
                                    comment.stickers.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {comment.stickers.map((url, index) => (
                                          <div
                                            key={`${url}-${index}`}
                                            className="relative w-16 h-16"
                                          >
                                            {url.endsWith(".mp4") ? (
                                              <video
                                                src={url}
                                                controls
                                                width={64}
                                                height={64}
                                                className="rounded-sm"
                                              />
                                            ) : (
                                              <Image
                                                src={url}
                                                alt={`sticker-${index}`}
                                                width={64}
                                                height={64}
                                                style={{ objectFit: "contain" }}
                                                className="rounded-sm"
                                              />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  {/* Container cho các nút Sửa, Xóa, Phản hồi */}
                                  <div className="flex items-center gap-4 mt-2">
                                    <button
                                      className="text-blue-500 text-sm flex items-center hover:text-blue-700"
                                      onClick={() =>
                                        setReplyToCommentId(comment.id)
                                      }
                                    >
                                      <MessageOutlined
                                        className="mr-1"
                                        title="Phản hồi"
                                      />
                                      Phản hồi
                                    </button>
                                    {currentUser &&
                                      comment.user_id === currentUser.id && (
                                        <>
                                          <button
                                            className="text-green-400 text-sm flex items-center hover:text-green-500"
                                            onClick={() =>
                                              startEditingComment(comment)
                                            }
                                            title="Chỉnh sửa"
                                          >
                                            <EditOutlined className="mr-1" />
                                            Sửa
                                          </button>
                                          <button
                                            className="text-red-400 text-sm flex items-center hover:text-red-500"
                                            onClick={() =>
                                              deleteComment(post.id, comment.id)
                                            }
                                            title="Xóa"
                                          >
                                            <DeleteOutlined className="mr-1" />
                                            Xóa
                                          </button>
                                        </>
                                      )}
                                  </div>
                                  {/* Phần textarea phản hồi */}
                                  {replyToCommentId === comment.id && (
                                    <div className="mt-2">
                                      <div className="relative">
                                        <textarea
                                          ref={replyTextareaRef}
                                          placeholder="Nhập phản hồi của bạn..."
                                          value={replyContent}
                                          onChange={handleReplyChange}
                                          rows="2"
                                          className="w-full p-4 rounded-xl transition duration-300 focus:ring-2 focus:ring-purple-300 resize-none text-base"
                                          style={{
                                            border: "1px solid transparent",
                                            backgroundColor: "transparent",
                                            boxShadow:
                                              "inset 0 0 0 1px #A855F7, 0 0 0 2px #3B82F6",
                                            outline: "none",
                                          }}
                                        />
                                        <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                          {isAFrameLoaded ? (
                                            <>
                                              <ErrorBoundary componentName="Emoji">
                                                <div className="mt-0">
                                                  <Emoji
                                                    onSelect={(emoji) =>
                                                      handleEmojiSelect(
                                                        emoji,
                                                        true
                                                      )
                                                    }
                                                  />
                                                </div>
                                              </ErrorBoundary>
                                              <ErrorBoundary componentName="Sticker">
                                                <div className="mt-0">
                                                  <Sticker
                                                    onSelect={(url) =>
                                                      handleStickerSelect(
                                                        url,
                                                        true
                                                      )
                                                    }
                                                  />
                                                </div>
                                              </ErrorBoundary>
                                            </>
                                          ) : (
                                            <p className="text-gray-500 text-sm">
                                              Đang tải Emoji/Sticker...
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        className="bg-gradient-to-r from-blue-400 to-purple-400 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 text-black px-4 py-2 rounded mt-2 text-sm"
                                        onClick={() =>
                                          submitReply(post.id, comment.id)
                                        }
                                      >
                                        Gửi phản hồi
                                      </button>
                                      {selectedReplyStickers.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2 overflow-x-auto">
                                          {selectedReplyStickers.map(
                                            (url, index) => (
                                              <div
                                                key={`${url}-${index}`}
                                                className="relative w-16 h-16"
                                              >
                                                {url.endsWith(".mp4") ? (
                                                  <video
                                                    src={url}
                                                    controls
                                                    width={64}
                                                    height={64}
                                                    className="rounded-sm"
                                                  />
                                                ) : (
                                                  <Image
                                                    src={url}
                                                    alt={`sticker-${index}`}
                                                    width={64}
                                                    height={64}
                                                    style={{
                                                      objectFit: "contain",
                                                    }}
                                                    className="rounded-sm"
                                                  />
                                                )}
                                                <button
                                                  onClick={() =>
                                                    handleRemoveSticker(url, true)
                                                  }
                                                  className="absolute top-0 right-0 text-red-500 text-xs font-bold"
                                                >
                                                  ✕
                                                </button>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {/* Phần hiển thị phản hồi */}
                                  {Array.isArray(comment.replies) &&
                                    comment.replies.length > 0 && (
                                      <div className="mt-4 pl-4 border-l">
                                        {comment.replies.map((reply) => (
                                          <div
                                            key={reply.id}
                                            className="mb-2 flex items-start space-x-3"
                                          >
                                            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-xs">
                                              {reply.author[0]?.toUpperCase() ||
                                                "?"}
                                            </div>
                                            <div className="flex-1">
                                              <p className="font-bold text-blue-600 text-sm">
                                                {reply.author}
                                              </p>
                                              <p
                                                className="text-base"
                                                style={{
                                                  wordBreak: "break-word",
                                                }}
                                              >
                                                {reply.content}
                                              </p>
                                              {Array.isArray(reply.stickers) &&
                                                reply.stickers.length > 0 && (
                                                  <div className="mt-2 flex flex-wrap gap-2">
                                                    {reply.stickers.map(
                                                      (url, index) => (
                                                        <div
                                                          key={`${url}-${index}`}
                                                          className="relative w-16 h-16"
                                                        >
                                                          {url.endsWith(
                                                            ".mp4"
                                                          ) ? (
                                                            <video
                                                              src={url}
                                                              controls
                                                              width={64}
                                                              height={64}
                                                              className="rounded-sm"
                                                            />
                                                          ) : (
                                                            <Image
                                                              src={url}
                                                              alt={`sticker-${index}`}
                                                              width={64}
                                                              height={64}
                                                              style={{
                                                                objectFit:
                                                                  "contain",
                                                              }}
                                                              className="rounded-sm"
                                                            />
                                                          )}
                                                        </div>
                                                      )
                                                    )}
                                                  </div>
                                                )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}

                  {isLoggedIn && (
                    <div
                      className={`text-gray-700 p-5 rounded-lg shadow-md mt-4 relative transition-all duration-700 ease-in-out ${getThemeClasses(
                        theme,
                        "support"
                      )} ${
                        showDiagramForArticle === post.id
                          ? "max-h-[600px] opacity-100"
                          : "max-h-0 opacity-0 overflow-hidden"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-400">
                          Sơ đồ
                        </h2>
                        <div className="flex space-x-2">
                          <button
                            onClick={resettingDiagram}
                            className="bg-gray-200 p-2 rounded hover:bg-gray-300 transition duration-200"
                            title="Căn giữa sơ đồ"
                          >
                            <FullscreenOutlined />
                          </button>
                          <button
                            onClick={reloadDiagram}
                            className="bg-gray-200 p-2 rounded hover:bg-gray-300 transition duration-200"
                            title="Tải lại sơ đồ"
                          >
                            <ReloadOutlined />
                          </button>
                        </div>
                      </div>
                      <div className="h-96 flex justify-center items-center overflow-hidden">
                        {loadingStates[post.id] &&
                        showDiagramForArticle === post.id ? (
                          <p className="text-gray-600 text-base">Đang tải...</p>
                        ) : isAFrameLoaded ? (
                          <ErrorBoundary componentName="ForceGraph2D">
                            <ForceGraph2D
                              ref={graphRef}
                              graphData={graphData}
                              nodeAutoColorBy="group"
                              nodeLabel="name"
                              nodeRelSize={nodeSize}
                              linkColor={() => "lightblue"}
                              width={600}
                              height={384}
                            />
                          </ErrorBoundary>
                        ) : (
                          <p className="text-gray-500 text-base">
                            Đang tải sơ đồ...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
      </div>

      <div
        className={`w-1/4 min-w-[300px] max-w-[450px] border-l bg-blue-100 my-3 mr-3 border-gray-200 p-4 rounded-lg shadow-md transition-all duration-300 flex-shrink-0 h-fit ${getThemeClasses(
          theme,
          "container"
        )}`}
      >
        <div className="mb-6">
          <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent wrap-text mb-4">
            Thông tin tác giả
          </h2>
          <div className={`p-4 rounded-md bg-blue-50  border-gray-200 shadow-sm`}>
            <div className="space-y-2 text-gray-600 text-sm">
              <p>
                <strong>Tên:</strong>{" "}
                <span className="text-blue-600">
                  {authorInfo.name || "Chưa chọn bài viết"}
                </span>
              </p>
              <p>
                <strong>Email:</strong> {authorInfo.email || "Không có"}
              </p>
            </div>
          </div>
        </div>

        {isLoggedIn && (
          <div className="mb-6 border-t border-gray-200 pt-6">
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent wrap-text mb-4">
              Bài viết đã lưu
            </h2>
            <div
              className={`p-4 rounded-md bg-blue-50 border-gray-200 shadow-sm max-h-[400px] overflow-y-auto scrollbar-hidden`}
            >
              {savedArticles.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Chưa có bài viết nào được lưu.
                </p>
              ) : (
                savedArticles.map((article) => (
                  <div
                    key={article.id}
                    className="mb-4 last:mb-0 border-b border-gray-200 pb-2 last:border-0"
                  >
                    <div className="flex justify-between items-center">
                      <p
                        className="font-medium text-gray-800 cursor-pointer hover:text-blue-600 text-sm"
                        onClick={() => handleSavedArticleClick(article)}
                      >
                        {article.title}
                      </p>
                      <button
                        className="text-red-500 hover:text-red-600 text-sm underline"
                        onClick={() => deleteSavedArticle(article.id)}
                      >
                        Xóa
                      </button>
                    </div>
                    <p className="text-sm text-blue-600">
                      Tác giả: {article.author}
                    </p>
                    {selectedSavedArticle === article.id && (
                      <div className="mt-2 text-gray-600 text-sm">
                        <p>{article.content}</p>
                        {article.tags.length > 0 && (
                          <p className="mt-1">
                            Tags: {article.tags.join(", ")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-gray-200">
          <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent wrap-text mb-4">
            Đề xuất
          </h2>
          <div className={`p-4 rounded-md bg-blue-50 border-gray-200 shadow-sm`}>
            <div className="space-y-4">
              {topAuthors.map((author, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className="w-12 h-12 bg-gray-200 rounded-full mr-3 flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: "#A855F7" }}
                  >
                    {author.name ? author.name[0].toUpperCase() : "?"}
                  </div>
                  <div>
                    <p className="font-medium text-blue-600 text-sm">
                      {author.name || "Chưa có tên"}
                    </p>
                    <p className="text-sm text-gray-500">Gợi ý theo dõi</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
          <ScrollToTop />
        </div>
      </div>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      {error && (
        <Confirm
          message={error.message}
          onConfirm={error.onConfirm || (() => setError(null))}
          onCancel={error.onCancel || (() => setError(null))}
        />
      )}

      <style jsx>{`
        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        textarea {
          min-height: 80px; /* Đảm bảo chiều cao tối thiểu */
          resize: none; /* Ngăn thay đổi kích thước */
          overflow-y: auto; /* Cho phép cuộn nội dung textarea nếu cần */
        }
      `}</style>
    </div>
  );
}
