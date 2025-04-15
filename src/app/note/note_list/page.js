"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase2 } from "../../../lib/supabase";
import ChiTiet from "../../components/details";

export default function NoteList() {
  const [textNotes, setTextNotes] = useState([]);
  const [richNotesWithoutImage, setRichNotesWithoutImage] = useState([]);
  const [richNotesWithImage, setRichNotesWithImage] = useState([]);
  const [sketchNotes, setSketchNotes] = useState([]);
  const [spreadsheetNotes, setSpreadsheetNotes] = useState([]);
  const [filteredTextNotes, setFilteredTextNotes] = useState([]);
  const [filteredRichNotesWithoutImage, setFilteredRichNotesWithoutImage] = useState([]);
  const [filteredRichNotesWithImage, setFilteredRichNotesWithImage] = useState([]);
  const [filteredSketchNotes, setFilteredSketchNotes] = useState([]);
  const [filteredSpreadsheetNotes, setFilteredSpreadsheetNotes] = useState([]);
  const [pinnedNotes, setPinnedNotes] = useState(new Set());
  const [hiddenNotes, setHiddenNotes] = useState(new Set());
  const [pinInput, setPinInput] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [viewDetailNoteId, setViewDetailNoteId] = useState(null);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);

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

      const mappedNotes = data.map((note) => {
        let parsedTodos = [];
        let parsedSpreadsheetData = [];

        if (note.todos) {
          try {
            parsedTodos = JSON.parse(note.todos);
            if (!Array.isArray(parsedTodos)) parsedTodos = [];
          } catch (e) {
            console.error(`Error parsing todos for note ${note.id}:`, e);
          }
        }

        if (note.spreadsheet_data) {
          try {
            parsedSpreadsheetData = JSON.parse(note.spreadsheet_data);
            if (!Array.isArray(parsedSpreadsheetData))
              parsedSpreadsheetData = [];
          } catch (e) {
            console.error(
              `Error parsing spreadsheet_data for note ${note.id}:`,
              e
            );
          }
        }

        return {
          id: note.id,
          title: note.title,
          description: note.content || "", // Bỏ logic hiển thị "Không có nội dung"
          image: note.image_url,
          note_type: note.note_type,
          todos: parsedTodos,
          spreadsheet_data: parsedSpreadsheetData,
        };
      });

      setTextNotes(mappedNotes.filter((note) => note.note_type === "plain"));
      const richNotes = mappedNotes.filter((note) => note.note_type === "rich");
      setRichNotesWithoutImage(richNotes.filter((note) => !note.image));
      setRichNotesWithImage(richNotes.filter((note) => note.image));
      setSketchNotes(
        mappedNotes.filter((note) => note.note_type === "whiteboard")
      );
      setSpreadsheetNotes(
        mappedNotes.filter((note) => note.note_type === "spreadsheet")
      );

      setFilteredTextNotes(mappedNotes.filter((note) => note.note_type === "plain"));
      setFilteredRichNotesWithoutImage(richNotes.filter((note) => !note.image));
      setFilteredRichNotesWithImage(richNotes.filter((note) => note.image));
      setFilteredSketchNotes(mappedNotes.filter((note) => note.note_type === "whiteboard"));
      setFilteredSpreadsheetNotes(mappedNotes.filter((note) => note.note_type === "spreadsheet"));
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    const filterNotes = (notes, query) => {
      if (!query) return notes;
      return notes.filter((note) =>
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.description.toLowerCase().includes(query.toLowerCase())
      );
    };

    setFilteredTextNotes(filterNotes(textNotes, searchQuery));
    setFilteredRichNotesWithoutImage(filterNotes(richNotesWithoutImage, searchQuery));
    setFilteredRichNotesWithImage(filterNotes(richNotesWithImage, searchQuery));
    setFilteredSketchNotes(filterNotes(sketchNotes, searchQuery));
    setFilteredSpreadsheetNotes(filterNotes(spreadsheetNotes, searchQuery));

    setCurrentTextPage(1);
    setCurrentRichPage(1);
    setCurrentSketchPage(1);
    setCurrentSpreadsheetPage(1);
  }, [searchQuery, textNotes, richNotesWithoutImage, richNotesWithImage, sketchNotes, spreadsheetNotes]);

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

  const totalTextPages = Math.ceil(filteredTextNotes.length / notesPerPage);
  const totalRichWithoutImagePages = Math.ceil(
    filteredRichNotesWithoutImage.length / notesPerPage
  );
  const totalRichWithImagePages = Math.ceil(
    filteredRichNotesWithImage.length / notesPerPage
  );
  const totalSketchPages = Math.ceil(filteredSketchNotes.length / notesPerPage);
  const totalSpreadsheetPages = Math.ceil(
    filteredSpreadsheetNotes.length / notesPerPage
  );

  useEffect(() => {
    if (richNotesWithImage.length > 0) {
      const interval = setInterval(() => {
        setCurrentNoteIndex((prevIndex) =>
          prevIndex === richNotesWithImage.length - 1 ? 0 : prevIndex + 1
        );
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [richNotesWithImage.length]);

  const handlePrevNote = () => {
    setCurrentNoteIndex((prevIndex) =>
      prevIndex === 0 ? richNotesWithImage.length - 1 : prevIndex - 1
    );
  };

  const handleNextNote = () => {
    setCurrentNoteIndex((prevIndex) =>
      prevIndex === richNotesWithImage.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div
      className="mt-[73px] p-5 mb-[-7px] max-w-full mx-auto p-6 space-y-6 text-gray-700"
      onClick={closeContextMenu}
    >
      <div
        className="relative rounded-lg p-8 mb-8 flex items-center justify-between"
        style={{
          backgroundImage: "url('https://i.pinimg.com/736x/69/a6/b6/69a6b6c971b80d03662674282e422a37.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: "500px",
        }}
      >
        <div className="absolute inset-0 bg-black opacity-25 rounded-lg"></div>
        <div className="w-1/2 relative z-10">
          <h1 className="text-5xl font-bold mb-4 text-white">
            Discover the Best
            <br />
            Note-Taking Apps
          </h1>
          <p className="text-gray-200 mb-6">
            Explore top note-taking apps to boost your productivity. From simple
            text notes to rich media, find the perfect app for your needs. Start
            organizing your ideas today!
          </p>
          <div className="relative">
            <button
              onClick={() => setShowSearchInput(!showSearchInput)}
              className="flex items-center bg-white text-pink-500 px-4 py-2 rounded-full shadow-md hover:bg-gray-100 transition-all"
            >
              🔍 Search Notes
            </button>
            {showSearchInput && (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter title or description..."
                className="absolute top-12 left-0 w-full max-w-md border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all bg-white text-gray-700 z-20"
              />
            )}
          </div>
        </div>

        <div className="w-1/2 flex items-center justify-center relative z-10">
          <button
            onClick={handlePrevNote}
            className="absolute left-0 text-3xl text-white hover:text-gray-300 z-10"
          >
            {"<"}
          </button>
          {richNotesWithImage.length > 0 && (
            <div className="relative mx-4 transform scale-110 transition-all duration-500">
              <img
                src={richNotesWithImage[currentNoteIndex].image}
                alt={richNotesWithImage[currentNoteIndex].title}
                className="w-72 h-48 object-cover rounded-lg shadow-lg"
              />
              <h3 className="absolute bottom-0 left-0 w-full text-white font-medium text-lg bg-gradient-to-t from-black/80 to-transparent px-4 py-3 rounded-b-lg truncate">
                {richNotesWithImage[currentNoteIndex].title}
              </h3>
            </div>
          )}
          {richNotesWithImage.length > 0 && (
            <div className="relative transform scale-90 transition-all duration-500">
              <img
                src={
                  richNotesWithImage[
                    currentNoteIndex === 0
                      ? richNotesWithImage.length - 1
                      : currentNoteIndex - 1
                  ].image
                }
                alt={
                  richNotesWithImage[
                    currentNoteIndex === 0
                      ? richNotesWithImage.length - 1
                      : currentNoteIndex - 1
                  ].title
                }
                className="w-56 h-40 object-cover rounded-lg shadow-md opacity-70"
              />
              <h3 className="absolute bottom-0 left-0 w-full text-white font-medium text-base bg-gradient-to-t from-black/80 to-transparent px-3 py-2 rounded-b-lg truncate">
                {
                  richNotesWithImage[
                    currentNoteIndex === 0
                      ? richNotesWithImage.length - 1
                      : currentNoteIndex - 1
                  ].title
                }
              </h3>
            </div>
          )}
          {richNotesWithImage.length > 0 && (
            <div className="relative transform scale-90 transition-all duration-500">
              <img
                src={
                  richNotesWithImage[
                    currentNoteIndex === richNotesWithImage.length - 1
                      ? 0
                      : currentNoteIndex + 1
                  ].image
                }
                alt={
                  richNotesWithImage[
                    currentNoteIndex === richNotesWithImage.length - 1
                      ? 0
                      : currentNoteIndex + 1
                  ].title
                }
                className="w-56 h-40 object-cover rounded-lg shadow-md opacity-70"
              />
              <h3 className="absolute bottom-0 left-0 w-full text-white font-medium text-base bg-gradient-to-t from-black/80 to-transparent px-3 py-2 rounded-b-lg truncate">
                {
                  richNotesWithImage[
                    currentNoteIndex === richNotesWithImage.length - 1
                      ? 0
                      : currentNoteIndex + 1
                  ].title
                }
              </h3>
            </div>
          )}
          <button
            onClick={handleNextNote}
            className="absolute right-0 text-3xl text-white hover:text-gray-300 z-10"
          >
            {">"}
          </button>
        </div>
        <div className="absolute top-10 left-10 w-16 h-16 bg-pink-200 rounded-full opacity-50 z-0"></div>
        <div className="absolute bottom-10 left-20 w-12 h-12 bg-pink-200 rounded-full opacity-50 z-0"></div>
        <div className="absolute top-20 right-10 w-20 h-20 bg-pink-200 rounded-full opacity-50 z-0"></div>
      </div>

      {/* Khung 1: Ghi chú văn bản thuần */}
      <div className="border border-purple-300 rounded-lg p-4 bg-white hover:bg-gray-100 transition duration-300 ease-in-out">
        <h2 className="text-xl font-bold mb-4">📄 Ghi chú văn bản thuần</h2>
        <div className="grid grid-cols-1 gap-4">
          {paginate(filteredTextNotes, currentTextPage)
            .slice(0, showMoreText ? filteredTextNotes.length : 2)
            .map((note) => (
              <div
                key={note.id}
                className={`p-4 shadow-md rounded-lg border border-purple-300 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out ${
                  pinnedNotes.has(note.id) ? "bg-yellow-100" : ""
                } ${hiddenNotes.has(note.id) ? "opacity-50" : ""}`}
                onContextMenu={(e) => handleContextMenu(e, note.id)}
              >
                <div className="relative">
                  <h3 className="font-semibold inline">{note.title}</h3>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`absolute top-0 right-0 text-lg ${
                      pinnedNotes.has(note.id)
                        ? "text-yellow-500"
                        : "text-gray-400"
                    } hover:text-yellow-600 transition-colors duration-200`}
                    title={pinnedNotes.has(note.id) ? "Bỏ ghim" : "Ghim"}
                  >
                    📌
                  </button>
                </div>
                {note.description && !hiddenNotes.has(note.id) && (
                  <p className="text-gray-600">{note.description}</p>
                )}
                {hiddenNotes.has(note.id) && (
                  <p className="text-gray-600">Ghi chú này đã bị ẩn</p>
                )}
                {!hiddenNotes.has(note.id) && (
                  <button
                    onClick={() => setViewDetailNoteId(note.id)}
                    className="text-blue-500 mt-2 block hover:text-blue-600 transition-colors duration-200"
                  >
                    Xem chi tiết →
                  </button>
                )}
              </div>
            ))}
        </div>

        <button
          onClick={() => setShowMoreText(!showMoreText)}
          className="mt-4 text-blue-500 mx-auto block hover:text-blue-600 transition-colors duration-200"
        >
          {showMoreText ? "Ẩn bớt" : "Xem thêm"}
        </button>

        {showMoreText && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setCurrentTextPage(currentTextPage - 1)}
              disabled={currentTextPage === 1}
              className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1 hover:bg-gray-100 transition-colors duration-200"
            >
              {"<"}
            </button>
            {Array.from({ length: totalTextPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentTextPage(index + 1)}
                className={`mx-1 px-4 py-2 rounded-full transition-all duration-200 ${
                  currentTextPage === index + 1
                    ? "bg-purple-200 text-white p-4 border border-gray-400 shadow hover:shadow-lg"
                    : "bg-white text-gray-700 border border-gray-300 shadow-sm hover:shadow-md hover:bg-gray-100"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentTextPage(currentTextPage + 1)}
              disabled={currentTextPage === totalTextPages}
              className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1 hover:bg-gray-100 transition-colors duration-200"
            >
              {">"}
            </button>
          </div>
        )}
      </div>

      {/* Khung 2: Ghi chú văn bản phong phú */}
      <div className="border border-purple-300 rounded-lg p-4 bg-white hover:bg-gray-100 transition duration-300 ease-in-out">
        <h2 className="text-xl font-bold mb-4">🖼️ Ghi chú văn bản phong phú</h2>

        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {paginate(filteredRichNotesWithoutImage, currentRichPage)
              .slice(0, showMoreRich ? filteredRichNotesWithoutImage.length : 4)
              .map((note) => (
                <div
                  key={note.id}
                  className={`p-4 shadow-md rounded-lg border border-purple-300 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out ${
                    pinnedNotes.has(note.id) ? "bg-yellow-100" : ""
                  } ${hiddenNotes.has(note.id) ? "opacity-50" : ""}`}
                  onContextMenu={(e) => handleContextMenu(e, note.id)}
                >
                  <div className="relative">
                    <h3 className="font-semibold inline">{note.title}</h3>
                    <button
                      onClick={() => togglePin(note.id)}
                      className={`absolute top-0 right-0 text-lg ${
                        pinnedNotes.has(note.id)
                          ? "text-yellow-500"
                          : "text-gray-400"
                      } hover:text-yellow-600 transition-colors duration-200`}
                      title={pinnedNotes.has(note.id) ? "Bỏ ghim" : "Ghim"}
                    >
                      📌
                    </button>
                  </div>
                  {note.description && !hiddenNotes.has(note.id) && (
                    <p className="text-gray-600 min-h-[40px] line-clamp-2">{note.description}</p>
                  )}
                  {hiddenNotes.has(note.id) && (
                    <p className="text-gray-600 min-h-[40px] line-clamp-2">Ghi chú này đã bị ẩn</p>
                  )}
                  {!hiddenNotes.has(note.id) && (
                    <button
                      onClick={() => setViewDetailNoteId(note.id)}
                      className="text-blue-500 mt-2 block hover:text-blue-600 transition-colors duration-200"
                    >
                      Xem chi tiết →
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {paginate(filteredRichNotesWithImage, currentRichPage)
              .slice(0, showMoreRich ? filteredRichNotesWithImage.length : 4)
              .map((note) => (
                <div
                  key={note.id}
                  className={`p-4 shadow-md rounded-lg border border-purple-300 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out ${
                    pinnedNotes.has(note.id) ? "bg-yellow-100" : ""
                  } ${hiddenNotes.has(note.id) ? "opacity-50" : ""}`}
                  onContextMenu={(e) => handleContextMenu(e, note.id)}
                >
                  <div className="relative">
                    {note.image && !hiddenNotes.has(note.id) && (
                      <img
                        src={note.image}
                        alt={note.title}
                        className="w-full h-32 object-cover rounded mb-2 transition-opacity duration-300 hover:opacity-90"
                      />
                    )}
                    <h3 className="font-semibold inline">{note.title}</h3>
                    <button
                      onClick={() => togglePin(note.id)}
                      className={`absolute top-0 right-0 text-lg ${
                        pinnedNotes.has(note.id)
                          ? "text-yellow-500"
                          : "text-gray-400"
                      } hover:text-yellow-600 transition-colors duration-200`}
                      title={pinnedNotes.has(note.id) ? "Bỏ ghim" : "Ghim"}
                    >
                      📌
                    </button>
                  </div>
                  {note.description && !hiddenNotes.has(note.id) && (
                    <p className="text-gray-600 min-h-[40px] line-clamp-2">{note.description}</p>
                  )}
                  {hiddenNotes.has(note.id) && (
                    <p className="text-gray-600 min-h-[40px] line-clamp-2">Ghi chú này đã bị ẩn</p>
                  )}
                  {!hiddenNotes.has(note.id) && (
                    <button
                      onClick={() => setViewDetailNoteId(note.id)}
                      className="text-blue-500 mt-2 block hover:text-blue-600 transition-colors duration-200"
                    >
                      Xem chi tiết →
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>

        <button
          onClick={() => setShowMoreRich(!showMoreRich)}
          className="mt-4 text-blue-500 mx-auto block hover:text-blue-600 transition-colors duration-200"
        >
          {showMoreRich ? "Ẩn bớt" : "Xem thêm"}
        </button>

        {showMoreRich && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setCurrentRichPage(currentRichPage - 1)}
              disabled={currentRichPage === 1}
              className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1 hover:bg-gray-100 transition-colors duration-200"
            >
              {"<"}
            </button>
            {Array.from(
              { length: Math.max(totalRichWithoutImagePages, totalRichWithImagePages) },
              (_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentRichPage(index + 1)}
                  className={`mx-1 px-4 py-2 rounded-full transition-all duration-200 ${
                    currentRichPage === index + 1
                      ? "bg-purple-200 text-white p-4 border border-gray-400 shadow hover:shadow-lg"
                      : "bg-white text-gray-700 border border-gray-300 shadow-sm hover:shadow-md hover:bg-gray-100"
                  }`}
                >
                  {index + 1}
                </button>
              )
            )}
            <button
              onClick={() => setCurrentRichPage(currentRichPage + 1)}
              disabled={currentRichPage === Math.max(totalRichWithoutImagePages, totalRichWithImagePages)}
              className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1 hover:bg-gray-100 transition-colors duration-200"
            >
              {">"}
            </button>
          </div>
        )}
      </div>

      {/* Khung 3: Ghi chú danh sách công việc */}
      <div className="border border-purple-300 rounded-lg p-4 bg-white hover:bg-gray-100 transition duration-300 ease-in-out">
        <h2 className="text-xl font-bold mb-4">📝 Ghi chú danh sách công việc</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginate(filteredSketchNotes, currentSketchPage)
            .slice(0, showMoreSketch ? filteredSketchNotes.length : 4)
            .map((note) => (
              <div
                key={note.id}
                className={`p-4 shadow-md rounded-lg border border-purple-300 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out ${
                  pinnedNotes.has(note.id) ? "bg-yellow-100" : ""
                } ${hiddenNotes.has(note.id) ? "opacity-50" : ""}`}
                onContextMenu={(e) => handleContextMenu(e, note.id)}
              >
                <div className="relative">
                  <h3 className="font-semibold inline">{note.title}</h3>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`absolute top-0 right-0 text-lg ${
                      pinnedNotes.has(note.id)
                        ? "text-yellow-500"
                        : "text-gray-400"
                    } hover:text-yellow-600 transition-colors duration-200`}
                    title={pinnedNotes.has(note.id) ? "Bỏ ghim" : "Ghim"}
                  >
                    📌
                  </button>
                </div>
                {note.description && !hiddenNotes.has(note.id) && (
                  <p className="text-gray-600 min-h-[40px] line-clamp-2">{note.description}</p>
                )}
                {note.todos && note.todos.length > 0 && !hiddenNotes.has(note.id) && (
                  <ul className="list-disc pl-5 min-h-[60px] line-clamp-3">
                    {note.todos.slice(0, 3).map((todo, index) => (
                      <li
                        key={index}
                        className={todo.completed ? "line-through text-gray-500" : ""}
                      >
                        {todo.text}
                      </li>
                    ))}
                  </ul>
                )}
                {hiddenNotes.has(note.id) && (
                  <p className="text-gray-600 min-h-[40px] line-clamp-2">Ghi chú này đã bị ẩn</p>
                )}
                {!hiddenNotes.has(note.id) && (
                  <button
                    onClick={() => setViewDetailNoteId(note.id)}
                    className="text-blue-500 mt-2 block hover:text-blue-600 transition-colors duration-200"
                  >
                    Xem chi tiết công việc →
                  </button>
                )}
              </div>
            ))}
        </div>

        <button
          onClick={() => setShowMoreSketch(!showMoreSketch)}
          className="mt-4 text-blue-500 mx-auto block hover:text-blue-600 transition-colors duration-200"
        >
          {showMoreSketch ? "Ẩn bớt" : "Xem thêm"}
        </button>

        {showMoreSketch && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setCurrentSketchPage(currentSketchPage - 1)}
              disabled={currentSketchPage === 1}
              className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1 hover:bg-gray-100 transition-colors duration-200"
            >
              {"<"}
            </button>
            {Array.from({ length: totalSketchPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentSketchPage(index + 1)}
                className={`mx-1 px-4 py-2 rounded-full transition-all duration-200 ${
                  currentSketchPage === index + 1
                    ? "bg-purple-200 text-white p-4 border border-gray-400 shadow hover:shadow-lg"
                    : "bg-white text-gray-700 border border-gray-300 shadow-sm hover:shadow-md hover:bg-gray-100"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentSketchPage(currentSketchPage + 1)}
              disabled={currentSketchPage === totalSketchPages}
              className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1 hover:bg-gray-100 transition-colors duration-200"
            >
              {">"}
            </button>
          </div>
        )}
      </div>

      {/* Khung 4: Ghi chú bảng tính */}
      <div className="border border-purple-300 rounded-lg p-4 bg-white hover:bg-gray-100 transition duration-300 ease-in-out">
        <h2 className="text-xl font-bold mb-4">📊 Ghi chú bảng tính</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginate(filteredSpreadsheetNotes, currentSpreadsheetPage)
            .slice(0, showMoreSpreadsheet ? filteredSpreadsheetNotes.length : 4)
            .map((note) => (
              <div
                key={note.id}
                className={`p-4 shadow-md rounded-lg border border-purple-300 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out ${
                  pinnedNotes.has(note.id) ? "bg-yellow-100" : ""
                } ${hiddenNotes.has(note.id) ? "opacity-50" : ""}`}
                onContextMenu={(e) => handleContextMenu(e, note.id)}
              >
                <div className="relative">
                  <h3 className="font-semibold inline">{note.title}</h3>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`absolute top-0 right-0 text-lg ${
                      pinnedNotes.has(note.id)
                        ? "text-yellow-500"
                        : "text-gray-400"
                    } hover:text-yellow-600 transition-colors duration-200`}
                    title={pinnedNotes.has(note.id) ? "Bỏ ghim" : "Ghim"}
                  >
                    📌
                  </button>
                </div>
                {note.description && !hiddenNotes.has(note.id) && (
                  <p className="text-gray-600 min-h-[40px] line-clamp-2">{note.description}</p>
                )}
                {note.spreadsheet_data && note.spreadsheet_data.length > 0 && !hiddenNotes.has(note.id) && (
                  <div className="overflow-x-auto min-h-[80px]">
                    <table className="border-collapse border border-purple-300 text-sm">
                      <tbody>
                        {note.spreadsheet_data.slice(0, 3).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.slice(0, 3).map((cell, colIndex) => (
                              <td key={colIndex} className="border border-purple-300 p-1">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <small>
                      (Hiển thị 3x3, tổng {note.spreadsheet_data.length}x
                      {note.spreadsheet_data[0]?.length || 0})
                    </small>
                  </div>
                )}
                {hiddenNotes.has(note.id) && (
                  <p className="text-gray-600 min-h-[40px] line-clamp-2">Ghi chú này đã bị ẩn</p>
                )}
                {!hiddenNotes.has(note.id) && (
                  <button
                    onClick={() => setViewDetailNoteId(note.id)}
                    className="text-blue-500 mt-2 block hover:text-blue-600 transition-colors duration-200"
                  >
                    Đi đến bảng →
                  </button>
                )}
              </div>
            ))}
        </div>

        <button
          onClick={() => setShowMoreSpreadsheet(!showMoreSpreadsheet)}
          className="mt-4 text-blue-500 mx-auto block hover:text-blue-600 transition-colors duration-200"
        >
          {showMoreSpreadsheet ? "Ẩn bớt" : "Xem thêm"}
        </button>

        {showMoreSpreadsheet && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setCurrentSpreadsheetPage(currentSpreadsheetPage - 1)}
              disabled={currentSpreadsheetPage === 1}
              className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1 hover:bg-gray-100 transition-colors duration-200"
            >
              {"<"}
            </button>
            {Array.from({ length: totalSpreadsheetPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentSpreadsheetPage(index + 1)}
                className={`mx-1 px-4 py-2 rounded-full transition-all duration-200 ${
                  currentSpreadsheetPage === index + 1
                    ? "bg-purple-200 text-white p-4 border border-gray-400 shadow hover:shadow-lg"
                    : "bg-white text-gray-700 border border-gray-300 shadow-sm hover:shadow-md hover:bg-gray-100"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentSpreadsheetPage(currentSpreadsheetPage + 1)}
              disabled={currentSpreadsheetPage === totalSpreadsheetPages}
              className="bg-white border border-gray-300 rounded-full px-4 py-2 mx-1 hover:bg-gray-100 transition-colors duration-200"
            >
              {">"}
            </button>
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => hideNote(contextMenu.noteId)}
            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
          >
            Ẩn ghi chú
          </button>
        </div>
      )}

      {showPinModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Nhập mã PIN để xem ghi chú</h3>
            <input
              type="text"
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
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors duration-200"
              >
                Hủy
              </button>
              <button
                onClick={verifyPin}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {viewDetailNoteId && (
        <ChiTiet noteId={viewDetailNoteId} onClose={() => setViewDetailNoteId(null)} />
      )}
    </div>
  );
}