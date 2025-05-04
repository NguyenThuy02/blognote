// utils/firework.js
import confetti from 'canvas-confetti';

const playSound = (url) => {
  const audio = new Audio(url);
  audio.play();
};

// Thêm CSS rung màn hình vào DOM (chỉ 1 lần)
let hasInjectedShakeStyle = false;
const injectShakeCSS = () => {
  if (hasInjectedShakeStyle) return;

  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes shake {
      0% { transform: translateX(0); }
      20% { transform: translateX(-5px); }
      40% { transform: translateX(5px); }
      60% { transform: translateX(-5px); }
      80% { transform: translateX(5px); }
      100% { transform: translateX(0); }
    }
    .shake-screen {
      animation: shake 0.5s ease-in-out;
    }
  `;
  document.head.appendChild(style);
  hasInjectedShakeStyle = true;
};

// 🎆 Khi đúng
// 🎆 Khi đúng – dùng 7 màu cầu vồng, random 3
export function launchFirework() {
  const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8F00FF'];

  // Trộn thứ tự và chọn 3 màu
  const shuffled = rainbowColors.sort(() => 0.5 - Math.random());
  const colors = shuffled.slice(0, 3);

  confetti({
    particleCount: 120,
    spread: 90,
    origin: { y: 0.6 },
    colors,
    scalar: 1.1,
  });

  playSound('/sounds/correct.mp3');
}


// ❌ Khi sai
export function launchFailure() {
  injectShakeCSS();

  const style = Math.floor(Math.random() * 3);
  const shared = {
    particleCount: 60,
    gravity: 1.4,
    scalar: 0.6,
    colors: ['#ff0000', '#b30000'],
  };

  if (style === 0) {
    confetti({ ...shared, angle: 135, origin: { x: 0, y: 0 }, spread: 25 });
    confetti({ ...shared, angle: 45, origin: { x: 1, y: 0 }, spread: 25 });
  } else if (style === 1) {
    confetti({ ...shared, angle: 90, origin: { y: 0 }, spread: 50, particleCount: 100 });
  } else {
    confetti({ ...shared, angle: 90, origin: { x: 0.5, y: 0 }, spread: 30 });
  }

  playSound('/sounds/wrong.mp3');

  const body = document.body;
  body.classList.add('shake-screen');
  setTimeout(() => body.classList.remove('shake-screen'), 500);
}
