import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Đảm bảo biến môi trường này được thiết lập
});

export async function POST(request) {
  const { noteContent } = await request.json();

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
    
    return new Response(JSON.stringify(response.choices[0].message.content), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
    return new Response('Đã xảy ra lỗi', { status: 500 });
  }
}