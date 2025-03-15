"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

const ForceGraph2D = dynamic(
  () => import("react-force-graph").then((mod) => mod.ForceGraph2D),
  { ssr: false, loading: () => <p>Loading...</p> }
);

export default function NetworkGraph() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  // Load A-Frame dynamically only on client side
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://aframe.io/releases/1.2.0/aframe.min.js";
    script.async = true;
    script.onload = () => {
      console.log("A-Frame has loaded");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script); // Clean up if the component unmounts
    };
  }, []);

  useEffect(() => {
    const comments = [
      { id: "user1", text: "Bình luận 1" },
      { id: "user2", text: "Bình luận 2" },
      { id: "user3", text: "Bình luận 3" },
    ];

    const nodes = [{ id: "center", group: 0 }];
    const links = [];

    comments.forEach((comment) => {
      nodes.push({ id: comment.id, group: 1 });
      links.push({ source: "center", target: comment.id });
    });

    setGraphData({ nodes, links });
    setLoading(false);
  }, []);

  return (
    <div className="mt-[97px] p-5 mb-[-7px] rounded-lg shadow-md border border-gray-200 bg-gray-100 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold font-montserrat text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-400">
          Mạng lưới bình luận
        </h1>
      </div>

      <div className="w-full h-96 bg-white p-4 rounded-lg shadow-md flex justify-center items-center">
        {loading ? (
          <p className="text-gray-600 text-lg">Đang tải...</p>
        ) : graphData.nodes.length === 0 ? (
          <p className="text-gray-600 text-lg">Không có dữ liệu để hiển thị.</p>
        ) : (
          <ForceGraph2D
            graphData={graphData}
            nodeAutoColorBy="group"
            nodeRelSize={6}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.01}
            linkColor={() => "lightblue"}
          />
        )}
      </div>
    </div>
  );
}
