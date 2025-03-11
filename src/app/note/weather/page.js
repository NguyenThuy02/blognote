'use client';
import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { WiHumidity, WiStrongWind, WiBarometer, WiSunrise, WiSunset } from 'react-icons/wi';

// Cập nhật danh sách MAJOR_CITIES với nhiều thành phố hơn
const MAJOR_CITIES = [
  { name: 'London', timezone: 'Europe/London', country: 'UK' },
  { name: 'New York', timezone: 'America/New_York', country: 'USA' },
  { name: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japan' },
  { name: 'Sydney', timezone: 'Australia/Sydney', country: 'Australia' },
  { name: 'Dubai', timezone: 'Asia/Dubai', country: 'UAE' },
  { name: 'Singapore', timezone: 'Asia/Singapore', country: 'Singapore' },
  { name: 'Paris', timezone: 'Europe/Paris', country: 'France' },
  { name: 'Berlin', timezone: 'Europe/Berlin', country: 'Germany' },
  { name: 'Moscow', timezone: 'Europe/Moscow', country: 'Russia' },
  { name: 'Los Angeles', timezone: 'America/Los_Angeles', country: 'USA' },
  { name: 'Chicago', timezone: 'America/Chicago', country: 'USA' },
  { name: 'Toronto', timezone: 'America/Toronto', country: 'Canada' },
  { name: 'São Paulo', timezone: 'America/Sao_Paulo', country: 'Brazil' },
  { name: 'Mumbai', timezone: 'Asia/Kolkata', country: 'India' },
  { name: 'Bangkok', timezone: 'Asia/Bangkok', country: 'Thailand' },
];

const CITIES_TIMEZONE = [
  { name: 'Hanoi', timezone: 'Asia/Ho_Chi_Minh', country: 'Vietnam' },
  { name: 'London', timezone: 'Europe/London', country: 'UK' },
  { name: 'New York', timezone: 'America/New_York', country: 'USA' },
  { name: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japan' },
  { name: 'Sydney', timezone: 'Australia/Sydney', country: 'Australia' },
  { name: 'Dubai', timezone: 'Asia/Dubai', country: 'UAE' },
  { name: 'Singapore', timezone: 'Asia/Singapore', country: 'Singapore' },
  { name: 'Paris', timezone: 'Europe/Paris', country: 'France' },
  { name: 'Berlin', timezone: 'Europe/Berlin', country: 'Germany' },
  { name: 'Moscow', timezone: 'Europe/Moscow', country: 'Russia' },
  { name: 'Beijing', timezone: 'Asia/Shanghai', country: 'China' },
  { name: 'Seoul', timezone: 'Asia/Seoul', country: 'South Korea' },
  // Thêm các thành phố khác nếu cần
];

export default function WeatherPage() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [city, setCity] = useState('Hanoi');
  const [searchInput, setSearchInput] = useState('Hanoi');
  const [worldTimes, setWorldTimes] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedCityTime, setSelectedCityTime] = useState(null);
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const API_KEY = '8e994bbc1f7c4ebc82e91900251103';
        const response = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&lang=vi&aqi=yes`
        );
        
        if (!response.ok) {
          throw new Error('Không thể tải dữ liệu thời tiết');
        }
        
        const data = await response.json();
        setWeather(data);
        setError(null);
      } catch (err) {
        setError('Đã có lỗi xảy ra khi tải dữ liệu thời tiết');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [city]);

  useEffect(() => {
    const updateWorldTimes = () => {
      const times = {};
      MAJOR_CITIES.forEach(city => {
        try {
          const time = new Date().toLocaleTimeString('vi-VN', {
            timeZone: city.timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          times[city.name] = time;
        } catch (error) {
          console.error(`Error getting time for ${city.name}:`, error);
        }
      });
      setWorldTimes(times);
    };

    updateWorldTimes();
    const interval = setInterval(updateWorldTimes, 60000); // Cập nhật mỗi phút

    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault(); // Ngăn form submit mặc định
    if (searchInput.trim()) {
      setCity(searchInput);
      setShowSearchResults(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    
    if (value.length > 0) {
      const filtered = CITIES_TIMEZONE.filter(city => 
        city.name.toLowerCase().includes(value.toLowerCase()) ||
        city.country.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleCitySelect = (selectedCity) => {
    setSearchInput(selectedCity.name);
    setCity(selectedCity.name);
    setShowSearchResults(false);
    
    try {
      const time = new Date().toLocaleTimeString('vi-VN', {
        timeZone: selectedCity.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      setSelectedCityTime({
        name: selectedCity.name,
        time: time,
        timezone: selectedCity.timezone,
        country: selectedCity.country
      });
    } catch (error) {
      console.error(`Error getting time for ${selectedCity.name}:`, error);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWeatherBackground = (code) => {
    // Thunderstorm
    if (code >= 1087) return 'bg-gradient-to-br from-slate-800 to-slate-600';
    // Rain
    if (code >= 1063) return 'bg-gradient-to-br from-blue-800 to-blue-600';
    // Cloudy
    if (code >= 1003) return 'bg-gradient-to-br from-slate-700 to-blue-700';
    // Clear
    return 'bg-gradient-to-br from-blue-600 to-indigo-600';
  };

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Kiểm tra ban đầu
    checkScrollButtons();

    // Thêm event listener cho scroll
    container.addEventListener('scroll', checkScrollButtons);
    
    // Cleanup
    return () => container.removeEventListener('scroll', checkScrollButtons);
  }, []);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = 200;
    const gap = 16;
    const itemWidth = cardWidth + gap;
    const containerWidth = container.clientWidth;
    const scrollPosition = container.scrollLeft;
    const maxScroll = container.scrollWidth - containerWidth;
    
    // Số lượng card hiển thị trong viewport
    const visibleCards = Math.floor(containerWidth / itemWidth);
    
    // Scroll theo số lượng card hiển thị, tối thiểu là 2 card
    const scrollAmount = Math.max(2, Math.floor(visibleCards / 2)) * itemWidth;

    let newPosition;
    if (direction === 'left') {
      newPosition = Math.max(0, scrollPosition - scrollAmount);
    } else {
      newPosition = Math.min(maxScroll, scrollPosition + scrollAmount);
    }

    container.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
  };

  return (
    <div className="mt-[96px] p-5 mb-[-7px] max-w-7xl mx-auto p-8 border border-gray-700/50 rounded-lg shadow-2xl bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-100 flex items-center justify-center gap-3">
        <WiBarometer className="text-blue-400" size={36} />
        Thời tiết hôm nay
      </h1>
      
      <div className="mb-8 p-4 bg-white/5 rounded-xl backdrop-blur-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-100">Giờ GMT</h2>
          <p className="text-blue-300 font-bold px-4 py-2 bg-white/10 rounded-lg backdrop-blur">
            {new Date().toLocaleTimeString('vi-VN', {
              timeZone: 'GMT',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </p>
        </div>
        
        <div className="relative group">
          <button
            onClick={() => scroll('left')}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-blue-600/80 hover:bg-blue-500 text-white rounded-full backdrop-blur-sm transition-all duration-300 transform hover:scale-110 hover:shadow-lg hover:shadow-blue-500/50 ${
              canScrollLeft 
                ? 'opacity-0 group-hover:opacity-100' 
                : 'opacity-0 not-allowed'
            }`}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
          >
            <FiChevronLeft size={28} />
          </button>

          <button
            onClick={() => scroll('right')}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-blue-600/80 hover:bg-blue-500 text-white rounded-full backdrop-blur-sm transition-all duration-300 transform hover:scale-110 hover:shadow-lg hover:shadow-blue-500/50 ${
              canScrollRight 
                ? 'opacity-0 group-hover:opacity-100' 
                : 'opacity-0 not-allowed'
            }`}
            disabled={!canScrollRight}
            aria-label="Scroll right"
          >
            <FiChevronRight size={28} />
          </button>

          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-gray-900/90 via-gray-900/50 to-transparent z-10 transition-opacity duration-300"></div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gray-900/90 via-gray-900/50 to-transparent z-10 transition-opacity duration-300"></div>
          
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-hide px-4 scroll-smooth"
          >
            <div className="flex gap-4 pb-4 min-w-max">
              {MAJOR_CITIES.map((city) => (
                <div 
                  key={city.name}
                  className="bg-white/10 p-4 rounded-xl backdrop-blur min-w-[200px] transition-all duration-300 hover:bg-white/20 hover:transform hover:scale-105 pointer border border-white/10 hover:border-blue-400/30 hover:shadow-lg hover:shadow-blue-500/10"
                  onClick={() => handleCitySelect(city)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center border border-blue-400/30">
                      <span className="text-sm font-bold text-blue-300">{city.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-100 font-medium truncate">{city.name}</p>
                      <p className="text-blue-300/80 text-xs">{city.country}</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-blue-300 mb-1">
                    {worldTimes[city.name]}
                  </p>
                  <p className="text-gray-300/80 text-sm">
                    {new Date().toLocaleDateString('vi-VN', {
                      timeZone: city.timezone,
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative mb-8">
        <div className="flex items-center gap-4">
          <div className="relative flex-grow">
            <button
              onClick={() => setShowSearchResults(!showSearchResults)}
              className="w-full px-6 py-4 text-left rounded-xl border border-white/10 bg-white/5 text-gray-100 hover:bg-white/10 transition-all flex items-center justify-between"
            >
              <span>{searchInput || "Chọn thành phố..."}</span>
              <svg
                className={`w-5 h-5 transition-transform ${showSearchResults ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showSearchResults && (
              <div className="absolute z-20 w-full mt-2 bg-gray-800/95 border border-white/10 rounded-xl shadow-xl max-h-[400px] overflow-y-auto backdrop-blur-xl">
                <div className="sticky top-0 bg-gray-800 p-2">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={handleSearchChange}
                    placeholder="Tìm kiếm thành phố..."
                    className="w-full px-4 py-2 rounded-lg border border-white/10 bg-gray-800 text-gray-100 focus:border-blue-500 focus:outline-none placeholder-gray-500"
                  />
                </div>
                
                <div className="divide-y divide-gray-800">
                  {CITIES_TIMEZONE.map((city) => (
                    <div
                      key={city.name}
                      onClick={() => handleCitySelect(city)}
                      className="flex items-center justify-between p-4 hover:bg-gray-800 pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                          <span className="text-sm">{city.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-gray-100 font-medium">{city.name}</p>
                          <p className="text-gray-400 text-sm">{city.country}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-400 font-medium">
                          {new Date().toLocaleTimeString('vi-VN', {
                            timeZone: city.timezone,
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                        </p>
                        <p className="text-gray-500 text-xs">{city.timezone.split('/')[1].replace('_', ' ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSearch}
            className="px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <FiSearch size={20} />
            <span>Tìm</span>
          </button>
        </div>

        {showSearchResults && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowSearchResults(false)}
          />
        )}
      </div>

      {selectedCityTime && (
        <div className="mb-6 p-4 bg-gray-900/30 rounded-xl backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-100">{selectedCityTime.name}</h3>
              <p className="text-gray-400">{selectedCityTime.country}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-400">{selectedCityTime.time}</p>
              <p className="text-gray-500 text-sm">{selectedCityTime.timezone.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-16 bg-gray-900/50 backdrop-blur-lg rounded-2xl shadow-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-blue-400 mx-auto"></div>
          <p className="mt-6 text-gray-400 text-lg">Đang tải dữ liệu thời tiết...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border-l-4 border-red-500 text-red-400 p-6 rounded-lg">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {weather && !loading && !error && (
        <div className={`rounded-2xl p-8 text-gray-100 shadow-lg transform transition-all backdrop-blur-lg ${getWeatherBackground(weather.current.condition.code)}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="weather-main space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-bold text-gray-100">{weather.location.name}</h2>
                <span className="text-lg font-medium bg-white/10 px-4 py-2 rounded-full backdrop-blur">
                  {new Date().toLocaleDateString('vi-VN', { weekday: 'long' })}
                </span>
              </div>
              
              <div className="flex items-center gap-4 bg-black/30 p-6 rounded-xl backdrop-blur">
                <img
                  src={weather.current.condition.icon.replace('64x64', '128x128')}
                  alt={weather.current.condition.text}
                  className="w-40 h-40 drop-shadow-lg"
                />
                <div>
                  <p className="text-7xl font-bold">{Math.round(weather.current.temp_c)}°C</p>
                  <p className="text-2xl capitalize mt-2">{weather.current.condition.text}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 backdrop-blur rounded-xl p-6 flex items-center gap-3 transition-transform hover:scale-105">
                  <WiSunrise size={32} className="text-yellow-400" />
                  <div>
                    <p className="text-sm font-medium">Bình minh</p>
                    <p className="text-lg font-bold">{weather.forecast.forecastday[0].astro.sunrise}</p>
                  </div>
                </div>
                <div className="bg-black/30 backdrop-blur rounded-xl p-6 flex items-center gap-3 transition-transform hover:scale-105">
                  <WiSunset size={32} className="text-orange-400" />
                  <div>
                    <p className="text-sm font-medium">Hoàng hôn</p>
                    <p className="text-lg font-bold">{weather.forecast.forecastday[0].astro.sunset}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="weather-details space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 backdrop-blur rounded-xl p-6 flex items-center gap-4 transition-transform hover:scale-105">
                  <WiHumidity size={42} className="text-blue-400" />
                  <div>
                    <p className="text-sm font-medium">Độ ẩm</p>
                    <p className="text-2xl font-bold">{weather.current.humidity}%</p>
                  </div>
                </div>
                <div className="bg-black/30 backdrop-blur rounded-xl p-6 flex items-center gap-4 transition-transform hover:scale-105">
                  <WiStrongWind size={42} className="text-blue-400" />
                  <div>
                    <p className="text-sm font-medium">Tốc độ gió</p>
                    <p className="text-2xl font-bold">{weather.current.wind_kph} km/h</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur rounded-xl p-6 flex items-center gap-4 transition-transform hover:scale-105">
                <WiBarometer size={42} className="text-blue-400" />
                <div>
                  <p className="text-sm font-medium">Áp suất</p>
                  <p className="text-2xl font-bold">{weather.current.pressure_mb} hPa</p>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur rounded-xl p-6 transition-transform hover:scale-105">
                <p className="text-sm font-medium mb-4">Nhiệt độ</p>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium">Cảm giác như</p>
                    <p className="text-2xl font-bold">{Math.round(weather.current.feelslike_c)}°C</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cao/Thấp</p>
                    <p className="text-2xl font-bold">
                      {Math.round(weather.forecast.forecastday[0].day.maxtemp_c)}°/
                      {Math.round(weather.forecast.forecastday[0].day.mintemp_c)}°
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .backdrop-blur {
          backdrop-filter: blur(12px);
        }
        .transition-transform {
          transition: transform 0.3s ease-in-out;
        }
        .hover\:scale-105:hover {
          transform: scale(1.05);
        }
        /* Hide scrollbar but keep functionality */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;     /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;            /* Chrome, Safari and Opera */
        }
        
        /* Smooth scrolling */
        .scroll-smooth {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x proximity;
          scroll-padding: 1rem;
          -webkit-scroll-snap-type: x proximity;
        }
        
        /* Snap points cho các items */
        .scroll-smooth > div > div {
          scroll-snap-align: start;
          scroll-snap-stop: normal;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Animation cho các card */
        .scroll-smooth > div > div {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
          will-change: transform;
        }

        /* Hiệu ứng hover cho các card */
        .scroll-smooth > div > div:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.2);
          z-index: 1;
        }

        /* Animation cho nút scroll */
        .group:hover button {
          opacity: 1;
          transform: translateY(-50%) scale(1);
        }

        /* Animation cho gradient overlays */
        .group:hover .absolute {
          opacity: 0.9;
        }

        /* Thêm smooth transition cho tất cả các hiệu ứng */
        * {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
} 