"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  MessageOutlined,
  ReloadOutlined,
  FullscreenOutlined,
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
  const [comments, setComments] = useState({});
  const [replyContent, setReplyContent] = useState("");
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [nodeSize, setNodeSize] = useState(6);
  const [savedArticles, setSavedArticles] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loadingStates, setLoadingStates] = useState({});
  const [exportingStates, setExportingStates] = useState({});
  const graphRef = useRef();

  const normalizeTags = (tags) => {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === "string")
      return tags.split(",").map((tag) => tag.trim());
    return [];
  };

  const normalizeImages = (images) => {
    if (typeof images === "string" && images.startsWith("http")) return images;
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

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, content, images, files, videos, topics, tags");

      if (error) {
        console.error("Error fetching posts:", error);
      } else {
        const normalizedPosts = data.map((post) => ({
          ...post,
          tags: normalizeTags(post.tags),
          images: normalizeImages(post.images),
          videos: normalizeVideos(post.videos),
          files: normalizeFiles(post.files),
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
    };

    fetchPosts();
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const toggleComments = (articleId) => {
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
    setSuccessMessage("");
  };

  const toggleDiagram = (articleId) => {
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
    setReplyContent(event.target.value);
  };

  const submitReply = (articleId, commentId) => {
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
    setSuccessMessage("Đăng thành công!");

    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  const saveArticle = (article) => {
    if (!savedArticles.some((saved) => saved.id === article.id)) {
      setSavedArticles([...savedArticles, article]);
    }
  };

  const resetDiagram = () => {
    setNodeSize(6);
    if (graphRef.current) {
      graphRef.current.zoomToFit(300);
    }
  };

  const reloadDiagram = () => {
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
    if (typeof window === "undefined") return;

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
          setSuccessMessage("Xuất file thành công!");
        }
      } catch (pickerError) {
        if (pickerError.name === "AbortError") {
          console.log("User canceled the file picker.");
          setSuccessMessage("Đã hủy xuất file.");
          setTimeout(() => setSuccessMessage(""), 3000);
          return;
        }
        console.warn(
          "showSaveFilePicker not supported, falling back to saveAs."
        );
        saveAs(blob, `${article.title}.docx`);
        setSuccessMessage("Xuất file thành công qua tải xuống!");
      } finally {
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Lỗi khi xuất file Word:", error);
      setSuccessMessage("Không thể xuất file Word. Vui lòng thử lại.");
    } finally {
      setExportingStates((prev) => ({ ...prev, [articleId]: false }));
    }
  };

  useEffect(() => {
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
  }, [showDiagramForArticle, comments]);

  return (
    <div className="mt-[97px] min-h-screen bg-gray-100 flex flex-row">
      {/* Main content */}
      <div className="flex-1 mx-4 pt-5 pb-5 rounded-lg shadow-md bg-white">
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
              className="w-full bg-gray-100 border border-gray-300 rounded-full px-4 py-2 pr-10 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 hover:border-blue-400 hover:ring-1 hover:ring-blue-400 transition duration-200"
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

        <div className="max-h-[calc(3*360px)] overflow-y-auto scrollbar-hidden px-4 space-y-2">
          {posts
            .filter((post) =>
              post.title.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((post) => (
              <div key={post.id}>
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-[0_0_15px_rgba(0,0,0,0.2)] transition-shadow duration-200">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                    <div>
                      <p className="font-semibold text-blue-500">
                        Tác giả mặc định
                      </p>
                      <p className="text-sm text-gray-500">Không có ngày</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-3">{post.content}</p>

                  {/* Media Section */}
                  {(post.images || post.videos) && (
                    <div className="flex flex-wrap justify-center items-end gap-4 mb-3">
                      {/* Hình ảnh */}
                      {post.images && (
                        <div className="flex-1 min-w-[150px] max-w-[300px]">
                          <Image
                            src={post.images}
                            alt={post.title}
                            width={300}
                            height={225}
                            className="rounded-md object-cover w-full h-auto"
                          />
                        </div>
                      )}

                      {/* Video */}
                      {post.videos && (
                        <div className="flex-1 min-w-[150px] max-w-[300px]">
                          <video
                            src={post.videos}
                            controls
                            width={300}
                            height={225}
                            className="rounded-md w-full h-auto"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* File and Tags Section */}
                  <div className="mb-3">
                    {post.files && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        <a
                          href={post.files}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline flex items-center"
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
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-2 flex justify-around text-gray-500 text-sm">
                    <button
                      className="hover:text-blue-600"
                      onClick={() => toggleComments(post.id)}
                    >
                      Bình luận
                    </button>
                    <button
                      className="hover:text-blue-600"
                      onClick={() => toggleDiagram(post.id)}
                    >
                      Sơ đồ
                    </button>
                    <button
                      className="hover:text-blue-600"
                      onClick={() => saveArticle(post)}
                    >
                      Lưu bài viết
                    </button>
                    <button
                      className="hover:text-blue-600"
                      onClick={() => exportToWord(post.id)}
                      disabled={exportingStates[post.id]}
                    >
                      {exportingStates[post.id]
                        ? "Đang xuất..."
                        : "Xuất ra file Word"}
                    </button>
                  </div>
                </div>

                {/* Comment Section */}
                <div
                  className={`bg-white text-gray-700 p-5 rounded-lg shadow-md mt-4 relative transition-all duration-700 ease-in-out ${
                    showCommentsForArticle === post.id
                      ? "max-h-[600px] opacity-100"
                      : "max-h-0 opacity-0 overflow-hidden"
                  }`}
                >
                  {loadingStates[post.id] &&
                  showCommentsForArticle === post.id ? (
                    <p className="text-gray-600 text-lg">Đang tải...</p>
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold font-montserrat text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-400 mb-6">
                        Nhận xét và phản hồi
                      </h1>
                      {successMessage && (
                        <div className="absolute top-0 right-0 bg-green-500 text-black p-2 rounded-lg">
                          {successMessage}
                        </div>
                      )}
                      {(comments[post.id] || []).map((comment) => (
                        <div key={comment.id} className="border-b pb-4 mb-4">
                          <p className="font-semibold text-blue-500">
                            {comment.author}
                          </p>
                          <p>{comment.content}</p>
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
                                }}
                              />
                              <button
                                className="bg-gradient-to-r from-blue-400 to-purple-400 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 text-black px-4 py-2 rounded mt-2"
                                onClick={() => submitReply(post.id, comment.id)}
                              >
                                Gửi phản hồi
                              </button>
                            </div>
                          )}

                          {comment.replies.length > 0 && (
                            <div className="mt-4 pl-4 border-l">
                              {comment.replies.map((reply, index) => (
                                <div key={reply.id} className="mb-2">
                                  <p className="font-semibold text-blue-500">
                                    {reply.author}
                                  </p>
                                  <p>{reply.content}</p>
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

                {/* Diagram Section */}
                <div
                  className={`bg-white text-gray-700 p-5 rounded-lg shadow-md mt-4 relative transition-all duration-700 ease-in-out ${
                    showDiagramForArticle === post.id
                      ? "max-h-[600px] opacity-100"
                      : "max-h-0 opacity-0 overflow-hidden"
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold font-montserrat text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-400">
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
                      <p className="text-gray-600 text-lg">Đang tải...</p>
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
              </div>
            ))}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-1/4 min-w-[300px] max-w-[450px] bg-gradient-to-br from-gray-100 to-blue-100 border-l border-gray-200 p-4 rounded-lg shadow-md transition-all duration-300 flex-shrink-0">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Thông tin tác giả
          </h2>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 shadow-sm">
            <div className="space-y-2 text-gray-600">
              <p>
                <strong>Tên:</strong>{" "}
                <span className="text-blue-500">Tác giả mẫu</span>
              </p>
              <p>
                <strong>Email:</strong> tacgia@vidu.com
              </p>
              <p>
                <strong>Giới thiệu:</strong> Một tác giả yêu thích viết lách.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Bài viết đã lưu
          </h2>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 shadow-sm max-h-64 overflow-y-auto">
            {savedArticles.length === 0 ? (
              <p className="text-gray-500">Chưa có bài viết nào được lưu.</p>
            ) : (
              savedArticles.map((article) => (
                <div
                  key={article.id}
                  className="mb-4 last:mb-0 border-b border-gray-200 pb-2 last:border-0"
                >
                  <p className="font-medium text-gray-700">{article.title}</p>
                  <p className="text-sm text-blue-500">Không có tác giả</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Đề xuất</h2>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-blue-500">Người dùng 1</p>
                  <p className="text-sm text-gray-500">Gợi ý theo dõi</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-blue-500">Người dùng 2</p>
                  <p className="text-sm text-gray-500">Gợi ý theo dõi</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-blue-500">Người dùng 3</p>
                  <p className="text-sm text-gray-500">Gợi ý theo dõi</p>
                </div>
              </div>
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
