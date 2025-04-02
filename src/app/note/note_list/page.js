// pages/note-list.js (hoặc file chứa NoteList)
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase2 } from "../../../lib/supabase";
import { FaThumbtack } from "react-icons/fa";
import ChiTiet from "../../components/details"; // Import component xem chi tiet

export default function NoteList() {
  const [textNotes, setTextNotes] = useState([]);
  const [richNotes, setRichNotes] = useState([]);
  const [sketchNotes, setSketchNotes] = useState([]);
  const [spreadsheetNotes, setSpreadsheetNotes] = useState([]);
  const [pinnedNotes, setPinnedNotes] = useState(new Set());
  const [hiddenNotes, setHiddenNotes] = useState(new Set());
  const [pinInput, setPinInput] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [viewDetailNoteId, setViewDetailNoteId] = useState(null); // Trạng thái để hiển thị chi tiết ghi chú

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
  const PIN = "1234";

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
        description:
          note.content && note.content.length > 0
            ? note.content.slice(0, 50) + "..."
            : "Không có nội dung",
        image: note.image_url,
        note_type: note.note_type,
      }));

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

  const togglePin = (noteId) => {
    setPinnedNotes((prev) => {
      const newPinned = new Set(prev);
      if (newPinned.has(noteId)) {
        newPinned.delete(noteId);
      } else {
        newPinned.add(noteId);
      }
      return newPinned;
    });
  };

  const hideNote = (noteId) => {
    setHiddenNotes((prev) => new Set(prev).add(noteId));
    setContextMenu(null);
  };

  const handleContextMenu = (e, noteId) => {
    e.preventDefault();
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      noteId,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const verifyPin = () => {
    if (pinInput === PIN) {
      setHiddenNotes((prev) => {
        const newHidden = new Set(prev);
        newHidden.delete(selectedNoteId);
        return newHidden;
      });
      setShowPinModal(false);
      setPinInput("");
      setSelectedNoteId(null);
    } else {
      alert("Mã PIN không đúng!");
      setPinInput("");
    }
  };

  const checkHiddenNote = (noteId) => {
    if (hiddenNotes.has(noteId)) {
      setSelectedNoteId(noteId);
      setShowPinModal(true);
      return true;
    }
    return false;
  };

  const paginate = (notes, currentPage) => {
    const indexOfLastNote = currentPage * notesPerPage;
    const indexOfFirstNote = indexOfLastNote - notesPerPage;
    const sortedNotes = [...notes].sort((a, b) => {
      if (pinnedNotes.has(a.id) && !pinnedNotes.has(b.id)) return -1;
      if (!pinnedNotes.has(a.id) && pinnedNotes.has(b.id)) return 1;
      return 0;
    });
    return sortedNotes.slice(indexOfFirstNote, indexOfLastNote);
  };

  const totalTextPages = Math.ceil(textNotes.length / notesPerPage);
  const totalRichPages = Math.ceil(richNotes.length / notesPerPage);
  const totalSketchPages = Math.ceil(sketchNotes.length / notesPerPage);
  const totalSpreadsheetPages = Math.ceil(
    spreadsheetNotes.length / notesPerPage
  );

  return (
    <div
      className="mt-[73px] p-5 mb-[-7px] max-w-full mx-auto p-6 space-y-6 text-gray-700"
      onClick={closeContextMenu}
    >
      {/* Khung 1: Ghi chú văn bản thuần */}
      <div className="border border-purple-300 rounded-lg p-4 bg-white hover:bg-gray-100 transition duration-300 ease-in-out">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse">
          📄 Ghi chú văn bản thuần
        </h1>
        <h2 className="text-xl font-bold mb-4">📄 Ghi chú văn bản thuần</h2>
        <div className="grid grid-cols-1 gap-4">
          {paginate(textNotes, currentTextPage)
            .slice(0, showMoreText ? textNotes.length : 2)
            .map((note) => (
              <div
                key={note.id}
                className={`p-4 shadow-md rounded-lg border hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out ${
                  pinnedNotes.has(note.id) ? "bg-yellow-100" : ""
                } ${hiddenNotes.has(note.id) ? "opacity-50" : ""}`}
                onContextMenu={(e) => handleContextMenu(e, note.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{note.title}</h3>
                    <p className="text-gray-600">
                      {hiddenNotes.has(note.id)
                        ? "Ghi chú này đã bị ẩn"
                        : note.description}
                    </p>
                    {!hiddenNotes.has(note.id) && (
                      <button
                        onClick={() => setViewDetailNoteId(note.id)}
                        className="text-blue-500 mt-2 block"
                      >
                        Xem chi tiết →
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`text-xl ${
                      pinnedNotes.has(note.id)
                        ? "text-yellow-500"
                        : "text-gray-400"
                    } hover:text-yellow-600`}
                    title={pinnedNotes.has(note.id) ? "Bỏ ghim" : "Ghim"}
                  >
                    <FaThumbtack />
                  </button>
                </div>
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
              {"<"}
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
              {">"}
            </button>
          </div>
        )}
      </div>

      {/* Khung 2: Ghi chú văn bản phong phú */}
      <div className="border border-purple-300 rounded-lg p-4 bg-white hover:bg-gray-100 transition duration-300 ease-in-out">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse">
          🖼️ Ghi chú văn bản phong phú
        </h1>
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
                className={`p-4 shadow-md rounded-lg border hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out ${
                  pinnedNotes.has(note.id) ? "bg-yellow-100" : ""
                } ${hiddenNotes.has(note.id) ? "opacity-50" : ""}`}
                onContextMenu={(e) => handleContextMenu(e, note.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{note.title}</h3>
                    <p className="text-gray-600">
                      {hiddenNotes.has(note.id)
                        ? "Ghi chú này đã bị ẩn"
                        : note.description}
                    </p>
                    {!hiddenNotes.has(note.id) && (
                      <button
                        onClick={() => setViewDetailNoteId(note.id)}
                        className="text-blue-500 mt-2 block"
                      >
                        Xem chi tiết →
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`text-xl ${
                      pinnedNotes.has(note.id)
                        ? "text-yellow-500"
                        : "text-gray-400"
                    } hover:text-yellow-600`}
                    title={pinnedNotes.has(note.id) ? "Bỏ ghim" : "Ghim"}
                  >
                    <FaThumbtack />
                  </button>
                </div>
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
                className={`p-4 shadow-md rounded-lg border hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out ${
                  pinnedNotes.has(note.id) ? "bg-yellow-100" : ""
                } ${hiddenNotes.has(note.id) ? "opacity-50" : ""}`}
                onContextMenu={(e) => handleContextMenu(e, note.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    {note.image && !hiddenNotes.has(note.id) && (
                      <img
                        src={note.image}
                        alt={note.title}
                        className="mb-2 w-full h-32 object-cover rounded"
                      />
                    )}
                    <h3 className="font-semibold">{note.title}</h3>
                    <p className="text-gray-600">
                      {hiddenNotes.has(note.id)
                        ? "Ghi chú này đã bị ẩn"
                        : note.description}
                    </p>
                    {!hiddenNotes.has(note.id) && (
                      <button
                        onClick={() => setViewDetailNoteId(note.id)}
                        className="text-blue-500 mt-2 block"
                      >
                        Xem chi tiết →
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`text-xl ${
                      pinnedNotes.has(note.id)
                        ? "text-yellow-500"
                        : "text-gray-400"
                    } hover:text-yellow-600`}
                    title={pinnedNotes.has(note.id) ? "Bỏ ghim" : "Ghim"}
                  >
                    <FaThumbtack />
                  </button>
                </div>
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
              {"<"}
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
              {">"}
            </button>
          </div>
        )}
      </div>

      {/* Khung 3: Ghi chú danh sách công việc */}
      <div className="border border-purple-300 rounded-lg p-4 bg-white hover:bg-gray-100 transition duration-300 ease-in-out">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse">
          📝 Ghi chú danh sách công việc
        </h1>
        <h2 className="text-xl font-bold mb-4">
          📝 Ghi chú danh sách công việc
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {paginate(sketchNotes, currentSketchPage)
            .slice(0, showMoreSketch ? sketchNotes.length : 4)
            .map((note) => (
              <div
                key={note.id}
                className={`p-4 shadow-md rounded-lg border hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out ${
                  pinnedNotes.has(note.id) ? "bg-yellow-100" : ""
                } ${hiddenNotes.has(note.id) ? "opacity-50" : ""}`}
                onContextMenu={(e) => handleContextMenu(e, note.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{note.title}</h3>
                    <p className="text-gray-600">
                      {hiddenNotes.has(note.id)
                        ? "Ghi chú này đã bị ẩn"
                        : note.description}
                    </p>
                    {!hiddenNotes.has(note.id) && (
                      <button
                        onClick={() => setViewDetailNoteId(note.id)}
                        className="text-blue-500 mt-2 block"
                      >
                        Xem chi tiết công việc →
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`text-xl ${
                      pinnedNotes.has(note.id)
                        ? "text-yellow-500"
                        : "text-gray-400"
                    } hover:text-yellow-600`}
                    title={pinnedNotes.has(note.id) ? "Bỏ ghim" : "Ghim"}
                  >
                    <FaThumbtack />
                  </button>
                </div>
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
              {"<"}
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
              {">"}
            </button>
          </div>
        )}
      </div>

      {/* Khung 4: Ghi chú bảng tính */}
      <div className="border border-purple-300 rounded-lg p-4 bg-white hover:bg-gray-100 transition duration-300 ease-in-out">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse">
          📊 Ghi chú bảng tính
        </h1>
        <h2 className="text-xl font-bold mb-4">📊 Ghi chú bảng tính</h2>
        <div className="grid grid-cols-4 gap-4">
          {paginate(spreadsheetNotes, currentSpreadsheetPage)
            .slice(0, showMoreSpreadsheet ? spreadsheetNotes.length : 4)
            .map((note) => (
              <div
                key={note.id}
                className={`p-4 shadow-md rounded-lg border hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out ${
                  pinnedNotes.has(note.id) ? "bg-yellow-100" : ""
                } ${hiddenNotes.has(note.id) ? "opacity-50" : ""}`}
                onContextMenu={(e) => handleContextMenu(e, note.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{note.title}</h3>
                    <p className="text-gray-600">
                      {hiddenNotes.has(note.id)
                        ? "Ghi chú này đã bị ẩn"
                        : note.description}
                    </p>
                    {!hiddenNotes.has(note.id) && (
                      <button
                        onClick={() => setViewDetailNoteId(note.id)}
                        className="text-blue-500 mt-2 block"
                      >
                        Đi đến bảng →
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`text-xl ${
                      pinnedNotes.has(note.id)
                        ? "text-yellow-500"
                        : "text-gray-400"
                    } hover:text-yellow-600`}
                    title={pinnedNotes.has(note.id) ? "Bỏ ghim" : "Ghim"}
                  >
                    <FaThumbtack />
                  </button>
                </div>
              </div>
            ))}
 🙂        </div>

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
              {"<"}
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
              {">"}
            </button>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => hideNote(contextMenu.noteId)}
            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Ẩn ghi chú
          </button>
        </div>
      )}

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">
              Nhập mã PIN để xem ghi chú
            </h3>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mb-4"
              placeholder="Mã PIN"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPinInput("");
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={verifyPin}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hiển thị chi tiết ghi chú */}
      {viewDetailNoteId && (
        <ChiTiet
          noteId={viewDetailNoteId}
          onClose={() => setViewDetailNoteId(null)}
        />
      )}
    </div>
  );
}