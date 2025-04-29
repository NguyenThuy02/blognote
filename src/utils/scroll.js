"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react"; // Cài đặt lucide-react nếu bạn chưa cài

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  // Kiểm tra nếu trang có thể cuộn dọc
  const isScrollable = () => {
    return document.documentElement.scrollHeight > window.innerHeight;
  };

  // Hàm cuộn trang về đầu
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Kiểm tra và hiển thị nút cuộn
  useEffect(() => {
    if (!isScrollable()) return; // Nếu trang không có thanh cuộn thì không làm gì

    // Hiển thị nút khi cuộn xuống dưới 200px
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Render nút cuộn lên đầu trang
  return (
    <>
      {visible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-7 right-[24px] p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition z-50"
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </>
  );
}
