import { useRouter } from 'next/router';
import CalendarPage from './calendar_page'; // Đảm bảo đường dẫn đúng

const TestPage = () => {
  const router = useRouter();

  const handleCalendarClick = () => {
    router.push('/calendar_page');
  };

  const handleNoteListClick = () => {
    router.push('/note_list');
  };

  return (
    <div>
      <h1>Trang Test</h1>
      <button onClick={handleCalendarClick} className="mr-4 bg-blue-500 text-white p-2 rounded">
        Truy cập Trang Lịch
      </button>
      <button onClick={handleNoteListClick} className="bg-green-500 text-white p-2 rounded">
        Truy cập Trang Ghi Chú
      </button>
    </div>
  );
};

export default TestPage;