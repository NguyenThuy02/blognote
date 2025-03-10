"use client";
import { useState } from 'react';

export default function ManageNotes() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const notesData = {
    personal: [
      { text: 'Ghi chú cá nhân 1', hasImage: false },
      { text: 'Ghi chú cá nhân 2', hasImage: false },
      { text: 'Ghi chú cá nhân 3', hasImage: true, imageUrl:'https://i.pinimg.com/736x/ab/0a/13/ab0a13b9b5e2bdf193238e794b3bbe65.jpg' },
     { text: 'Ghi chú cá nhân 3', hasImage: true, imageUrl: 'https://i.pinimg.com/736x/05/39/05/05390596523ca22d94b74db1de3bb244.jpg' }, 
     { text: 'Ghi chú cá nhân 3', hasImage: true, imageUrl: 'https://i.pinimg.com/736x/6a/a5/4d/6aa54d3644ea3f9fde973eb87a009df9.jpg' },
     { text: 'Ghi chú cá nhân 3', hasImage: true, imageUrl: 'https://i.pinimg.com/736x/5b/a3/0c/5ba30c0ae5d44f76ad1ba4a18b941241.jpg' },

    ],
    study: [
      { text: 'Ghi chú học tập 1', hasImage: false },
      { text: 'Ghi chú học tập 2', hasImage: true, imageUrl: 'https://i.pinimg.com/736x/43/ae/13/43ae1381774c7374bedd5171063ca3d1.jpg' },
      { text: 'Ghi chú học tập 3', hasImage: true, imageUrl: 'https://i.pinimg.com/736x/56/60/72/56607222ae48dde87306294ea58003a3.jpg' },
      { text: 'Ghi chú học tập 3', hasImage: true, imageUrl: 'https://i.pinimg.com/736x/cb/fe/6d/cbfe6d1b8271b1e2a9ddac9e4cd313c7.jpg' },
    ],
    entertainment: [
      { text: 'Ghi chú giải trí 1', hasImage: false },
      { text: 'Ghi chú giải trí 2', hasImage: false },
      { text: 'Ghi chú giải trí 3', hasImage: false },
      { text: 'Ghi chú giải trí 4', hasImage: false },
      { text: 'Ghi chú giải trí 5', hasImage: true, imageUrl: 'https://i.pinimg.com/736x/16/42/81/1642817d803ae3206a85ed17e5b6cc23.jpg' },
      { text: 'Ghi chú giải trí 6', hasImage: true, imageUrl: 'https://i.pinimg.com/474x/4c/f5/ae/4cf5aeb69bac83339e5654083d446c82.jpg' },
      { text: 'Ghi chú giải trí 7', hasImage: true, imageUrl: 'https://i.pinimg.com/236x/88/80/9b/88809beb271f60f6f26cc3a21ac652ce.jpg' },
      { text: 'Ghi chú giải trí 8', hasImage: true, imageUrl: 'https://i.pinimg.com/736x/07/1c/af/071caffde4d588628910ae3f3fcc61d2.jpg' },
    ],
    upload: [
      { text: 'Ghi chú đăng tải 1', hasImage: false },
      { text: 'Ghi chú đăng tải 2', hasImage: true, imageUrl: 'https://i.pinimg.com/736x/98/5b/c8/985bc87b0c68473e1a1e7e18cf31e7b8.jpg' },
      { text: 'Ghi chú đăng tải 3', hasImage: true, imageUrl: 'https://i.pinimg.com/736x/e7/d5/b4/e7d5b421d5829a7a5e50849a510bc2fe.jpg' },
      { text: 'Ghi chú đăng tải 4', hasImage: true, imageUrl: 'https://i.pinimg.com/736x/b0/d5/bf/b0d5bfa6056056112b1ff4dc5c3a38c2.jpg' },
      { text: 'Ghi chú đăng tải 5', hasImage: true, imageUrl: 'https://i.pinimg.com/736x/b2/a6/74/b2a674a2efcb6a4742c555439024c5f9.jpg' },
    ],
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 border-2 border-gray-300 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">🛠️ Quản lý Ghi Chú</h1>
      
      {/* Note Categories */}
      <div className="grid grid-cols-4 gap-4">
        {['personal', 'study', 'entertainment', 'upload'].map((category) => (
          <div
            key={category}
            className={`p-4 shadow-lg rounded-lg border cursor-pointer transition-transform duration-300 hover:scale-110 hover:shadow-xl ${
              category === 'personal' ? 'bg-gradient-to-r from-blue-200 to-blue-300' :
              category === 'study' ? 'bg-gradient-to-r from-blue-300 to-purple-300' :
              category === 'entertainment' ? 'bg-gradient-to-r from-purple-200 to-purple-300' :
              'bg-gradient-to-r from-purple-300 to-blue-200'
            }`}
            onClick={() => handleCategoryClick(category)}
          >
            <h3 className="font-semibold text-black">📒 {category.charAt(0).toUpperCase() + category.slice(1)}</h3>
          </div>
        ))}
      </div>

      {/* Notes Section */}
      {selectedCategory && (
        <div className="mt-6">
          {/* Notes without images */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {notesData[selectedCategory].filter(note => !note.hasImage).map((note, index) => (
              <div key={index} className="bg-white p-4 shadow-md rounded-lg border transition-transform duration-300 hover:shadow-lg transform hover:-translate-y-1">
                <h3 className="font-semibold">📝 {note.text}</h3>
                <div className="flex gap-2 mt-2">
                  <button className="px-4 py-1 bg-blue-300 text-white rounded transition-transform duration-300 hover:scale-105">Sửa</button>
                  <button className="px-4 py-1 bg-purple-300 text-white rounded transition-transform duration-300 hover:scale-105">Xóa</button>
                </div>
              </div>
            ))}
          </div>

          {/* Notes with images */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {notesData[selectedCategory].filter(note => note.hasImage).map((note, index) => (
              <div key={index} className="bg-white p-4 shadow-md rounded-lg border transition-transform duration-300 hover:shadow-lg transform hover:-translate-y-1">
                <h3 className="font-semibold">📝 {note.text}</h3>
                <img src={note.imageUrl} alt={note.text} className="mt-2 rounded transition-transform duration-300 hover:scale-105" />
                <div className="flex gap-2 mt-2">
                  <button className="px-4 py-1 bg-blue-300 text-white rounded transition-transform duration-300 hover:scale-105">Sửa</button>
                  <button className="px-4 py-1 bg-purple-300 text-white rounded transition-transform duration-300 hover:scale-105">Xóa</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}