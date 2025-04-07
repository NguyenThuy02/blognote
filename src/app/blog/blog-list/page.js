"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  MessageOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import dynamic from "next/dynamic";
import { saveAs } from "file-saver";
import { supabase } from "../../../lib/supabase";
import "aframe";

const ForceGraph2D = dynamic(
  () => import("react-force-graph").then((mod) => mod.ForceGraph2D),
  { ssr: false, loading: () => <p>Loading...</p> }
);

export default function BloglistApp() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCommentsForArticle, setShowCommentsForArticle] = useState(null);
  const [showDiagramForArticle, setShowDiagramForArticle] = useState(null);
  const [showShareOverlay, setShowShareOverlay] = useState(null);
  const [copiedStatus, setCopiedStatus] = useState({});
  const [comments, setComments] = useState({});
  const [replyContent, setReplyContent] = useState("");
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [nodeSize, setNodeSize] = useState(6);
  const [savedArticles, setSavedArticles] = useState([]);
  const [posts, setPosts] = useState([]);
  const [topAuthors, setTopAuthors] = useState([]);
  const [authorInfo, setAuthorInfo] = useState({
    name: "",
    email: "",
    bio: "",
  });
  const [loadingStates, setLoadingStates] = useState({});
  const [exportingStates, setExportingStates] = useState({});
  const [selectedSavedArticle, setSelectedSavedArticle] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const graphRef = useRef();

  // Kiểm tra trạng thái đăng nhập chỉ trên client
  useEffect(() => {
    if (typeof window === "undefined") return; // Tránh chạy trên server

    const checkLoginStatus = () => {
      const userData = JSON.parse(localStorage.getItem("user") || "null");
      if (userData) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setSavedArticles([]);
        setComments({});
        setAuthorInfo({ name: "", email: "", bio: "" });
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
  }, []);

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

  // Lấy bài viết và top 7 tác giả
  useEffect(() => {
    const fetchPostsAndAuthors = async () => {
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(
          "id, title, content, images, files, videos, topics, tags, name, created_at"
        );

      if (postsError) {
        console.error("Error fetching posts:", postsError);
      } else {
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
          if (!comments[post.id]) {
            initialComments[post.id] = [];
          }
        });
        setComments((prev) => ({ ...prev, ...initialComments }));
      }

      const { data: authorsData, error: authorsError } = await supabase
        .from("posts")
        .select("name");

      if (authorsError) {
        console.error("Error fetching authors:", authorsError);
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
    };

    fetchPostsAndAuthors();
  }, []);

  // Hàm xử lý khi nhấn vào bài viết
  const handlePostClick = (post) => {
    setAuthorInfo({
      name: post.author,
      email: "N/A",
      bio: "Tác giả của bài viết này",
    });
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const toggleComments = (articleId) => {
    if (!isLoggedIn) return;
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
  };

  const toggleDiagram = (articleId) => {
    if (!isLoggedIn) return;
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

  const handleReplyChange = (event) => {
    if (!isLoggedIn) return;
    setReplyContent(event.target.value);
  };

  const submitReply = (articleId, commentId) => {
    if (!isLoggedIn || typeof window === "undefined") return;
    if (!replyContent.trim()) return;

    const newComment = {
      id: Date.now(),
      author: "Tác giả",
      content: replyContent,
    };

    const updatedComments = {
      ...comments,
      [articleId]: comments[articleId].map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, newComment] }
          : comment
      ),
    };

    setComments(updatedComments);
    setReplyContent("");
    setReplyToCommentId(null);
  };

  const saveArticle = (article) => {
    if (!isLoggedIn || typeof window === "undefined") return;
    if (!savedArticles.some((saved) => saved.id === article.id)) {
      setSavedArticles([...savedArticles, article]);
    }
  };

  const resetDiagram = () => {
    if (!isLoggedIn || typeof window === "undefined") return;
    setNodeSize(6);
    if (graphRef.current) {
      graphRef.current.zoomToFit(300);
    }
  };

  const reloadDiagram = () => {
    if (!isLoggedIn || typeof window === "undefined") return;
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
    if (!isLoggedIn || typeof window === "undefined") return;

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
                ...(comment.replies.length > 0
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
        }
      } catch (pickerError) {
        if (pickerError.name === "AbortError") {
          console.log("User canceled the file picker.");
          return;
        }
        console.warn(
          "showSaveFilePicker not supported, falling back to saveAs."
        );
        saveAs(blob, `${article.title}.docx`);
      }
    } catch (error) {
      console.error("Lỗi khi xuất file Word:", error);
    } finally {
      setExportingStates((prev) => ({ ...prev, [articleId]: false }));
    }
  };

  const shareArticle = (articleId) => {
    if (!isLoggedIn || typeof window === "undefined") return;
    setShowShareOverlay(articleId);
  };

  const copyLink = (articleId) => {
    if (!isLoggedIn || typeof window === "undefined") return;
    const article = posts.find((a) => a.id === articleId);
    const shareUrl = `${window.location.origin}/post/${article.id}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopiedStatus((prev) => ({ ...prev, [articleId]: true }));
      })
      .catch((error) => {
        console.error("Lỗi khi sao chép:", error);
      });
  };

  useEffect(() => {
    if (!isLoggedIn || typeof window === "undefined") return;
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
      });

      setGraphData({ nodes, links });
    } else {
      setGraphData({ nodes: [], links: [] });
    }
  }, [showDiagramForArticle, comments, isLoggedIn]);

  const handleSavedArticleClick = (article) => {
    if (typeof window === "undefined") return;
    setSelectedSavedArticle(
      selectedSavedArticle === article.id ? null : article.id
    );
  };

  return (
    <div className="text-gray-700 mt-[97px] min-h-screen bg-gray-100 flex flex-row">
      {/* Main content */}
      <div className="flex-1 mx-4 pt-5 pb-5 rounded-lg shadow-md bg-white">
        <div className="flex items-center justify-between mb-6 px-4">
          <h1
            className="text-2xl font-bold font-montserrat bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
            style={{ fontSize: "26px" }}
          >
            Danh sách bài viết
          </h1>
          <div className="relative w-1/2 max-w-md">
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-gray-100 border border-gray-300 rounded-full px-4 py-2 pr-10 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 hover:border-blue-400 hover:ring-1 hover:ring-blue-400 transition duration-200"
              style={{ fontSize: "18px" }}
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

        <div className="max-h-[calc(3*360px)] overflow-y-auto scrollbar-hidden px-4 space-y-1">
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
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-[0_0_15px_rgba(0,0,0,0.2)] transition-shadow duration-200 cursor-pointer"
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
                      <p
                        className="font-semibold text-blue-500"
                        style={{ fontSize: "18px" }}
                      >
                        {post.author}
                      </p>
                      <p
                        className="text-sm text-gray-500"
                        style={{ fontSize: "14px" }}
                      >
                        {post.created_at}
                      </p>
                    </div>
                  </div>

                  <h3
                    className="text-lg font-semibold text-gray-800 mb-2"
                    style={{ fontSize: "20px" }}
                  >
                    {post.title}
                  </h3>
                  <p
                    className="text-gray-600 mb-3"
                    style={{ fontSize: "18px" }}
                  >
                    {post.content}
                  </p>

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
                        <div className="flex-1 min-w-[150px] max-w-[527px]">
                          <video
                            src={post.videos}
                            controls
                            width={527}
                            height={435}
                            className="rounded-md w-full h-auto"
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
                          className="text-blue-500 hover:underline flex items-center"
                          style={{ fontSize: "18px" }}
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
                          className="bg-gray-100 text-blue-500 text-sm px-2 py-1 rounded"
                          style={{ fontSize: "16px" }}
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
                          className="hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComments(post.id);
                          }}
                          style={{ fontSize: "16px" }}
                        >
                          Bình luận
                        </button>
                        <button
                          className="hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDiagram(post.id);
                          }}
                          style={{ fontSize: "16px" }}
                        >
                          Sơ đồ
                        </button>
                        <button
                          className="hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            saveArticle(post);
                          }}
                          style={{ fontSize: "16px" }}
                        >
                          Lưu bài viết
                        </button>
                        <button
                          className="hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportToWord(post.id);
                          }}
                          disabled={exportingStates[post.id]}
                          style={{ fontSize: "16px" }}
                        >
                          {exportingStates[post.id]
                            ? "Đang xuất..."
                            : "Xuất ra file Word"}
                        </button>
                        <button
                          className="hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            shareArticle(post.id);
                          }}
                          style={{ fontSize: "16px" }}
                        >
                          Chia sẻ
                        </button>
                      </>
                    ) : (
                      <p className="text-gray-500" style={{ fontSize: "16px" }}>
                        Đăng nhập để Bình luận, Lưu bài viết và Chia sẻ bài viết
                      </p>
                    )}
                  </div>

                  {isLoggedIn && showShareOverlay === post.id && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                          <h2
                            className="text-xl font-semibold text-gray-800"
                            style={{ fontSize: "20px" }}
                          >
                            Chia sẻ bài viết
                          </h2>
                          <button
                            className="hover:bg-red-400 text-gray-500 hover:text-gray-700 p-1 rounded-sm transition duration-200"
                            onClick={() => {
                              setShowShareOverlay(null);
                              setCopiedStatus((prev) => ({
                                ...prev,
                                [post.id]: false,
                              }));
                            }}
                          >
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <span
                            className="text-blue-500 break-all"
                            style={{ fontSize: "16px" }}
                          >
                            {typeof window !== "undefined"
                              ? `${window.location.origin}/post/${post.id}`
                              : "Link không khả dụng trên server"}
                          </span>
                          <button
                            className={`${
                              copiedStatus[post.id]
                                ? "bg-gray-500 cursor-not-allowed"
                                : "bg-blue-500 hover:bg-blue-600"
                            } text-white px-3 py-1 rounded flex items-center transition duration-200`}
                            onClick={() => copyLink(post.id)}
                            disabled={
                              copiedStatus[post.id] ||
                              typeof window === "undefined"
                            }
                            style={{ fontSize: "16px" }}
                          >
                            {copiedStatus[post.id] ? (
                              "Đã sao chép"
                            ) : (
                              <>
                                <ShareAltOutlined className="mr-1" /> Sao chép
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {isLoggedIn && (
                  <div
                    className={`bg-white text-gray-700 p-5 rounded-lg shadow-md mt-4 relative transition-all duration-700 ease-in-out ${
                      showCommentsForArticle === post.id
                        ? "max-h-[600px] opacity-100"
                        : "max-h-0 opacity-0 overflow-hidden"
                    }`}
                  >
                    {loadingStates[post.id] &&
                    showCommentsForArticle === post.id ? (
                      <p
                        className="text-gray-600 text-lg"
                        style={{ fontSize: "18px" }}
                      >
                        Đang tải...
                      </p>
                    ) : (
                      <>
                        <h1 className="text-xl font-bold font-montserrat text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-400 mb-6">
                          Nhận xét và phản hồi
                        </h1>
                        {(comments[post.id] || []).map((comment) => (
                          <div key={comment.id} className="border-b pb-4 mb-4">
                            <p
                              className="font-semibold text-blue-500"
                              style={{ fontSize: "18px" }}
                            >
                              {comment.author}
                            </p>
                            <p style={{ fontSize: "18px" }}>
                              {comment.content}
                            </p>
                            <button
                              className="text-blue-500 mt-2"
                              onClick={() => setReplyToCommentId(comment.id)}
                            >
                              <MessageOutlined
                                className="mr-1"
                                title="Phản hồi"
                              />
                            </button>

                            {replyToCommentId === comment.id && (
                              <div className="mt-2">
                                <textarea
                                  placeholder="Nhập phản hồi của bạn..."
                                  value={replyContent}
                                  onChange={handleReplyChange}
                                  rows="2"
                                  className="w-full p-4 rounded-xl transition duration-300 focus:ring-2 focus:ring-purple-300"
                                  style={{
                                    border: "1px solid transparent",
                                    backgroundColor: "transparent",
                                    boxShadow:
                                      "inset 0 0 0 1px #A855F7, 0 0 0 2px #3B82F6",
                                    outline: "none",
                                    fontSize: "18px",
                                  }}
                                />
                                <button
                                  className="bg-gradient-to-r from-blue-400 to-purple-400 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 text-black px-4 py-2 rounded mt-2"
                                  onClick={() =>
                                    submitReply(post.id, comment.id)
                                  }
                                  style={{ fontSize: "16px" }}
                                >
                                  Gửi phản hồi
                                </button>
                              </div>
                            )}

                            {comment.replies.length > 0 && (
                              <div className="mt-4 pl-4 border-l">
                                {comment.replies.map((reply, index) => (
                                  <div key={reply.id} className="mb-2">
                                    <p
                                      className="font-semibold text-blue-500"
                                      style={{ fontSize: "18px" }}
                                    >
                                      {reply.author}
                                    </p>
                                    <p style={{ fontSize: "18px" }}>
                                      {reply.content}
                                    </p>
                                    {index < comment.replies.length - 1 && (
                                      <div className="h-0.5 bg-gradient-to-r from-blue-300 to-purple-300 my-2"></div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {isLoggedIn && (
                  <div
                    className={`bg-white text-gray-700 p-5 rounded-lg shadow-md mt-4 relative transition-all duration-700 ease-in-out ${
                      showDiagramForArticle === post.id
                        ? "max-h-[600px] opacity-100"
                        : "max-h-0 opacity-0 overflow-hidden"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold font-montserrat text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-400">
                        Sơ đồ
                      </h2>
                      <div className="flex space-x-2">
                        <button
                          onClick={resetDiagram}
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
                        <p
                          className="text-gray-600 text-lg"
                          style={{ fontSize: "18px" }}
                        >
                          Đang tải...
                        </p>
                      ) : (
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
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-1/4 min-w-[300px] max-w-[450px] bg-gradient-to-br from-gray-100 to-blue-100 border-l border-gray-200 p-4 rounded-lg shadow-md transition-all duration-300 flex-shrink-0 h-fit">
        <div className="mb-6">
          <h2
            className="text-lg font-semibold text-gray-800 mb-4"
            style={{ fontSize: "20px" }}
          >
            Thông tin tác giả
          </h2>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 shadow-sm">
            <div className="space-y-2 text-gray-600">
              <p style={{ fontSize: "18px" }}>
                <strong>Tên:</strong>{" "}
                <span className="text-blue-500">
                  {authorInfo.name || "Chưa chọn bài viết"}
                </span>
              </p>
              <p style={{ fontSize: "18px" }}>
                <strong>Email:</strong> {authorInfo.email}
              </p>
              <p style={{ fontSize: "18px" }}>
                <strong>Giới thiệu:</strong> {authorInfo.bio}
              </p>
            </div>
          </div>
        </div>

        {isLoggedIn && (
          <div className="mb-6 border-t border-gray-200 pt-6">
            <h2
              className="text-lg font-semibold text-gray-800 mb-4"
              style={{ fontSize: "20px" }}
            >
              Bài viết đã lưu
            </h2>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 shadow-sm">
              {savedArticles.length === 0 ? (
                <p className="text-gray-500" style={{ fontSize: "18px" }}>
                  Chưa có bài viết nào được lưu.
                </p>
              ) : (
                savedArticles.map((article) => (
                  <div
                    key={article.id}
                    className="mb-4 last:mb-0 border-b border-gray-200 pb-2 last:border-0"
                  >
                    <p
                      className="font-medium text-gray-700 cursor-pointer hover:text-blue-500"
                      style={{ fontSize: "18px" }}
                      onClick={() => handleSavedArticleClick(article)}
                    >
                      {article.title}
                    </p>
                    <p
                      className="text-sm text-blue-500"
                      style={{ fontSize: "16px" }}
                    >
                      {article.author}
                    </p>
                    {selectedSavedArticle === article.id && (
                      <div
                        className="mt-2 text-gray-600"
                        style={{ fontSize: "16px" }}
                      >
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
          <h2
            className="text-lg font-semibold text-gray-800 mb-4"
            style={{ fontSize: "20px" }}
          >
            Đề xuất
          </h2>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 shadow-sm">
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
                    <p
                      className="font-medium text-blue-500"
                      style={{ fontSize: "18px" }}
                    >
                      {author.name || "Chưa có tên"}
                    </p>
                    <p
                      className="text-sm text-gray-500"
                      style={{ fontSize: "16px" }}
                    >
                      Gợi ý theo dõi
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
      `}</style>
    </div>
  );
}
