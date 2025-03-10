"use client";
import Link from "next/link";
import { useState } from "react";

export default function NoteList() {
  const [textNotes] = useState([
    { id: 1, title: "Ghi chú văn bản 1", description: "Mô tả ngắn gọn" },
    { id: 2, title: "Ghi chú văn bản 2", description: "Mô tả ngắn gọn" },
    { id: 3, title: "Ghi chú văn bản 3", description: "Mô tả ngắn gọn" },
    { id: 4, title: "Ghi chú văn bản 4", description: "Mô tả ngắn gọn" },
    { id: 5, title: "Ghi chú văn bản 5", description: "Mô tả ngắn gọn" },
    { id: 6, title: "Ghi chú văn bản 6", description: "Mô tả ngắn gọn" },
    { id: 7, title: "Ghi chú văn bản 7", description: "Mô tả ngắn gọn" },
    { id: 8, title: "Ghi chú văn bản 8", description: "Mô tả ngắn gọn" },
  ]);

  const [richNotes] = useState([
    { id: 9, title: "Ghi chú phong phú 1", description: "Mô tả ngắn gọn", image: "https://i.pinimg.com/736x/6c/9c/23/6c9c231e633fafd541a8dd57170b02c5.jpg" },
    { id: 10, title: "Ghi chú phong phú 2", description: "Mô tả ngắn gọn", image: "https://i.pinimg.com/736x/f2/23/c2/f223c277abf6a66a140fdb7e4eb80b1c.jpg" },
    { id: 11, title: "Ghi chú phong phú 3", description: "Mô tả ngắn gọn", image: "https://i.pinimg.com/736x/f7/1b/6a/f71b6a2014e59143986edbf947be5033.jpg" },
    { id: 12, title: "Ghi chú phong phú 4", description: "Mô tả ngắn gọn", image: null },
    { id: 13, title: "Ghi chú phong phú 5", description: "Mô tả ngắn gọn", image: null },
    { id: 14, title: "Ghi chú phong phú 6", description: "Mô tả ngắn gọn", image: "https://i.pinimg.com/736x/a0/51/4e/a0514ea3c638d0b6bf13667661350f6a.jpg" },
  ]);

  const [sketchNotes] = useState([
    { id: 15, title: "Ghi chú bảng trắng 1", description: "Mô tả ngắn gọn" },
    { id: 16, title: "Ghi chú bảng trắng 2", description: "Mô tả ngắn gọn" },
    { id: 17, title: "Ghi chú bảng trắng 3", description: "Mô tả ngắn gọn" },
    { id: 18, title: "Ghi chú bảng trắng 4", description: "Mô tả ngắn gọn" },
    { id: 19, title: "Ghi chú bảng trắng 5", description: "Mô tả ngắn gọn" },
  ]);

  const [spreadsheetNotes] = useState([
    { id: 20, title: "Ghi chú bảng tính 1", description: "Mô tả ngắn gọn" },
    { id: 21, title: "Ghi chú bảng tính 2", description: "Mô tả ngắn gọn" },
    { id: 22, title: "Ghi chú bảng tính 3", description: "Mô tả ngắn gọn" },
    { id: 23, title: "Ghi chú bảng tính 4", description: "Mô tả ngắn gọn" },
    { id: 24, title: "Ghi chú bảng tính 5", description: "Mô tả ngắn gọn" },
  ]);

  // State for pagination
  const [currentTextPage, setCurrentTextPage] = useState(1);
  const [currentRichPage, setCurrentRichPage] = useState(1);
  const [currentSketchPage, setCurrentSketchPage] = useState(1);
  const [currentSpreadsheetPage, setCurrentSpreadsheetPage] = useState(1);

  const [showMoreText, setShowMoreText] = useState(false);
  const [showMoreRich, setShowMoreRich] = useState(false);
  const [showMoreSketch, setShowMoreSketch] = useState(false);
  const [showMoreSpreadsheet, setShowMoreSpreadsheet] = useState(false);

  const notesPerPage = 5;

  const paginate = (notes, currentPage) => {
    const indexOfLastNote = currentPage * notesPerPage;
    const indexOfFirstNote = indexOfLastNote - notesPerPage;
    return notes.slice(indexOfFirstNote, indexOfLastNote);
  };

  const totalTextPages = Math.ceil(textNotes.length / notesPerPage);
  const totalRichPages = Math.ceil(richNotes.length / notesPerPage);
  const totalSketchPages = Math.ceil(sketchNotes.length / notesPerPage);
  const totalSpreadsheetPages = Math.ceil(spreadsheetNotes.length / notesPerPage);

  return (
    <div className="max-w-full mx-auto p-6 space-y-6">

      {/* Khung 1: Ghi chú văn bản thuần */}
      <div className="border border-purple-300 rounded-lg p-4 bg-white hover:bg-gray-100 transition duration-300 ease-in-out">
        <h2 className="text-xl font-bold mb-4">📄 Ghi chú văn bản thuần</h2>
        <div className="grid grid-cols-1 gap-4">
          {paginate(textNotes, currentTextPage).slice(0, showMoreText ? textNotes.length : 2).map(note => (
            <div key={note.id} className="p-4 shadow-md rounded-lg border hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out">
              <h3 className="font-semibold">{note.title}</h3>
              <p className="text-gray-600">{note.description}</p>
              <Link href={`/note/${note.id}`} className="text-blue-500 mt-2 block">Xem chi tiết →</Link>
            </div>
          ))}
        </div>
        
        <button onClick={() => setShowMoreText(!showMoreText)} className="mt-4 text-blue-500 mx-auto block">
          {showMoreText ? "Ẩn bớt" : "Xem thêm"}
        </button>
        
        {showMoreText && (
          <div className="flex justify-center mt-4">
            <button onClick={() => setCurrentTextPage(currentTextPage - 1)} disabled={currentTextPage === 1} className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1">
              &lt;
            </button>
            {Array.from({ length: totalTextPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentTextPage(index + 1)}
                className={`mx-1 px-4 py-2 rounded-full ${currentTextPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
              >
                {index + 1}
              </button>
            ))}
            <button onClick={() => setCurrentTextPage(currentTextPage + 1)} disabled={currentTextPage === totalTextPages} className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1">
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* Khung 2: Ghi chú văn bản phong phú */}
      <div className="border border-purple-300 rounded-lg p-4 bg-white hover:bg-gray-100 transition duration-300 ease-in-out">
        <h2 className="text-xl font-bold mb-4">🖼️ Ghi chú văn bản phong phú</h2>
        <div className="grid grid-cols-4 gap-4">
          {paginate(richNotes.filter(note => !note.image), currentRichPage).slice(0, showMoreRich ? richNotes.length : 4).map(note => (
            <div key={note.id} className="p-4 shadow-md rounded-lg border hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out">
              <h3 className="font-semibold">{note.title}</h3>
              <p className="text-gray-600">{note.description}</p>
              <Link href={`/note/${note.id}`} className="text-blue-500 mt-2 block">Xem chi tiết →</Link>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          {paginate(richNotes.filter(note => note.image), currentRichPage).slice(0, showMoreRich ? richNotes.length : 4).map(note => (
            <div key={note.id} className="p-4 shadow-md rounded-lg border hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out">
              {note.image && <img src={note.image} alt={note.title} className="mb-2 w-full h-32 object-cover rounded" />}
              <h3 className="font-semibold">{note.title}</h3>
              <p className="text-gray-600">{note.description}</p>
              <Link href={`/note/${note.id}`} className="text-blue-500 mt-2 block">Xem chi tiết →</Link>
            </div>
          ))}
        </div>
        
        <button onClick={() => setShowMoreRich(!showMoreRich)} className="mt-4 text-blue-500 mx-auto block">
          {showMoreRich ? "Ẩn bớt" : "Xem thêm"}
        </button>
        
        {showMoreRich && (
          <div className="flex justify-center mt-4">
            <button onClick={() => setCurrentRichPage(currentRichPage - 1)} disabled={currentRichPage === 1} className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1">
              &lt;
            </button>
            {Array.from({ length: totalRichPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentRichPage(index + 1)}
                className={`mx-1 px-4 py-2 rounded-full ${currentRichPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
              >
                {index + 1}
              </button>
            ))}
            <button onClick={() => setCurrentRichPage(currentRichPage + 1)} disabled={currentRichPage === totalRichPages} className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1">
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* Khung 3: Ghi chú bảng trắng */}
      <div className="border border-purple-300 rounded-lg p-4 bg-white hover:bg-gray-100 transition duration-300 ease-in-out">
        <h2 className="text-xl font-bold mb-4">📝 Ghi chú bảng trắng</h2>
        <div className="grid grid-cols-4 gap-4">
          {paginate(sketchNotes, currentSketchPage).slice(0, showMoreSketch ? sketchNotes.length : 4).map(note => (
            <div key={note.id} className="p-4 shadow-md rounded-lg border hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out">
              <h3 className="font-semibold">{note.title}</h3>
              <p className="text-gray-600">{note.description}</p>
              <Link href={`/note/${note.id}`} className="text-blue-500 mt-2 block">Xem chi tiết →</Link>
            </div>
          ))}
        </div>
        
        <button onClick={() => setShowMoreSketch(!showMoreSketch)} className="mt-4 text-blue-500 mx-auto block">
          {showMoreSketch ? "Ẩn bớt" : "Xem thêm"}
        </button>
        
        {showMoreSketch && (
          <div className="flex justify-center mt-4">
            <button onClick={() => setCurrentSketchPage(currentSketchPage - 1)} disabled={currentSketchPage === 1} className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1">
              &lt;
            </button>
            {Array.from({ length: totalSketchPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentSketchPage(index + 1)}
                className={`mx-1 px-4 py-2 rounded-full ${currentSketchPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
              >
                {index + 1}
              </button>
            ))}
            <button onClick={() => setCurrentSketchPage(currentSketchPage + 1)} disabled={currentSketchPage === totalSketchPages} className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1">
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* Khung 4: Ghi chú bảng tính */}
      <div className="border border-purple-300 rounded-lg p-4 bg-white hover:bg-gray-100 transition duration-300 ease-in-out">
        <h2 className="text-xl font-bold mb-4">📊 Ghi chú bảng tính</h2>
        <div className="grid grid-cols-4 gap-4">
          {paginate(spreadsheetNotes, currentSpreadsheetPage).slice(0, showMoreSpreadsheet ? spreadsheetNotes.length : 4).map(note => (
            <div key={note.id} className="p-4 shadow-md rounded-lg border hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out">
              <h3 className="font-semibold">{note.title}</h3>
              <p className="text-gray-600">{note.description}</p>
              <Link href={`/note/${note.id}`} className="text-blue-500 mt-2 block">Xem chi tiết →</Link>
            </div>
          ))}
        </div>
        
        <button onClick={() => setShowMoreSpreadsheet(!showMoreSpreadsheet)} className="mt-4 text-blue-500 mx-auto block">
          {showMoreSpreadsheet ? "Ẩn bớt" : "Xem thêm"}
        </button>
        
        {showMoreSpreadsheet && (
          <div className="flex justify-center mt-4">
            <button onClick={() => setCurrentSpreadsheetPage(currentSpreadsheetPage - 1)} disabled={currentSpreadsheetPage === 1} className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1">
              &lt;
            </button>
            {Array.from({ length: totalSpreadsheetPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentSpreadsheetPage(index + 1)}
                className={`mx-1 px-4 py-2 rounded-full ${currentSpreadsheetPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
              >
                {index + 1}
              </button>
            ))}
            <button onClick={() => setCurrentSpreadsheetPage(currentSpreadsheetPage + 1)} disabled={currentSpreadsheetPage === totalSpreadsheetPages} className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1">
              &gt;
            </button>
          </div>
        )}
      </div>

    </div>
  );
}