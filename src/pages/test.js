import { useRouter } from 'next/router';
import CalendarPage from './calendar_page'; // Đảm bảo đường dẫn đúng

const TestPage = () => {
  const router = useRouter();

  const handleClick = () => {
    router.push('/calendar_page');
  };

  return (
    <div>
      <h1>Trang Test</h1>
      <button onClick={handleClick}>
        Truy cập Trang Lịch
      </button>
    </div>
  );
};

export default TestPage;