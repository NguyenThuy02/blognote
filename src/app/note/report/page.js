"use client";
import { Bar } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement } from "chart.js";
import { useEffect, useState } from "react";

Chart.register(CategoryScale, LinearScale, BarElement);

export default function Report() {
  const totalPosts = 55; // Total number of posts
  const totalNotes = 75; // Total number of notes

  const noteData = {
    labels: ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"],
    datasets: [
      {
        label: "Số lượng ghi chú",
        data: [10, 20, 15, 30],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  const postData = {
    labels: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4"],
    datasets: [
      {
        label: "Số lượng bài viết đã đăng tải",
        data: [5, 15, 10, 25],
        backgroundColor: "rgba(153, 102, 255, 0.6)",
      },
    ],
  };

  const [tags, setTags] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    const fetchedTags = [
      { name: "#dashboard", type: "post" },
      { name: "UI Design", type: "note" },
      { name: "App Design", type: "post" },
      { name: "SaaS App", type: "note" },
      { name: "Finance", type: "note" },
    ];
    setTags(fetchedTags);

    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes fall {
        0% {
          transform: translateY(-50px);
          opacity: 1;
        }
        100% {
          transform: translateY(0);
          opacity: 1;
        }
      }
      .tag-container {
        position: relative;
        width: 100%;
        height: 200px; /* Adjust height as needed */
        overflow: hidden;
        border-left: 5px solid #ccc; /* Left border */
        border-right: 5px solid #ccc; /* Right border */
        border-bottom: 5px solid #ccc; /* Bottom border */
        border-radius: 0 0 20px 20px; /* Rounded bottom corners */
        background-color: #f9f9f9; /* Background color */
        transition: background-color 0.3s ease;
      }
      .tag-container:hover {
        background-color: #e0f7fa; /* Change background on hover */
      }
      .tag {
        position: absolute;
        transition: transform 0.3s ease, background-color 0.3s ease;
        cursor: grab;
        opacity: 0; /* Start hidden */
      }
      .tag:active {
        cursor: grabbing;
      }
      .tag:hover {
        background-color: rgba(75, 192, 192, 0.3); /* Change tag color on hover */
      }
      .fall-animation {
        animation: fall 0.5s ease forwards;
        opacity: 1; /* Make visible during animation */
      }
      .stat-card {
        background-color: white;
        border-radius: 8px;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .stat-card:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    // Trigger the fall animation after the tags are set
    if (tags.length > 0) {
      const tagElements = document.querySelectorAll(".tag");
      tagElements.forEach((tag, index) => {
        tag.classList.add("fall-animation");
      });
    }
  }, [tags]);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.setData("text/plain", index);
    e.currentTarget.style.opacity = 0.5;
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = 1;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedIndex = e.currentTarget.dataset.index;

    if (draggedIndex !== null) {
      const tagElements = document.querySelectorAll(".tag");
      const draggedTag = tagElements[draggedIndex];

      // Animate the tag falling back to its original position
      draggedTag.classList.add("fall-animation");

      // Delay resetting the positions
      setTimeout(() => {
        draggedTag.classList.remove("fall-animation");
        setDraggedIndex(null);
      }, 500);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="text-gray-700 mt-[1px] p-5 mb-[-7px] mt-[96px] p-5 mb-[-7px] max-w-6xl mx-auto p-6">
      <div className="border rounded-lg shadow-lg p-6 bg-gray-50">
        <h1 className="text-3xl font-bold mb-4 text-center">
          📈 Thống kê ghi chú
        </h1>

        <h2 className="text-2xl font-semibold mb-4 text-center">
          Tổng số lượng bài viết và ghi chú
        </h2>

        <div className="space-y-4">
          <div className="stat-card shadow-md p-4 flex items-center justify-between">
            <span className="font-bold text-xl">Bài viết: {totalPosts}</span>
            <div className="flex-1 ml-4">
              <div className="bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full"
                  style={{ width: `${(totalPosts / 100) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="stat-card shadow-md p-4 flex items-center justify-between">
            <span className="font-bold text-xl">Ghi chú: {totalNotes}</span>
            <div className="flex-1 ml-4">
              <div className="bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full"
                  style={{ width: `${(totalNotes / 100) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <div className="flex-1 mr-2">
            <h2 className="text-2xl font-semibold mb-2 text-center">
              Biểu đồ bài viết đã đăng tải theo tháng
            </h2>
            <div style={{ height: "200px" }}>
              <Bar
                data={postData}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
          <div className="flex-1 ml-2">
            <h2 className="text-2xl font-semibold mb-2 text-center">
              Biểu đồ ghi chú theo tuần
            </h2>
            <div style={{ height: "200px" }}>
              <Bar
                data={noteData}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 tag-container">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            Trending Tags
          </h2>
          {tags.map((tag, index) => {
            // Predefined positions to avoid overlap
            const positions = [
              { left: "10%", bottom: "0%" },
              { left: "30%", bottom: "0%" },
              { left: "50%", bottom: "0%" },
              { left: "70%", bottom: "0%" },
              { left: "40%", bottom: "0%" },
            ];
            const position = positions[index % positions.length];
            const randomDelay = Math.random() * 0.5;

            return (
              <div
                key={index}
                className={`tag m-2 p-2 rounded-lg border transition-transform transform hover:scale-105 ${
                  tag.type === "post" ? "border-purple-300" : "border-blue-300"
                }`}
                style={{
                  left: position.left,
                  bottom: position.bottom,
                  animationDelay: `${randomDelay + index * 0.1}s`,
                }}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                data-index={index}
              >
                {tag.name}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
