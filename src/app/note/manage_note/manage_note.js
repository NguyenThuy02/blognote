export default function ManageNotes() {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">🛠️ Quản lý Ghi Chú</h1>
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3].map((note) => (
            <div key={note} className="bg-white p-4 shadow rounded-lg border">
              <h3 className="font-semibold">📝 Ghi chú {note}</h3>
              <div className="flex gap-2 mt-2">
                <button className="px-4 py-1 bg-yellow-500 text-white rounded">
                  Sửa
                </button>
                <button className="px-4 py-1 bg-red-500 text-white rounded">
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  