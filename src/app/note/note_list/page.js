"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase2 } from "../../../lib/supabase";

export default function NoteList() {
  const [textNotes, setTextNotes] = useState([]);
  const [richNotes, setRichNotes] = useState([]);
  const [sketchNotes, setSketchNotes] = useState([]);
  const [spreadsheetNotes, setSpreadsheetNotes] = useState([]);

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

  // Fetch notes from Supabase
  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase2
        .from("notess")
        .select(
          "id, title, content, image_url, created_at, updated_at, category_id, note_type, todos, spreadsheet_data"
        )
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const mappedNotes = data.map((note) => ({
        id: note.id,
        title: note.title,
        description: note.content.slice(0, 50) + "...", // Short description from content
        image: note.image_url,
        note_type: note.note_type,
      }));

      // Categorize notes based on note_type
      setTextNotes(mappedNotes.filter((note) => note.note_type === "plain"));
      setRichNotes(mappedNotes.filter((note) => note.note_type === "rich"));
      setSketchNotes(
        mappedNotes.filter((note) => note.note_type === "whiteboard")
      );
      setSpreadsheetNotes(
        mappedNotes.filter((note) => note.note_type === "spreadsheet")
      );
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const paginate = (notes, currentPage) => {
    const indexOfLastNote = currentPage * notesPerPage;
    const indexOfFirstNote = indexOfLastNote - notesPerPage;
    return notes.slice(indexOfFirstNote, indexOfLastNote);
  };

  const totalTextPages = Math.ceil(textNotes.length / notesPerPage);
  const totalRichPages = Math.ceil(richNotes.length / notesPerPage);
  const totalSketchPages = Math.ceil(sketchNotes.length / notesPerPage);
  const totalSpreadsheetPages = Math.ceil(
    spreadsheetNotes.length / notesPerPage
  );

  return (
    <div className="mt-[73px] p-5 mb-[-7px] max-w-full mx-auto p-6 space-y-6 text-gray-700">
      {/* Khung 1: Ghi chú văn bản thuần */}
      <div className="border border-purple-300 rounded-lg p-4 bg-white hover:bg-gray-100 transition duration-300 ease-in-out">
        <h2 className="text-xl font-bold mb-4">📄 Ghi chú văn bản thuần</h2>
        <div className="grid grid-cols-1 gap-4">
          {paginate(textNotes, currentTextPage)
            .slice(0, showMoreText ? textNotes.length : 2)
            .map((note) => (
              <div
                key={note.id}
                className="p-4 shadow-md rounded-lg border hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out"
              >
                <h3 className="font-semibold">{note.title}</h3>
                <p className="text-gray-600">{note.description}</p>
                <Link
                  href={`/note/${note.id}`}
                  className="text-blue-500 mt-2 block"
                >
                  Xem chi tiết →
                </Link>
              </div>
            ))}
        </div>

        <button
          onClick={() => setShowMoreText(!showMoreText)}
          className="mt-4 text-blue-500 mx-auto block"
        >
          {showMoreText ? "Ẩn bớt" : "Xem thêm"}
        </button>

        {showMoreText && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setCurrentTextPage(currentTextPage - 1)}
              disabled={currentTextPage === 1}
              className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1"
            >
              &lt;
            </button>
            {Array.from({ length: totalTextPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentTextPage(index + 1)}
                className={`mx-1 px-4 py-2 rounded-full ${
                  currentTextPage === index + 1
                    ? "bg-purple-200 text-white p-4 border border-gray-400 shadow hover:shadow-lg"
                    : "bg-white text-gray-700 border border-gray-300 shadow-sm hover:shadow-md"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentTextPage(currentTextPage + 1)}
              disabled={currentTextPage === totalTextPages}
              className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1"
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* Khung 2: Ghi chú văn bản phong phú */}
      <div className="border border-purple-300 rounded-lg p-4 bg-white hover:bg-gray-100 transition duration-300 ease-in-out">
        <h2 className="text-xl font-bold mb-4">🖼️ Ghi chú văn bản phong phú</h2>
        <div className="grid grid-cols-4 gap-4">
          {paginate(
            richNotes.filter((note) => !note.image),
            currentRichPage
          )
            .slice(0, showMoreRich ? richNotes.length : 4)
            .map((note) => (
              <div
                key={note.id}
                className="p-4 shadow-md rounded-lg border hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out"
              >
                <h3 className="font-semibold">{note.title}</h3>
                <p className="text-gray-600">{note.description}</p>
                <Link
                  href={`/note/${note.id}`}
                  className="text-blue-500 mt-2 block"
                >
                  Xem chi tiết →
                </Link>
              </div>
            ))}
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          {paginate(
            richNotes.filter((note) => note.image),
            currentRichPage
          )
            .slice(0, showMoreRich ? richNotes.length : 4)
            .map((note) => (
              <div
                key={note.id}
                className="p-4 shadow-md rounded-lg border hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out"
              >
                {note.image && (
                  <img
                    src={note.image}
                    alt={note.title}
                    className="mb-2 w-full h-32 object-cover rounded"
                  />
                )}
                <h3 className="font-semibold">{note.title}</h3>
                <p className="text-gray-600">{note.description}</p>
                <Link
                  href={`/note/${note.id}`}
                  className="text-blue-500 mt-2 block"
                >
                  Xem chi tiết →
                </Link>
              </div>
            ))}
        </div>

        <button
          onClick={() => setShowMoreRich(!showMoreRich)}
          className="mt-4 text-blue-500 mx-auto block"
        >
          {showMoreRich ? "Ẩn bớt" : "Xem thêm"}
        </button>

        {showMoreRich && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setCurrentRichPage(currentRichPage - 1)}
              disabled={currentRichPage === 1}
              className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1"
            >
              &lt;
            </button>
            {Array.from({ length: totalRichPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentRichPage(index + 1)}
                className={`mx-1 px-4 py-2 rounded-full ${
                  currentRichPage === index + 1
                    ? "bg-purple-200 text-white p-4 border border-gray-400 shadow hover:shadow-lg"
                    : "bg-white text-gray-700 border border-gray-300 shadow-sm hover:shadow-md"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentRichPage(currentRichPage + 1)}
              disabled={currentRichPage === totalRichPages}
              className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1"
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* Khung 3: Ghi chú danh sách công việc */}
      <div className="border border-purple-300 rounded-lg p-4 bg-white hover:bg-gray-100 transition duration-300 ease-in-out">
        <h2 className="text-xl font-bold mb-4">
          📝 Ghi chú danh sách công việc
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {paginate(sketchNotes, currentSketchPage)
            .slice(0, showMoreSketch ? sketchNotes.length : 4)
            .map((note) => (
              <div
                key={note.id}
                className="p-4 shadow-md rounded-lg border hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out"
              >
                <h3 className="font-semibold">{note.title}</h3>
                <p className="text-gray-600">{note.description}</p>
                <Link
                  href={`/note/${note.id}`}
                  className="text-blue-500 mt-2 block"
                >
                  Xem chi tiết công việc →
                </Link>
              </div>
            ))}
        </div>

        <button
          onClick={() => setShowMoreSketch(!showMoreSketch)}
          className="mt-4 text-blue-500 mx-auto block"
        >
          {showMoreSketch ? "Ẩn bớt" : "Xem thêm"}
        </button>

        {showMoreSketch && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setCurrentSketchPage(currentSketchPage - 1)}
              disabled={currentSketchPage === 1}
              className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1"
            >
              &lt;
            </button>
            {Array.from({ length: totalSketchPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentSketchPage(index + 1)}
                className={`mx-1 px-4 py-2 rounded-full ${
                  currentSketchPage === index + 1
                    ? "bg-purple-200 text-white p-4 border border-gray-400 shadow hover:shadow-lg"
                    : "bg-white text-gray-700 border border-gray-300 shadow-sm hover:shadow-md"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentSketchPage(currentSketchPage + 1)}
              disabled={currentSketchPage === totalSketchPages}
              className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1"
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* Khung 4: Ghi chú bảng tính */}
      <div className="border border-purple-300 rounded-lg p-4 bg-white hover:bg-gray-100 transition duration-300 ease-in-out">
        <h2 className="text-xl font-bold mb-4">📊 Ghi chú bảng tính</h2>
        <div className="grid grid-cols-4 gap-4">
          {paginate(spreadsheetNotes, currentSpreadsheetPage)
            .slice(0, showMoreSpreadsheet ? spreadsheetNotes.length : 4)
            .map((note) => (
              <div
                key={note.id}
                className="p-4 shadow-md rounded-lg border hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out"
              >
                <h3 className="font-semibold">{note.title}</h3>
                <p className="text-gray-600">{note.description}</p>
                <Link
                  href={`/note/${note.id}`}
                  className="text-blue-500 mt-2 block"
                >
                  Đi đến bảng →
                </Link>
              </div>
            ))}
        </div>

        <button
          onClick={() => setShowMoreSpreadsheet(!showMoreSpreadsheet)}
          className="mt-4 text-blue-500 mx-auto block"
        >
          {showMoreSpreadsheet ? "Ẩn bớt" : "Xem thêm"}
        </button>

        {showMoreSpreadsheet && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() =>
                setCurrentSpreadsheetPage(currentSpreadsheetPage - 1)
              }
              disabled={currentSpreadsheetPage === 1}
              className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1"
            >
              &lt;
            </button>
            {Array.from({ length: totalSpreadsheetPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentSpreadsheetPage(index + 1)}
                className={`mx-1 px-4 py-2 rounded-full ${
                  currentSpreadsheetPage === index + 1
                    ? "bg-purple-200 text-white p-4 border border-gray-400 shadow hover:shadow-lg"
                    : "bg-white text-gray-700 border border-gray-300 shadow-sm hover:shadow-md"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentSpreadsheetPage(currentSpreadsheetPage + 1)
              }
              disabled={currentSpreadsheetPage === totalSpreadsheetPages}
              className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1"
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
