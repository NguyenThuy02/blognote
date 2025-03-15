/*const express = require('express');
const { OpenAI } = require('openai');

const app = express();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());

app.post('/api/suggest-structure', async (req, res) => {
  const { noteContent } = req.body;
  const prompt = `
    Bạn là một trợ lý AI. Dựa trên ghi chú sau:
    "${noteContent}"
    Hãy gợi ý một cấu trúc ghi chú hợp lý bao gồm:
    - Đề xuất tiêu đề
    - Danh sách ý tưởng
    - Checklist
    - Các bước cần thực hiện
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    console.log('API Response:', response); // In ra phản hồi từ API
    
    res.json(response.choices[0].message.content);
  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
    res.status(500).send('Đã xảy ra lỗi');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
*/
import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

function NoteApplication() {
  return (
    <div className="container mx-auto p-5">
      <h1 className="text-4xl font-bold">Home Page</h1>
    </div>
  );
}

export default NoteApplication;
