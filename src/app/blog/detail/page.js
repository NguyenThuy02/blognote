'use client';

import { useState } from 'react';
import { launchFirework, launchFailure } from "../../../utils/firework";

export default function PlayPage() {
  const [answer, setAnswer] = useState('');
  const correctAnswer = '42';

  const handleSubmit = () => {
    if (answer === correctAnswer) {
      launchFirework();
    } else {
      launchFailure();
    }
  };

  return (
    <div className="mt-35 p-6 text-center">
      <h1 className="text-xl font-bold mb-4">Trả lời: Số đúng là?</h1>
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="border rounded p-2"
      />
      <button
        onClick={handleSubmit}
        className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Kiểm tra
      </button>
    </div>
  );
}

