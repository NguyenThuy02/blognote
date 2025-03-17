"use client"; // Mark component as Client Component

import { useState, useEffect } from "react"; // Import hooks
import { supabase2 } from "./../../lib/supabase"; // Path to your Supabase client

export default function NotePage() {
  const [title, setTitle] = useState(""); // State to hold note title
  const [notes, setNotes] = useState([]); // State to hold the list of notes

  // Function to fetch notes from Supabase
  const fetchNotes = async () => {
    const { data, error } = await supabase2.from("notes").select("*");
    if (error) {
      console.error("Error fetching notes:", error.message);
    } else {
      setNotes(data || []); // Update state with fetched notes
    }
  };

  // Function to handle form submission (adding a new note)
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    const { data, error } = await supabase2.from("notes").insert([{ title }]); // Insert the new note into the table

    if (error) {
      console.error("Error adding note:", error.message);
    } else {
      setTitle(""); // Reset the input field after submission
      fetchNotes(); // Fetch updated list of notes after adding the new one
    }
  };

  // Fetch notes when the component mounts
  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div className="mt-[97px] p-5 mb-[-7px] container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Quản lý ghi chú</h1>
      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded flex-1"
          placeholder="Nhập tiêu đề ghi chú..."
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Thêm
        </button>
      </form>
      <ul className="space-y-2">
        {notes.length > 0 ? (
          notes.map((note) => (
            <li key={note.id} className="p-2 bg-gray-100 rounded">
              {note.title || "Không có tiêu đề"}
            </li>
          ))
        ) : (
          <li className="p-2">Không có ghi chú nào.</li>
        )}
      </ul>
    </div>
  );
}
