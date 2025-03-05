import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-400">
            Smart Notes Dashboard
          </h1>
          {/* Search Bar */}
          <div className="relative w-1/2">
            <input
              type="text"
              placeholder="Search your notes..."
              className="border border-gray-300 rounded-full px-4 py-2 pr-10 focus:outline-none focus:border-blue-400 focus:ring focus:ring-blue-300 transition duration-200 w-full shadow-md"
            />
            <button className="absolute right-0 top-0 mt-2 mr-2 bg-gradient-to-r from-blue-500 to-purple-400 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gradient-to-l transition duration-200">
              🔍
            </button>
          </div>
        </div>

        {/* Introduction Section */}
        <div className="p-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Welcome to Smart Notes</h2>
          <p className="text-gray-600 mt-2">
            Your intelligent companion for managing notes. Organize, search, and create notes effortlessly. 
            Enhance your productivity with our user-friendly tools designed for optimal learning.
          </p>
        </div>

        {/* Courses Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Note Card */}
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow">
              <Image src="/note_image.svg" alt="Note Image" width={150} height={100} />
              <h3 className="text-lg font-semibold text-gray-800 mt-2">Note Title {index + 1}</h3>
              <p className="text-gray-600">Brief description of the note...</p>
              <p className="mt-2 font-semibold">Created by: User {index + 1}</p>
            </div>
          ))}
        </div>

        {/* Calendar Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-800">Upcoming Events</h2>
          <div className="bg-white p-4 rounded-lg shadow mt-4">
            {/* Placeholder for Calendar */}
            <p className="text-gray-500">[Calendar Component Here]</p>
          </div>
        </div>
      </main>
    </div>
  );
}