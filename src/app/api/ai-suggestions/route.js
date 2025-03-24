import { NextResponse } from "next/server";


export async function POST(request) {
  const { note } = await request.json();


  if (!note?.trim()) {
    console.log("Không có ghi chú, trả về thông báo lỗi.");
    return NextResponse.json(
      { error: "Vui lòng nhập ghi chú trước khi tạo gợi ý." },
      { status: 400 }
    );
  }


  try {
    console.log("Gửi yêu cầu đến Ollama với note:", note);
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma:2b",
        prompt: `Dựa trên ghi chú: "${note}", hãy tạo ra các gợi ý sáng tạo và cụ thể để phát triển nội dung. Trả về một đối tượng JSON với các trường sau:
          - titles: mảng 3 chuỗi là tiêu đề gợi ý, mỗi tiêu đề phải liên quan đến nội dung ghi chú và có tính sáng tạo.
          - ideas: mảng 3 chuỗi là ý tưởng phát triển, mỗi ý tưởng phải mở rộng nội dung ghi chú theo hướng chi tiết và thú vị.
          - expanded: chuỗi là một đoạn văn mở rộng (khoảng 2-3 câu) dựa trên ghi chú, viết theo phong cách tự nhiên và hấp dẫn.
          - tips: mảng 3 chuỗi là mẹo ghi chú hiệu quả, liên quan đến nội dung ghi chú nếu có thể, nếu không thì đưa ra mẹo chung.
        Định dạng JSON chính xác: {"titles": ["Tiêu đề 1", "Tiêu đề 2", "Tiêu đề 3"], "ideas": ["Ý 1", "Ý 2", "Ý 3"], "expanded": "Đoạn văn mở rộng", "tips": ["Mẹo 1", "Mẹo 2", "Mẹo 3"]}
        Chỉ trả về JSON, không thêm giải thích hoặc nội dung khác.`,
        stream: false,
      }),
    });


    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lỗi từ Ollama - Trạng thái:", response.status, "Nội dung:", errorText);
      throw new Error(`Lỗi từ Ollama: ${response.status} - ${errorText}`);
    }


    const data = await response.json();
    console.log("Phản hồi thô từ Ollama:", JSON.stringify(data, null, 2));


    let parsedData;
    try {
      if (!data.response) {
        console.error("Phản hồi từ Ollama không chứa trường 'response':", data);
        throw new Error("Phản hồi từ Ollama không chứa dữ liệu hợp lệ.");
      }


      let cleanedResponse = data.response
        .replace(/```json\n|\n```/g, "")
        .trim()
        .replace(/,\s*([\]}])/g, "$1"); // Xóa dấu phẩy thừa


      console.log("Dữ liệu đã làm sạch trước khi parse:", cleanedResponse);
      parsedData = JSON.parse(cleanedResponse);
      console.log("Dữ liệu đã parse:", parsedData);


      if (
        !parsedData.titles ||
        !parsedData.ideas ||
        !parsedData.expanded ||
        !parsedData.tips ||
        !Array.isArray(parsedData.titles) ||
        !Array.isArray(parsedData.ideas) ||
        !Array.isArray(parsedData.tips)
      ) {
        console.error("Dữ liệu không đúng định dạng:", parsedData);
        throw new Error("Dữ liệu từ Ollama không đúng định dạng mong đợi.");
      }
    } catch (e) {
      console.error("Lỗi chi tiết khi parse dữ liệu:", e.message, "Dữ liệu thô:", data.response);
      return NextResponse.json(
        { error: "Không thể tạo gợi ý do lỗi định dạng dữ liệu từ AI. Vui lòng kiểm tra log." },
        { status: 500 }
      );
    }


    const suggestions = {
      titles: parsedData.titles.slice(0, 3).map(String),
      ideas: parsedData.ideas.slice(0, 3).map(String),
      expanded: String(parsedData.expanded),
      tips: parsedData.tips.slice(0, 3).map(String),
    };
    console.log("Gợi ý sau khi chuẩn hóa:", suggestions);


    return NextResponse.json(suggestions, { status: 200 });
  } catch (error) {
    console.error("Lỗi tổng quát:", error.message);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tạo gợi ý. Vui lòng kiểm tra kết nối với Ollama." },
      { status: 500 }
    );
  }
}
