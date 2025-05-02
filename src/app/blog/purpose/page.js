'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { EditOutlined, ZoomInOutlined, ZoomOutOutlined, CloseOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ThemeSelector, { getThemeClasses } from '../../../utils/color';
import ScrollToTop from '../../../utils/scroll';
import Notification from '../../../utils/notification';
import Confirm from '../../../utils/error';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <p className="text-red-500 text-base">
          Error: {this.state.error.message} (Component: {this.props.componentName})
        </p>
      );
    }
    return this.props.children;
  }
}

export default function PurposePage() {
  const [formData, setFormData] = useState({
    topics: "",
    customTopic: "",
    tags: [],
    selectedTag: "",
    customTag: "",
    questions: [{ question: "", options: ["", ""], multipleChoice: false, correctOptions: [] }],
    poll: { title: "", options: ["", ""], multipleChoice: false },
    quizzes: [{ question: "", answer: "" }],
    storyType: "Truyện chữ",
    storyDescription: "",
    storyDoc: null,
    timeline: {
      title: "",
      milestones: [
        {
          time: new Date().toISOString().split("T")[0],
          description: "",
          status: "Hoàn thành",
        },
      ],
    },
    images: [],
  });
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
  const [questionVotes, setQuestionVotes] = useState({});
  const [questionMessages, setQuestionMessages] = useState({});
  const [questionSubmitted, setQuestionSubmitted] = useState({});
  const [questionFeedback, setQuestionFeedback] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState(null);
  const [theme, setTheme] = useState('light');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [previewFile, setPreviewFile] = useState(null);

  const router = useRouter();
  const scrollContainerRef = useRef();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;

    const checkLoginStatus = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData && (userData.name || userData.email)) {
          setIsLoggedIn(true);
          setUserEmail(userData.email || userData.name);
          setUserId(userData.id);
          setShowLoginModal(false);
        } else {
          setIsLoggedIn(false);
          setUserEmail('');
          setUserId(null);
          setShowLoginModal(false);
        }
      } catch (err) {
        setError({ message: 'Lỗi khi kiểm tra trạng thái đăng nhập: ' + err.message });
      }
    };

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
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;

    const fetchPurposesAndVotes = async () => {
      try {
        setLoading(true);

        const { data: purposesData, error: purposesError } = await supabase
          .from('postpurpose')
          .select('*');
        if (purposesError) throw new Error(purposesError.message);

        const cleanedPurposes = purposesData.map(purpose => {
          let images = [];
          if (typeof purpose.images === 'string') {
            if (isJsonString(purpose.images)) {
              try {
                images = JSON.parse(purpose.images)
                  .map(img => getImageUrl(img))
                  .filter(isValidUrl);
              } catch (e) {
                console.error(`Failed to parse images JSON for purpose ${purpose.id}:`, e);
                images = [];
              }
            } else if (isValidUrl(purpose.images)) {
              images = [getImageUrl(purpose.images)];
            }
          } else if (Array.isArray(purpose.images)) {
            images = purpose.images.map(img => getImageUrl(img)).filter(isValidUrl);
          }

          return {
            ...purpose,
            images,
            questions: Array.isArray(purpose.questions)
              ? purpose.questions.map(q => ({
                  ...q,
                  image: q.image ? getImageUrl(q.image) : null,
                  correctOptions: Array.isArray(q.correctOptions) ? q.correctOptions : [],
                }))
              : [],
            quizzes: Array.isArray(purpose.quizzes)
              ? purpose.quizzes.map(q => ({
                  ...q,
                  image: q.image ? getImageUrl(q.image) : null,
                }))
              : [],
            tags: typeof purpose.tags === 'string'
              ? purpose.tags.split(',').map(tag => tag.trim())
              : Array.isArray(purpose.tags)
              ? purpose.tags
              : [],
            story_description: purpose.story_description || '',
            story_doc: purpose.story_doc || purpose.storyDoc,
          };
        });

        setPurposes(cleanedPurposes || []);

        const { data: votesData, error: votesError } = await supabase
          .from('poll_votes')
          .select('article_id, option, user_id');
        if (votesError) throw new Error(votesError.message);

        const voteCounts = {};
        const userVotes = {};
        votesData.forEach(({ article_id, option, user_id }) => {
          const options = option.split(',').filter(opt => opt.trim());
          options.forEach(opt => {
            const key = `${article_id}-${opt}`;
            voteCounts[key] = (voteCounts[key] || 0) + 1;
          });

          if (user_id === userId) {
            if (option.startsWith('question-')) {
              options.forEach(opt => {
                userVotes[`${article_id}-${opt}`] = opt;
              });
            } else {
              userVotes[article_id] = options;
            }
          }
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
              percentage: totalVoters > 0
                ? ((voteCounts[`${purpose.id}-${option}`] || 0) / totalVoters * 100).toFixed(1)
                : 0,
            }));
            results[purpose.id] = { totalVoters, optionResults };
          }
          if (purpose.questions?.length > 0) {
            purpose.questions.forEach((q, qIndex) => {
              if (q.options) {
                const totalVoters = q.options.reduce(
                  (sum, option) => sum + (voteCounts[`${purpose.id}-question-${qIndex}-option-${option}`] || 0),
                  0
                );
                const optionResults = q.options.map(option => ({
                  option,
                  votes: voteCounts[`${purpose.id}-question-${qIndex}-option-${option}`] || 0,
                  percentage: totalVoters > 0
                    ? ((voteCounts[`${purpose.id}-question-${qIndex}-option-${option}`] || 0) / totalVoters * 100).toFixed(1)
                    : 0,
                }));
                results[`${purpose.id}-question-${qIndex}`] = { totalVoters, optionResults };
              }
            });
          }
        });

        setPollResults(results);
        setPollVotes(userVotes);
        setQuestionVotes(userVotes);

        setLoading(false);
      } catch (err) {
        setError({ message: `Không thể tải dữ liệu từ Supabase: ${err.message}` });
        setLoading(false);
      }
    };

    fetchPurposesAndVotes();
  }, [isMounted, userId]);

  const isValidUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const isJsonString = (str) => {
    if (typeof str !== 'string') return false;
    return str.trim().startsWith('{') || str.trim().startsWith('[');
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (isValidUrl(path)) return path;
    const { data } = supabase.storage.from('postpurpose-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('user-logout'));
    setIsLoggedIn(false);
    setUserEmail('');
    setUserId(null);
    setShowLoginModal(true);
    setNotification({ message: 'Đăng xuất thành công!', type: 'success' });
  };

  const handleSearchChange = (delivery) => {
    if (!isMounted) return;
    setSearchTerm(delivery.target.value);
  };

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
    if (!isLoggedIn || !userId) {
      setShowLoginModal(true);
      setPollMessages(prev => ({
        ...prev,
        [purposeId]: 'Vui lòng đăng nhập để bình chọn!',
      }));
      return;
    }

    const purpose = purposes.find(p => p.id === purposeId);
    const isMultipleChoice = purpose?.poll?.multipleChoice;

    try {
      if (isMultipleChoice) {
        const currentVotes = pollVotes[purposeId] || [];
        let newVotes;
        if (currentVotes.includes(option)) {
          newVotes = currentVotes.filter(opt => opt !== option);
          setPollMessages(prev => ({
            ...prev,
            [purposeId]: 'Đã bỏ chọn đáp án!',
          }));
        } else {
          newVotes = [...currentVotes, option];
          setPollMessages(prev => ({
            ...prev,
            [purposeId]: 'Bình chọn thành công!',
          }));
        }

        if (newVotes.length === 0) {
          const { error } = await supabase
            .from('poll_votes')
            .delete()
            .eq('article_id', purposeId)
            .eq('user_id', userId);
          if (error) throw new Error(error.message);
        } else {
          const optionString = newVotes.join(',');
          const { error } = await supabase
            .from('poll_votes')
            .upsert(
              {
                article_id: purposeId,
                option: optionString,
                user_id: userId,
                created_at: new Date().toISOString(),
              },
              {
                onConflict: ['article_id', 'user_id'],
                update: ['option', 'created_at'],
              }
            );
          if (error) throw new Error(error.message);
        }

        setPollVotes(prev => ({
          ...prev,
          [purposeId]: newVotes,
        }));
      } else {
        const { error } = await supabase
          .from('poll_votes')
          .upsert(
            {
              article_id: purposeId,
              option,
              user_id: userId,
              created_at: new Date().toISOString(),
            },
            {
              onConflict: ['article_id', 'user_id'],
              update: ['option', 'created_at'],
            }
          );
        if (error) throw new Error(error.message);

        setPollVotes(prev => ({
          ...prev,
          [purposeId]: [option],
        }));
        setPollMessages(prev => ({
          ...prev,
          [purposeId]: 'Bình chọn thành công!',
        }));
      }

      const { data: votesData, error: votesError } = await supabase
        .from('poll_votes')
        .select('option')
        .eq('article_id', purposeId);
      if (votesError) throw new Error(votesError.message);

      const voteCounts = {};
      votesData.forEach(({ option }) => {
        option.split(',').filter(opt => opt.trim()).forEach(opt => {
          voteCounts[opt] = (voteCounts[opt] || 0) + 1;
        });
      });

      const totalVoters = purpose.poll.options.reduce(
        (sum, opt) => sum + (voteCounts[opt] || 0),
        0
      );
      const optionResults = purpose.poll.options.map(opt => ({
        option: opt,
        votes: voteCounts[opt] || 0,
        percentage: totalVoters > 0 ? ((voteCounts[opt] || 0) / totalVoters * 100).toFixed(1) : 0,
      }));

      setPollResults(prev => ({
        ...prev,
        [purposeId]: { totalVoters, optionResults },
      }));
    } catch (err) {
      setPollMessages(prev => ({
        ...prev,
        [purposeId]: `Không thể gửi bình chọn: ${err.message}`,
      }));
    }
  };

  const handleQuestionVote = async (purposeId, questionIndex, option) => {
    if (!isLoggedIn || !userId) {
      setShowLoginModal(true);
      setQuestionMessages(prev => ({
        ...prev,
        [`${purposeId}-${questionIndex}`]: 'Vui lòng đăng nhập để chọn đáp án!',
      }));
      return;
    }

    const purpose = purposes.find(p => p.id === purposeId);
    const isMultipleChoice = purpose?.questions?.[questionIndex]?.multipleChoice;
    const optionKey = `question-${questionIndex}-option-${option}`;

    try {
      if (isMultipleChoice) {
        const currentVotes = Object.keys(questionVotes)
          .filter(key => key.startsWith(`${purposeId}-question-${questionIndex}-option-`))
          .map(key => questionVotes[key]);
        let newVotes;
        if (currentVotes.includes(optionKey)) {
          newVotes = currentVotes.filter(vote => vote !== optionKey);
          setQuestionMessages(prev => ({
            ...prev,
            [`${purposeId}-${questionIndex}`]: 'Đã bỏ chọn đáp án!',
          }));
        } else {
          newVotes = [...currentVotes, optionKey];
          setQuestionMessages(prev => ({
            ...prev,
            [`${purposeId}-${questionIndex}`]: 'Chọn đáp án thành công!',
          }));
        }

        if (newVotes.length === 0) {
          const { error } = await supabase
            .from('poll_votes')
            .delete()
            .eq('article_id', purposeId)
            .eq('user_id', userId);
          if (error) throw new Error(error.message);
        } else {
          const optionString = newVotes.join(',');
          const { error } = await supabase
            .from('poll_votes')
            .upsert(
              {
                article_id: purposeId,
                option: optionString,
                user_id: userId,
                created_at: new Date().toISOString(),
              },
              {
                onConflict: ['article_id', 'user_id'],
                update: ['option', 'created_at'],
              }
            );
          if (error) throw new Error(error.message);
        }

        setQuestionVotes(prev => {
          const newVotesState = { ...prev };
          Object.keys(prev)
            .filter(key => key.startsWith(`${purposeId}-question-${questionIndex}-option-`))
            .forEach(key => delete newVotesState[key]);
          newVotes.forEach(vote => {
            newVotesState[`${purposeId}-${vote}`] = vote;
          });
          return newVotesState;
        });
      } else {
        const { error } = await supabase
          .from('poll_votes')
          .upsert(
            {
              article_id: purposeId,
              option: optionKey,
              user_id: userId,
              created_at: new Date().toISOString(),
            },
            {
              onConflict: ['article_id', 'user_id'],
              update: ['option', 'created_at'],
            }
          );
        if (error) throw new Error(error.message);

        setQuestionVotes(prev => ({
          ...prev,
          [`${purposeId}-${optionKey}`]: optionKey,
        }));
        setQuestionMessages(prev => ({
          ...prev,
          [`${purposeId}-${questionIndex}`]: 'Chọn đáp án thành công!',
        }));
      }

      const { data: votesData, error: votesError } = await supabase
        .from('poll_votes')
        .select('option')
        .eq('article_id', purposeId);
      if (votesError) throw new Error(votesError.message);

      const voteCounts = {};
      votesData.forEach(({ option }) => {
        option.split(',').filter(opt => opt.trim()).forEach(opt => {
          voteCounts[opt] = (voteCounts[opt] || 0) + 1;
        });
      });

      const totalVoters = purpose.questions[questionIndex].options.reduce(
        (sum, opt) => sum + (voteCounts[`question-${questionIndex}-option-${opt}`] || 0),
        0
      );
      const optionResults = purpose.questions[questionIndex].options.map(opt => ({
        option: opt,
        votes: voteCounts[`question-${questionIndex}-option-${opt}`] || 0,
        percentage: totalVoters > 0
          ? ((voteCounts[`question-${questionIndex}-option-${opt}`] || 0) / totalVoters * 100).toFixed(1)
          : 0,
      }));

      setPollResults(prev => ({
        ...prev,
        [`${purposeId}-question-${questionIndex}`]: { totalVoters, optionResults },
      }));
    } catch (err) {
      setQuestionMessages(prev => ({
        ...prev,
        [`${purposeId}-${questionIndex}`]: `Không thể gửi đáp án: ${err.message}`,
      }));
    }
  };

  const handleQuestionSubmit = (purposeId, questionIndex, correctOptions) => {
    if (!isLoggedIn || !userId) {
      setShowLoginModal(true);
      setQuestionMessages(prev => ({
        ...prev,
        [`${purposeId}-${questionIndex}`]: 'Vui lòng đăng nhập để gửi đáp án!',
      }));
      return;
    }

    const selectedOptions = Object.keys(questionVotes)
      .filter(key => key.startsWith(`${purposeId}-question-${questionIndex}-option-`))
      .map(key => key.split('option-')[1]);

    if (selectedOptions.length === 0) {
      setQuestionMessages(prev => ({
        ...prev,
        [`${purposeId}-${questionIndex}`]: 'Vui lòng chọn ít nhất một đáp án!',
      }));
      return;
    }

    const safeCorrectOptions = Array.isArray(correctOptions) ? correctOptions : [];
    const isCorrect = selectedOptions.length === safeCorrectOptions.length &&
      selectedOptions.every(opt => safeCorrectOptions.includes(opt));

    setQuestionFeedback(prev => ({
      ...prev,
      [`${purposeId}-${questionIndex}`]: isCorrect ? 'Chúc mừng! Đáp án đúng!' : 'Sai rồi, hãy thử lại!',
    }));

    setQuestionSubmitted(prev => ({
      ...prev,
      [`${purposeId}-${questionIndex}`]: true,
    }));
  };

  const renderImage = (src, alt, index, purposeId) => {
    if (!isValidUrl(src)) return null;
    return (
      <div
        key={`${purposeId}-image-${index}`}
        className="cursor-pointer"
        onClick={() => {
          setSelectedImage(src);
          setZoomLevel(1);
        }}
      >
        <Image
          src={src}
          alt={alt}
          width={600}
          height={400}
          className="w-full max-w-[300px] h-48 object-cover rounded-lg shadow-sm mb-3 hover:opacity-90 transition-opacity duration-200 mx-auto"
          onError={(e) => (e.target.src = '/fallback-image.png')}
          loading="lazy"
        />
      </div>
    );
  };

  const handleZoom = (direction) => {
    setZoomLevel(prev => {
      const newZoom = direction === 'in' ? prev + 0.2 : prev - 0.2;
      return Math.min(Math.max(newZoom, 0.5), 3);
    });
  };

  const renderContent = (content, purposeImages, purposeId) => {
    if (!content) return null;
    return (
      <div className="mt-6 p-4 bg-blue-50 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-400 mb-4">
          Nội dung
        </h3>
        {purposeImages?.[0] && renderImage(purposeImages[0], 'Content Image', 0, purposeId)}
        <p className="text-gray-700 text-sm">{content}</p>
      </div>
    );
  };

  const renderMilestones = (milestones) => {
    if (!Array.isArray(milestones)) return null;
    return milestones.map((milestone, index) => (
      <div
        key={milestone.id || `milestone-${index}`}
        className="mb-4 p-4 bg-blue-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">
            {new Date(milestone.time).toLocaleDateString('vi-VN')}
          </p>
          <span
            className={`px-2 py-1 text-xs font-bold rounded-full ${
              milestone.status === 'Hoàn thành' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {milestone.status}
          </span>
        </div>
        <p className="mt-2 text-gray-800 font-medium">{milestone.description}</p>
      </div>
    ));
  };

  const renderQuestions = (questions, purposeId, purposeImages) => {
    if (!Array.isArray(questions)) return null;
    return questions.map((q, index) => {
      const imageSrc = q.image || purposeImages?.[0];
      const questionKey = `${purposeId}-${index}`;
      const hasVoted = Object.keys(questionVotes).some(key => key.startsWith(`${purposeId}-question-${index}-option-`));
      return (
        <div key={`question-${purposeId}-${index}`} className="mb-6 p-4 bg-blue-50 rounded-lg shadow-sm border border-gray-100">
          {imageSrc && renderImage(imageSrc, `Question Image ${index}`, index, purposeId)}
          <p className="font-bold text-lg text-gray-900">{q.question || 'Câu hỏi không có nội dung'}</p>
          <div className="mt-3 space-y-3">
            {Array.isArray(q.options) &&
              q.options.map((option, i) => (
                <div key={`option-${purposeId}-${index}-${i}`} className="relative">
                  <button
                    onClick={() => handleQuestionVote(purposeId, index, option)}
                    disabled={!isLoggedIn || questionSubmitted[questionKey]}
                    className={`w-full text-left p-4 rounded-lg border transition-all duration-300 ${
                      questionVotes[`${purposeId}-question-${index}-option-${option}`]
                        ? 'bg-indigo-200 text-indigo-900 border-indigo-300 font-bold'
                        : !isLoggedIn
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : questionSubmitted[questionKey] && q.correctOptions.includes(option)
                        ? 'bg-green-100 text-green-900 border-green-300'
                        : questionSubmitted[questionKey]
                        ? 'bg-red-100 text-red-900 border-red-300'
                        : 'bg-white text-gray-800 border-gray-200 hover:bg-indigo-50 hover:border-indigo-300'
                    } shadow-sm`}
                  >
                    <span className="font-medium text-indigo-600">{String.fromCharCode(65 + i)}.</span> {option}
                  </button>
                  {pollResults[`${purposeId}-question-${index}`] && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${pollResults[`${purposeId}-question-${index}`].optionResults[i]?.percentage || 0}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {pollResults[`${purposeId}-question-${index}`].optionResults[i]?.votes || 0} lượt chọn (
                        {pollResults[`${purposeId}-question-${index}`].optionResults[i]?.percentage || 0}%)
                      </p>
                    </div>
                  )}
                </div>
              ))}
          </div>
          <p className="mt-2 text-xs text-gray-400 italic">
            {q.multipleChoice ? 'Chọn nhiều đáp án' : 'Chọn một đáp án'}
          </p>
          {!questionSubmitted[questionKey] && (
            <button
              onClick={() => handleQuestionSubmit(purposeId, index, q.correctOptions)}
              disabled={!hasVoted}
              className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                hasVoted
                  ? 'bg-indigo-400 text-white hover:bg-indigo-500'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Gửi đáp án
            </button>
          )}
          {questionFeedback[questionKey] && (
            <div
              className={`mt-3 p-3 rounded-lg flex items-center text-sm font-medium ${
                questionFeedback[questionKey].includes('Đúng')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {questionFeedback[questionKey].includes('Đúng') ? (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {questionFeedback[questionKey]}
            </div>
          )}
          {questionFeedback[questionKey]?.includes('Sai') && (
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-green-600">Đáp án đúng:</span> {q.correctOptions.join(', ')}
            </p>
          )}
          {questionMessages[questionKey] && (
            <div
              className={`mt-3 p-3 rounded-lg flex items-center text-sm font-medium ${
                questionMessages[questionKey].includes('thành công') || questionMessages[questionKey].includes('bỏ chọn')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {questionMessages[questionKey].includes('thành công') || questionMessages[questionKey].includes('bỏ chọn') ? (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {questionMessages[questionKey]}
            </div>
          )}
        </div>
      );
    });
  };

  const renderQuizzes = (quizzes, purposeId, purposeImages) => {
    if (!Array.isArray(quizzes)) return null;
    return quizzes.map((quiz, index) => {
      const imageSrc = quiz.image || purposeImages?.[0];
      return (
        <div key={`quiz-${purposeId}-${index}`} className="mb-6 p-4 bg-blue-50 rounded-lg shadow-sm border border-gray-100">
          {imageSrc && renderImage(imageSrc, `Quiz Image ${index}`, index, purposeId)}
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
                      key={`quiz-option-${purposeId}-${index}-${i}`}
                      onClick={() => setQuizAnswers(prev => ({ ...prev, [`${purposeId}-${index}`]: option }))}
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
                    onChange={(e) => setQuizAnswers(prev => ({ ...prev, [`${purposeId}-${index}`]: e.target.value }))}
                    placeholder="Nhập đáp án của bạn"
                    className="flex-1 p-2 text-sm border border-gray-200 rounded-lg focus:border-indigo-500 hover:border-purple-500 focus:outline-none transition-all duration-200"
                  />
                )}
                <button
                  onClick={() => handleQuizSubmit(purposeId, index, quiz.answer, quizAnswers[`${purposeId}-${index}`] || '')}
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
                quizFeedback[`${purposeId}-${index}`].includes('Chúc mừng') ? 'text-green-600' : 'text-red-600'
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

  const renderFilePreview = (fileUrl, purposeId) => {
    if (!isValidUrl(fileUrl)) return null;

    const fileExtension = fileUrl.split('.').pop().toLowerCase();
    const isPreviewable = ['pdf', 'txt'].includes(fileExtension);
    const fileName = fileUrl.split('/').pop() || 'Tệp không xác định';

    return (
      <div className="mt-4 border border-gray-200 rounded-lg p-3 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-gray-700">{fileName}</span>
        </div>
        <div className="flex gap-2">
          {isPreviewable && (
            <button
              onClick={() => setPreviewFile(fileUrl)}
              className="text-indigo-600 hover:text-indigo-800 transition duration-200"
              title="Xem trước"
            >
              <EyeOutlined className="text-lg" />
            </button>
          )}
          <a
            href={fileUrl}
            download
            className="text-indigo-600 hover:text-indigo-800 transition duration-200"
            title="Tải xuống"
          >
            <DownloadOutlined className="text-lg" />
          </a>
        </div>
      </div>
    );
  };

  const renderPurpose = (purpose) => {
    const tags = Array.isArray(purpose.tags) ? purpose.tags : typeof purpose.tags === 'string' ? purpose.tags.split(',').map(tag => tag.trim()) : [];

    return (
      <div key={purpose.id} className="relative">
        <div
          className="rounded-lg shadow-md border bg-white border-gray-200 p-4 hover:shadow-[0_0_15px_rgba(0,0,0,0.2)] transition-shadow duration-200"
        >
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full mr-3 flex items-center justify-center text-white font-bold">
              {purpose.name ? purpose.name[0]?.toUpperCase() : '?'}
            </div>
            <div>
              <p className="font-bold text-blue-600 text-sm">{purpose.name || 'Tác giả'}</p>
              <p className="text-sm text-gray-500">{new Date(purpose.created_at).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-400 mb-2">
            {purpose.story_type === 'Truyện tranh' || purpose.story_type === 'Truyện chữ'
              ? purpose.story_type
              : (purpose.purpose || purpose.topics || 'Không có tiêu đề')}
          </h2>

          {purpose.story_description && (
            <p className="text-gray-600 text-sm mb-4">
              <span className="font-medium text-gray-800">Mô tả truyện:</span> {purpose.story_description}
            </p>
          )}

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
            {purpose.updated_at && (
              <p className="text-gray-600 text-sm">
                <span className="font-medium text-gray-800">Ngày cập nhật:</span>{' '}
                {new Date(purpose.updated_at).toLocaleDateString('vi-VN')}
              </p>
            )}
          </div>

          {purpose.questions?.length > 0 && (
            <div className="mt-6">{renderQuestions(purpose.questions, purpose.id, purpose.images)}</div>
          )}

          {purpose.content && (
            <div className="mt-6">{renderContent(purpose.content, purpose.images, purpose.id)}</div>
          )}

          {purpose.quizzes?.length > 0 && (
            <div className="mt-6">{renderQuizzes(purpose.quizzes, purpose.id, purpose.images)}</div>
          )}

          {purpose.poll?.title && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-indigo-100">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-400 mb-4">
                {purpose.poll.title}
              </h3>
              <div className="space-y-3">
                {Array.isArray(purpose.poll.options) &&
                  purpose.poll.options.map((option, i) => (
                    <div key={`poll-option-${purpose.id}-${i}`} className="relative">
                      <button
                        onClick={() => handlePollVote(purpose.id, option)}
                        disabled={!isLoggedIn}
                        className={`w-full text-left p-4 rounded-lg border transition-all duration-300 ${
                          pollVotes[purpose.id]?.includes(option)
                            ? 'bg-indigo-200 text-indigo-900 border-indigo-300 font-bold'
                            : !isLoggedIn
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-800 border-gray-200 hover:bg-indigo-50 hover:border-indigo-300'
                        } shadow-sm`}
                      >
                        <span className="font-medium text-indigo-600">{`Lựa chọn ${i + 1}`}:</span> {option}
                      </button>
                      {pollResults[purpose.id] && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-indigo-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${pollResults[purpose.id].optionResults[i]?.percentage || 0}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {pollResults[purpose.id].optionResults[i]?.votes || 0} lượt bình chọn (
                            {pollResults[purpose.id].optionResults[i]?.percentage || 0}%)
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
              {pollResults[purpose.id] && (
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
                    pollMessages[purpose.id].includes('thành công') || pollMessages[purpose.id].includes('bỏ chọn')
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {pollMessages[purpose.id].includes('thành công') || pollMessages[purpose.id].includes('bỏ chọn') ? (
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {pollMessages[purpose.id]}
                </div>
              )}
            </div>
          )}

          {purpose.story_type && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-400 mb-4">
                {purpose.story_type}
              </h3>
              {purpose.story_type === 'Truyện tranh' && (
                <>
                  {Array.isArray(purpose.images) && purpose.images.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-gray-800 mb-3">Hình ảnh truyện tranh</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">
                        {purpose.images.map((img, index) => renderImage(img, `Comic Image ${index}`, index, purpose.id))}
                      </div>
                    </div>
                  )}
                  {purpose.story_doc && renderFilePreview(purpose.story_doc, purpose.id)}
                  {purpose.description && (
                    <p className="text-gray-600 text-sm mt-4">
                      <span className="font-medium text-gray-800">Mô tả:</span> {purpose.description}
                    </p>
                  )}
                  {purpose.author && (
                    <p className="text-gray-600 text-sm mt-2">
                      <span className="font-medium text-gray-800">Tác giả:</span> {purpose.author}
                    </p>
                  )}
                  {purpose.category && (
                    <p className="text-gray-600 text-sm mt-2">
                      <span className="font-medium text-gray-800">Thể loại:</span> {purpose.category}
                    </p>
                  )}
                  {purpose.publish_date && (
                    <p className="text-gray-600 text-sm mt-2">
                      <span className="font-medium text-gray-800">Ngày xuất bản:</span>{' '}
                      {new Date(purpose.publish_date).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                  {purpose.status && (
                    <p className="text-gray-600 text-sm mt-2">
                      <span className="font-medium text-gray-800">Trạng thái:</span> {purpose.status}
                    </p>
                  )}
                  {purpose.chapter_info && (
                    <p className="text-gray-600 text-sm mt-2">
                      <span className="font-medium text-gray-800">Thông tin chương:</span> {purpose.chapter_info}
                    </p>
                  )}
                </>
              )}
              {purpose.story_type === 'Truyện chữ' && (
                <>
                  {Array.isArray(purpose.images) && purpose.images.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-gray-800 mb-3">Hình ảnh truyện chữ</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">
                        {purpose.images.map((img, index) => renderImage(img, `Text Story Image ${index}`, index, purpose.id))}
                      </div>
                    </div>
                  )}
                  {purpose.story_doc && renderFilePreview(purpose.story_doc, purpose.id)}
                  {purpose.story_content && (
                    <div className="mt-4">
                      <h4 className="text-lg font-bold text-gray-800 mb-3">Nội dung truyện:</h4>
                      <p className="text-gray-700 text-sm">{purpose.story_content}</p>
                    </div>
                  )}
                  {purpose.description && (
                    <p className="text-gray-600 text-sm mt-4">
                      <span className="font-medium text-gray-800">Mô tả:</span> {purpose.description}
                    </p>
                  )}
                  {purpose.author && (
                    <p className="text-gray-600 text-sm mt-2">
                      <span className="font-medium text-gray-800">Tác giả:</span> {purpose.author}
                    </p>
                  )}
                  {purpose.category && (
                    <p className="text-gray-600 text-sm mt-2">
                      <span className="font-medium text-gray-800">Thể loại:</span> {purpose.category}
                    </p>
                  )}
                  {purpose.publish_date && (
                    <p className="text-gray-600 text-sm mt-2">
                      <span className="font-medium text-gray-800">Ngày xuất bản:</span>{' '}
                      {new Date(purpose.publish_date).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                  {purpose.status && (
                    <p className="text-gray-600 text-sm mt-2">
                      <span className="font-medium text-gray-800">Trạng thái:</span> {purpose.status}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {purpose.timeline?.title && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-400 mb-4">
                {purpose.timeline.title}
              </h3>
              {renderMilestones(purpose.timeline.milestones)}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isMounted) return null;

  return (
    <div
      className={`text-gray-700 mt-[97px] shadow-2xl border border-blue-300 rounded-lg min-h-screen flex flex-row ${getThemeClasses(theme, 'editor')}`}
    >
      <div
        className={`flex-1 mx-4 pt-5 pb-5 my-3 rounded-lg shadow-md ${getThemeClasses(theme, 'container')}`}
      >
        <div className="flex items-center justify-between mb-6 px-4">
          <h1 className="text-2xl font-bold font-montserrat bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Danh sách mục đích
          </h1>
          <div className="relative w-1/2 max-w-md">
            <input
              type="text"
              placeholder="Tìm kiếm mục đích..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-blue-100 border border-gray-300 rounded-full px-4 py-2 pr-10 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 hover:border-blue-400 hover:ring-1 hover:ring-blue-400 transition duration-200 text-base"
            />
            <Image
              src="http://res.cloudinary.com/dlaoxrnad/image/upload/v1741681498/nkydita1doyqs2igrdbd.svg"
              alt="Biểu tượng tìm kiếm"
              width={20}
              height={20}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            />
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="max-h-[calc(3*360px)] overflow-y-auto scrollbar-hidden px-4 space-y-1"
        >
          {purposes
            .filter(purpose =>
              searchTerm
                ? (purpose.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   purpose.content?.toLowerCase().includes(searchTerm.toLowerCase()))
                : true
            )
            .map(purpose => renderPurpose(purpose))}
        </div>
      </div>

      <div
        className={`w-1/4 min-w-[300px] max-w-[450px] border-l bg-blue-100 my-3 mr-3 border-gray-200 p-4 rounded-lg shadow-md transition-all duration-300 flex-shrink-0 h-fit ${getThemeClasses(theme, 'container')}`}
      >
        <div className="mb-6">
          <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent wrap-text mb-4">
            Thông tin người dùng
          </h2>
          <div className="p-4 rounded-md bg-blue-50 border-gray-200 shadow-sm">
            <div className="space-y-2 text-gray-600 text-sm">
              <p>
                <strong>Email:</strong> <span className="text-blue-600">{userEmail || 'Chưa đăng nhập'}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
          <ScrollToTop />
        </div>
      </div>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      {error && (
        <Confirm
          message={error.message}
          onConfirm={error.onConfirm || (() => setError(null))}
          onCancel={error.onCancel || (() => setError(null))}
        />
      )}
      {showLoginModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Yêu cầu đăng nhập</h3>
            <p className="text-gray-600 mb-6">Vui lòng đăng nhập để thực hiện hành động này.</p>
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

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-transparent"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedImage(null);
          }}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <Image
              src={selectedImage}
              alt="Full-screen image"
              width={1200}
              height={800}
              className="object-contain"
              style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-in-out' }}
              onError={(e) => (e.target.src = '/fallback-image.png')}
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={() => handleZoom('in')}
                className="bg-white text-black p-2 rounded-full shadow-md hover:bg-gray-200 transition duration-200"
                title="Phóng to"
              >
                <ZoomInOutlined className="text-lg" />
              </button>
              <button
                onClick={() => handleZoom('out')}
                className="bg-white text-black p-2 rounded-full shadow-md hover:bg-gray-200 transition duration-200"
                title="Thu nhỏ"
              >
                <ZoomOutOutlined className="text-lg" />
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="bg-white text-black p-2 rounded-full shadow-md hover:bg-gray-200 transition duration-200"
                title="Đóng"
              >
                <CloseOutlined className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      )}

      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewFile(null);
          }}
        >
          <div className="bg-white p-6 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Xem trước tệp</h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-gray-600 hover:text-gray-800 transition duration-200"
              >
                <CloseOutlined className="text-lg" />
              </button>
            </div>
            {previewFile.endsWith('.pdf') ? (
              <iframe
                src={previewFile}
                className="w-full h-[60vh] border border-gray-200 rounded-lg"
                title="PDF Preview"
              />
            ) : previewFile.endsWith('.txt') ? (
              <pre className="text-sm text-gray-700 bg-gray-100 p-4 rounded-lg overflow-auto">
                {/* Placeholder for text file content; actual implementation requires fetching file content */}
                Nội dung tệp văn bản sẽ được hiển thị ở đây. (Yêu cầu API để tải nội dung.)
              </pre>
            ) : (
              <p className="text-sm text-gray-600">Không thể xem trước loại tệp này.</p>
            )}
            <div className="flex justify-end mt-4">
              <a
                href={previewFile}
                download
                className="inline-flex items-center px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition duration-200"
              >
                <DownloadOutlined className="mr-2" />
                Tải xuống
              </a>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        textarea {
          min-height: 80px;
          resize: none;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}