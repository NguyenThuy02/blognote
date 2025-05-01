
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { EditOutlined } from '@ant-design/icons';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function PurposePage() {
  const [purposes, setPurposes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizFeedback, setQuizFeedback] = useState({});
  const [quizShowInput, setQuizShowInput] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState({});
  const [pollVotes, setPollVotes] = useState({});
  const [pollMessages, setPollMessages] = useState({});
  const [pollResults, setPollResults] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();

  // Hàm kiểm tra trạng thái đăng nhập
  const checkLoginStatus = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('User data:', userData);
      if (userData && (userData.name || userData.email)) {
        setIsLoggedIn(true);
        setUserEmail(userData.email || userData.name);
        setShowLoginModal(false);
      } else {
        setIsLoggedIn(false);
        setUserEmail('');
        setShowLoginModal(false); // Không hiển thị modal ngay khi tải trang
      }
    } catch (err) {
      console.error('Login check error:', err);
      setError('Lỗi khi kiểm tra trạng thái đăng nhập: ' + err.message);
    }
  };

  // Hàm xử lý đăng xuất
  const handleSignOut = () => {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('user-logout'));
    setIsLoggedIn(false);
    setUserEmail('');
    setShowLoginModal(true);
    alert('Đăng xuất thành công!');
  };

  // Hàm kiểm tra URL hợp lệ
  const isValidUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  useEffect(() => {
    checkLoginStatus();

    const handleStorageChange = (event) => {
      if (event.key === 'user' || event.key === null) {
        checkLoginStatus();
      }
    };

    const handleLogoutEvent = () => {
      checkLoginStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('user-logout', handleLogoutEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-logout', handleLogoutEvent);
    };
  }, []);

  useEffect(() => {
    const fetchPurposesAndVotes = async () => {
      try {
        // Fetch purposes
        const { data: purposesData, error: purposesError } = await supabase
          .from('postpurpose')
          .select('*');
        if (purposesError) throw new Error(purposesError.message);

        console.log('Purposes Data:', purposesData);
        const cleanedPurposes = purposesData.map(purpose => ({
          ...purpose,
          images: Array.isArray(purpose.images)
            ? purpose.images.filter(isValidUrl)
            : [],
          questions: Array.isArray(purpose.questions)
            ? purpose.questions.map(q => ({
                ...q,
                image: q.image && isValidUrl(q.image) ? q.image : null,
              }))
            : [],
          quizzes: Array.isArray(purpose.quizzes)
            ? purpose.quizzes.map(q => ({
                ...q,
                image: q.image && isValidUrl(q.image) ? q.image : null,
              }))
            : [],
        }));
        setPurposes(cleanedPurposes || []);

        // Fetch vote counts for all polls
        const { data: votesData, error: votesError } = await supabase
          .from('poll_votes')
          .select('article_id, option');
        if (votesError) throw new Error(votesError.message);

        console.log('Votes Data:', votesData);

        const voteCounts = {};
        votesData.forEach(({ article_id, option }) => {
          const key = `${article_id}-${option}`; // Already present, but confirm
          voteCounts[key] = (voteCounts[key] || 0) + 1;
        });

        const results = {};
        cleanedPurposes.forEach(purpose => {
          if (purpose.poll?.options) {
            const totalVoters = purpose.poll.options.reduce(
              (sum, option) => sum + (voteCounts[`${purpose.id}-${option}`] || 0),
              0
            );
            const optionResults = purpose.poll.options.map(option => ({
              option,
              votes: voteCounts[`${purpose.id}-${option}`] || 0,
              percentage: totalVoters > 0 ? ((voteCounts[`${purpose.id}-${option}`] || 0) / totalVoters * 100).toFixed(1) : 0,
            }));
            results[purpose.id] = { totalVoters, options: optionResults };
          }
        });
        setPollResults(results);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Không thể tải dữ liệu từ Supabase: ${err.message}`);
        setLoading(false);
      }
    };

    fetchPurposesAndVotes();
  }, []);

  const handleQuizSubmit = (purposeId, quizIndex, correctAnswer, userAnswer) => {
    if (!userAnswer) return;

    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = correctAnswer.trim().toLowerCase();

    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      setQuizFeedback(prev => ({
        ...prev,
        [`${purposeId}-${quizIndex}`]: 'Chúc mừng! Đáp án đúng!',
      }));
    } else {
      setQuizFeedback(prev => ({
        ...prev,
        [`${purposeId}-${quizIndex}`]: 'Sai rồi, hãy thử lại nhé!',
      }));
    }

    setQuizSubmitted(prev => ({
      ...prev,
      [`${purposeId}-${quizIndex}`]: true,
    }));
  };

  const handlePollVote = async (purposeId, option) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      setPollMessages(prev => ({
        ...prev,
        [purposeId]: 'Vui lòng đăng nhập để bình chọn!',
      }));
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.email || userData.name;

      const { error } = await supabase
        .from('poll_votes')
        .insert({
          article_id: purposeId,
          option,
          user_id: userId,
        });

      if (error) {
        if (error.code === '23505') {
          setPollMessages(prev => ({
            ...prev,
            [purposeId]: 'Bạn đã bình chọn rồi!',
          }));
        } else {
          throw new Error(error.message);
        }
      } else {
        setPollVotes(prev => ({
          ...prev,
          [purposeId]: option,
        }));
        setPollMessages(prev => ({
          ...prev,
          [purposeId]: 'Bình chọn thành công!',
        }));

        const { data: votesData, error: votesError } = await supabase
          .from('poll_votes')
          .select('option')
          .eq('article_id', purposeId);
        if (votesError) throw new Error(votesError.message);

        const voteCounts = {};
        votesData.forEach(({ option }) => {
          voteCounts[option] = (voteCounts[option] || 0) + 1;
        });

        const totalVoters = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);
        const optionResults = purposes
          .find(p => p.id === purposeId)
          ?.poll?.options?.map(option => ({
            option,
            votes: voteCounts[option] || 0,
            percentage: totalVoters > 0 ? ((voteCounts[option] || 0) / totalVoters * 100).toFixed(1) : 0,
          })) || [];

        setPollResults(prev => ({
          ...prev,
          [purposeId]: { totalVoters, options: optionResults },
        }));
      }
    } catch (err) {
      setPollMessages(prev => ({
        ...prev,
        [purposeId]: 'Không thể gửi bình chọn. Vui lòng thử lại.',
      }));
    }
  };

  const renderImage = (src, alt, index) => {
    console.log(`Rendering image: ${src}`);
    if (!isValidUrl(src)) {
      console.warn(`Invalid image URL: ${src}`);
      return (
        <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
          <p className="text-gray-500 text-sm">Không có ảnh</p>
        </div>
      );
    }
    return (
      <Image
        src={src}
        alt={alt}
        width={600}
        height={400}
        className="w-full h-48 object-cover rounded-lg shadow-sm mb-3 border border-red-500"
        onError={(e) => {
          console.error(`Failed to load image: ${src}`);
          e.target.src = '/fallback-image.png';
        }}
        loading="lazy"
      />
    );
  };

  const renderContent = (content, purposeImages) => {
    if (!content) {
      console.warn('Content is empty or undefined');
      return null;
    }
    console.log('Rendering content:', content);
    return (
      <div className="mt-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Nội dung</h3>
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          {(purposeImages && purposeImages[0]) && (
            renderImage(purposeImages[0], 'Content Image', 0)
          )}
          <p className="text-gray-700 text-sm">{content}</p>
        </div>
      </div>
    );
  };

  const renderMilestones = (milestones) => {
    if (!Array.isArray(milestones)) return null;
    return milestones.map((milestone, index) => (
      <div
        key={index}
        className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">{new Date(milestone.time).toLocaleDateString('vi-VN')}</p>
          <span
            className={`px-2 py-1 text-xs font-bold rounded-full ${
              milestone.status === 'Hoàn thành'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {milestone.status}
          </span>
        </div>
        <p className="mt-2 text-gray-800 font-medium">{milestone.description}</p>
      </div>
    ));
  };

  const renderQuestions = (questions, purposeImages) => {
    if (!Array.isArray(questions)) {
      console.warn('Questions is not an array:', questions);
      return null;
    }
    return questions.map((q, index) => {
      const imageSrc = q.image || (purposeImages && purposeImages[0]);
      console.log(`Question ${index} image:`, { qImage: q.image, purposeImage: purposeImages?.[0], imageSrc });
      return (
        <div key={index} className="mb-6 p-4 bg-blue-50 rounded-lg shadow-sm border border-gray-100">
          {imageSrc ? (
            renderImage(imageSrc, `Question Image ${index}`, index)
          ) : (
            <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
              <p className="text-gray-500 text-sm">Không có ảnh cho câu hỏi</p>
            </div>
          )}
          <p className="font-bold text-lg text-gray-900">{q.question || 'Câu hỏi không có nội dung'}</p>
          <div className="mt-3 space-y-2">
            {Array.isArray(q.options) &&
              q.options.map((option, i) => (
                <p key={i} className="text-gray-700 text-sm pl-4">
                  <span className="font-medium text-indigo-600">{String.fromCharCode(65 + i)}.</span> {option}
                </p>
              ))}
          </div>
          <p className="mt-2 text-xs text-gray-400 italic">
            {q.multipleChoice ? 'Chọn nhiều đáp án' : 'Chọn một đáp án'}
          </p>
        </div>
      );
    });
  };

  const renderQuizzes = (quizzes, purposeId, purposeImages) => {
    if (!Array.isArray(quizzes)) {
      console.warn('Quizzes is not an array:', quizzes);
      return null;
    }
    return quizzes.map((quiz, index) => {
      const imageSrc = quiz.image || (purposeImages && purposeImages[0]);
      console.log(`Quiz ${index} image:`, { quizImage: quiz.image, purposeImage: purposeImages?.[0], imageSrc });
      return (
        <div key={index} className="mb-6 p-4 bg-blue-50 rounded-lg shadow-sm border border-gray-100">
          {imageSrc ? (
            renderImage(imageSrc, `Quiz Image ${index}`, index)
          ) : (
            <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
              <p className="text-gray-500 text-sm">Không có ảnh cho câu đố</p>
            </div>
          )}
          <p className="font-bold text-lg text-gray-900">{quiz.question || 'Câu đố không có nội dung'}</p>
          <div className="mt-3">
            {!quizShowInput[`${purposeId}-${index}`] ? (
              <button
                onClick={() => setQuizShowInput(prev => ({ ...prev, [`${purposeId}-${index}`]: true }))}
                className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full hover:bg-indigo-200 transition-all duration-200"
              >
                <EditOutlined className="w-4 h-4 mr-1" />
                Chọn đáp án
              </button>
            ) : (
              <div className="space-y-2">
                {Array.isArray(quiz.options) && quiz.options.length > 0 ? (
                  quiz.options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setQuizAnswers(prev => ({ ...prev, [`${purposeId}-${index}`]: option }))
                      }
                      className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-200 ${
                        quizAnswers[`${purposeId}-${index}`] === option
                          ? 'bg-indigo-100 text-indigo-800 font-medium'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {option}
                    </button>
                  ))
                ) : (
                  <input
                    type="text"
                    value={quizAnswers[`${purposeId}-${index}`] || ''}
                    onChange={(e) =>
                      setQuizAnswers(prev => ({ ...prev, [`${purposeId}-${index}`]: e.target.value }))
                    }
                    placeholder="Nhập đáp án của bạn"
                    className="flex-1 p-2 text-sm border border-gray-200 rounded-lg focus:border-indigo-500 hover:border-purple-500 focus:outline-none transition-all duration-200"
                  />
                )}
                <button
                  onClick={() =>
                    handleQuizSubmit(purposeId, index, quiz.answer, quizAnswers[`${purposeId}-${index}`] || '')
                  }
                  disabled={!quizAnswers[`${purposeId}-${index}`]?.trim()}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ml-5 ${
                    quizAnswers[`${purposeId}-${index}`]?.trim()
                      ? 'bg-indigo-400 text-white hover:bg-indigo-500'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Gửi
                </button>
              </div>
            )}
          </div>
          {quizFeedback[`${purposeId}-${index}`] && (
            <p
              className={`mt-3 text-sm font-medium ${
                quizFeedback[`${purposeId}-${index}`].includes('Chúc mừng')
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {quizFeedback[`${purposeId}-${index}`]}
            </p>
          )}
          {quizSubmitted[`${purposeId}-${index}`] && (
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-green-600">Đáp án đúng:</span> {quiz.answer}
            </p>
          )}
        </div>
      );
    });
  };

  const renderPurpose = (purpose) => {
    const tags = Array.isArray(purpose.tags)
      ? purpose.tags
      : typeof purpose.tags === 'string'
      ? purpose.tags.split(',').map(tag => tag.trim())
      : [];

    console.log('Story Description for purpose:', purpose.story_description);

    return (
      <div
        key={purpose.id}
        className="text-gray-700 mb-8 p-6 bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">
          {purpose.purpose || purpose.topics || 'Không có tiêu đề'}
        </h2>

        <div className="space-y-3 mb-6">
          {purpose.customTopic && (
            <p className="text-gray-600 text-sm">
              <span className="font-medium text-gray-800">Chủ đề tùy chỉnh:</span> {purpose.customTopic}
            </p>
          )}
          {purpose.selectedTag && (
            <p className="text-gray-600 text-sm">
              <span className="font-medium text-gray-800">Thẻ đã chọn:</span> {purpose.selectedTag}
            </p>
          )}
          {purpose.customTag && (
            <p className="text-gray-600 text-sm">
              <span className="font-medium text-gray-800">Thẻ tùy chỉnh:</span> {purpose.customTag}
            </p>
          )}
        </div>

        {purpose.questions?.length > 0 && (
          <div className="mt-6">
            {renderQuestions(purpose.questions, purpose.images)}
          </div>
        )}

        {purpose.content && (
          <div className="mt-6">
            {renderContent(purpose.content, purpose.images)}
          </div>
        )}

        {purpose.quizzes?.length > 0 && (
          <div className="mt-6">
            {renderQuizzes(purpose.quizzes, purpose.id, purpose.images)}
          </div>
        )}

        {purpose.poll?.title && (
          <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-100">
            <h3 className="text-xl font-bold text-indigo-900 mb-4">{purpose.poll.title}</h3>
            <div className="space-y-3">
              {Array.isArray(purpose.poll.options) &&
                purpose.poll.options.map((option, i) => (
                  <div key={i} className="relative">
                    <button
                      onClick={() => handlePollVote(purpose.id, option)}
                      disabled={pollVotes[purpose.id] || !isLoggedIn}
                      className={`w-full text-left p-4 rounded-lg border transition-all duration-300 ${
                        pollVotes[purpose.id] === option
                          ? 'bg-indigo-200 text-indigo-900 border-indigo-300 font-bold'
                          : pollVotes[purpose.id] || !isLoggedIn
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-white text-gray-800 border-gray-200 hover:bg-indigo-50 hover:border-indigo-300'
                      } shadow-sm`}
                    >
                      <span className="font-medium text-indigo-600">{`Lựa chọn ${i + 1}`}:</span>{' '}
                      {option}
                    </button>
                    {pollVotes[purpose.id] && pollResults[purpose.id] && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-3 rounded-full transition-all duration-500"
                            style={{
                              width: `${pollResults[purpose.id].options[i]?.percentage || 0}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {pollResults[purpose.id].options[i]?.votes || 0} lượt bình chọn (
                          {pollResults[purpose.id].options[i]?.percentage || 0}%)
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
            {pollVotes[purpose.id] && pollResults[purpose.id] && (
              <p className="mt-3 text-sm text-gray-600 font-medium">
                Tổng số người bình chọn: {pollResults[purpose.id].totalVoters}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500 italic">
              {purpose.poll.multipleChoice ? 'Chọn nhiều đáp án' : 'Chọn một đáp án'}
            </p>
            {pollMessages[purpose.id] && (
              <div
                className={`mt-3 p-3 rounded-lg flex items-center text-sm font-medium ${
                  pollMessages[purpose.id].includes('thành công')
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {pollMessages[purpose.id].includes('thành công') ? (
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                )}
                {pollMessages[purpose.id]}
              </div>
            )}
          </div>
        )}

        {purpose.storyType && (
          <div className="mt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {purpose.storyType === 'Truyện tranh' ? 'Truyện tranh' : 'Truyện'}: {purpose.storyType}
            </h3>
            {purpose.story_description && (
              <p className="text-gray-700 text-sm mb-4">{purpose.story_description}</p>
            )}
            {purpose.storyType === 'Truyện tranh' && (
              <>
                {Array.isArray(purpose.images) && purpose.images.length > 0 ? (
                  <div className="mb-4">
                    <h4 className="text-lg font-bold text-gray-800 mb-3">Hình ảnh truyện tranh</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {purpose.images.map((img, index) => (
                        <a
                          key={index}
                          href={img}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group"
                        >
                          <Image
                            src={img}
                            alt={`Comic Image ${index}`}
                            width={300}
                            height={200}
                            className="w-full h-48 object-cover rounded-lg shadow-sm group-hover:shadow-lg group-hover:scale-105 transition-all duration-300"
                            onError={(e) => (e.target.src = '/fallback-image.png')}
                            loading="lazy"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : purpose.storyDoc ? (
                  <a
                    href={purpose.storyDoc}
                    download
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all duration-200"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      ></path>
                    </svg>
                    Tải file truyện tranh
                  </a>
                ) : null}
              </>
            )}
            {purpose.storyType !== 'Truyện tranh' && purpose.storyDoc && (
              <a
                href={purpose.storyDoc}
                download
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all duration-200"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  ></path>
                </svg>
                Tải file truyện
              </a>
            )}
          </div>
        )}

        {purpose.timeline?.title && (
          <div className="mt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{purpose.timeline.title}</h3>
            {renderMilestones(purpose.timeline.milestones)}
          </div>
        )}

        {Array.isArray(purpose.images) && purpose.images.length > 0 && purpose.storyType !== 'Truyện tranh' && (
          <div className="mt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Hình ảnh</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {purpose.images.map((img, index) => (
                <a
                  key={index}
                  href={img}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <Image
                    src={img}
                    alt={`Image ${index}`}
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover rounded-lg shadow-sm group-hover:shadow-lg group-hover:scale-105 transition-all duration-300"
                    onError={(e) => (e.target.src = '/fallback-image.png')}
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="mt-6">
            <ul className="flex gap-2 flex-wrap">
              {tags.map((tag, index) => (
                <li
                  key={index}
                  className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full hover:bg-indigo-200 transition-all duration-200"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Trạng thái đăng nhập */}
      <div className="mb-6 flex items-center justify-between p-4 rounded-lg bg-gray-100">
        {loading ? (
          <p className="text-gray-500 text-sm">Đang kiểm tra đăng nhập...</p>
        ) : isLoggedIn ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
              Xin chào, {userEmail}
            </span>
            <button
              onClick={handleSignOut}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200 text-sm font-medium"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-700">
            Chưa đăng nhập.{' '}
            <a
              href="/auth/login"
              className="text-blue-500 hover:underline"
            >
              Đăng nhập
            </a>
          </p>
        )}
      </div>

      {/* Hiển thị lỗi nếu có */}
      {error && (
        <p className="text-center text-red-600 text-sm mb-4">{error}</p>
      )}

      {/* Modal yêu cầu đăng nhập */}
      {showLoginModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Yêu cầu đăng nhập
            </h3>
            <p className="text-gray-600 mb-6">
              Vui lòng đăng nhập để thực hiện hành động này.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowLoginModal(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-200"
              >
                Hủy
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hiển thị nội dung chính */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-3 text-gray-600 text-sm">Đang tải dữ liệu...</p>
        </div>
      )}
      {error && (
        <p className="text-center text-red-600 text-sm py-8">{error}</p>
      )}
      {!loading && !error && purposes.length === 0 && (
        <p className="text-center text-gray-600 text-sm py-8">Không có dữ liệu để hiển thị.</p>
      )}
      {!loading && !error && purposes.length > 0 && (
        <div className="space-y-4">
          {purposes.map(purpose => renderPurpose(purpose))}
        </div>
      )}
    </div>
  );
}