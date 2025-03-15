"use client";
import { useState } from "react";

const commentsData = [
  {
    id: 1,
    author: "Người dùng 1",
    content: "Bài viết rất hữu ích, cảm ơn bạn!",
    replies: [],
  },
  {
    id: 2,
    author: "Người dùng 2",
    content: "Tôi có một số câu hỏi về nội dung này.",
    replies: [],
  },
];

export default function CommentApp() {
  const [comments, setComments] = useState(commentsData);
  const [replyContent, setReplyContent] = useState("");
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const handleReplyChange = (event) => {
    setReplyContent(event.target.value);
  };

  const submitReply = (commentId) => {
    if (!replyContent.trim()) return;

    const newComment = {
      id: Date.now(),
      author: "Tác giả",
      content: replyContent,
    };
    const updatedComments = comments.map((comment) => {
      if (comment.id === commentId) {
        return { ...comment, replies: [...comment.replies, newComment] };
      }
      return comment;
    });

    setComments(updatedComments);
    setReplyContent("");
    setReplyToCommentId(null);
    setSuccessMessage("Đăng thành công!");

    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-md mt-[99px] relative">
      <h1 className="text-4xl font-bold font-montserrat text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-400 mb-6">
        Nhận xét và phản hồi
      </h1>
      {successMessage && (
        <div className="absolute top-0 right-0 bg-green-500 text-black p-2 rounded-lg">
          {successMessage}
        </div>
      )}
      {comments.map((comment) => (
        <div key={comment.id} className="border-b pb-4 mb-4">
          <p className="font-semibold">{comment.author}</p>
          <p>{comment.content}</p>
          <button
            className="text-blue-500 mt-2"
            onClick={() => setReplyToCommentId(comment.id)}
          >
            Phản hồi
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
                  boxShadow: "inset 0 0 0 1px #A855F7, 0 0 0 2px #3B82F6",
                  outline: "none",
                }}
              />
              <button
                className="bg-gradient-to-r from-blue-400 to-purple-400 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 text-black px-4 py-2 rounded mt-2"
                onClick={() => submitReply(comment.id)}
              >
                Gửi phản hồi
              </button>
            </div>
          )}

          {comment.replies.length > 0 && (
            <div className="mt-4 pl-4 border-l">
              {comment.replies.map((reply, index) => (
                <div key={reply.id} className="mb-2">
                  <p className="font-semibold">{reply.author}</p>
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
    </div>
  );
}
