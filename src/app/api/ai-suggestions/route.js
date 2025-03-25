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
    // 1. Tạo gợi ý văn bản từ Ollama
    console.log("Gửi yêu cầu đến Ollama để tạo gợi ý văn bản với note:", note);
    const textResponse = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma:2b",
        prompt: `Dựa trên ghi chú: "${note}", hãy tạo ra các gợi ý sáng tạo và cụ thể để phát triển nội dung. Trả về một đối tượng JSON với các trường sau:
          - titles: mảng 3 chuỗi là tiêu đề gợi ý, mỗi tiêu đề phải liên quan đến nội dung ghi chú và có tính sáng tạo.
          - ideas: mảng 3 chuỗi là ý tưởng phát triển, mỗi ý tưởng phải mở rộng nội dung ghi chú theo hướng chi tiết và thú vị.
          - expanded: chuỗi là một đoạn văn mở rộng (khoảng 2-3 câu) dựa trên ghi chú, viết theo phong cách tự nhiên và hấp dẫn.
          - tips: mảng 3 chuỗi là mẹo ghi chú hiệu quả, liên quan đến nội dung ghi chú nếu có thể, nếu không thì đưa ra mẹo chung (đảm bảo luôn có đủ 3 mẹo).
        Định dạng JSON chính xác: {"titles": ["Tiêu đề 1", "Tiêu đề 2", "Tiêu đề 3"], "ideas": ["Ý 1", "Ý 2", "Ý 3"], "expanded": "Đoạn văn mở rộng", "tips": ["Mẹo 1", "Mẹo 2", "Mẹo 3"]}
        Chỉ trả về JSON, không thêm giải thích hoặc nội dung khác.`,
        stream: false,
      }),
    });

    if (!textResponse.ok) {
      const errorText = await textResponse.text();
      console.error("Lỗi từ Ollama (văn bản) - Trạng thái:", textResponse.status, "Nội dung:", errorText);
      throw new Error(`Lỗi từ Ollama (văn bản): ${textResponse.status} - ${errorText}`);
    }

    const textData = await textResponse.json();
    console.log("Phản hồi thô từ Ollama (văn bản):", JSON.stringify(textData, null, 2));

    let parsedTextData;
    try {
      if (!textData.response) {
        console.error("Phản hồi từ Ollama không chứa trường 'response':", textData);
        throw new Error("Phản hồi từ Ollama không chứa dữ liệu hợp lệ.");
      }

      let cleanedResponse = textData.response
        .replace(/```json\n|\n```/g, "") // Loại bỏ các thẻ markdown
        .replace(/[\n\r]+/g, " ") // Thay thế các ký tự xuống dòng bằng khoảng trắng
        .replace(/\s+/g, " ") // Chuẩn hóa khoảng trắng
        .trim()
        .replace(/,\s*([\]}])/g, "$1"); // Xóa dấu phẩy thừa trước dấu đóng

      console.log("Dữ liệu đã làm sạch trước khi parse (văn bản):", cleanedResponse);

      // Thử parse JSON
      try {
        parsedTextData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("Lỗi parse JSON:", parseError.message, "Dữ liệu đã làm sạch:", cleanedResponse);
        // Nếu parse thất bại, trả về dữ liệu mặc định
        parsedTextData = {
          titles: [],
          ideas: [],
          expanded: "Đoạn văn mở rộng mặc định.",
          tips: [],
        };
      }

      console.log("Dữ liệu đã parse (văn bản):", parsedTextData);

      // Kiểm tra và bổ sung nếu thiếu phần tử
      if (!parsedTextData.titles || !Array.isArray(parsedTextData.titles)) parsedTextData.titles = [];
      if (!parsedTextData.ideas || !Array.isArray(parsedTextData.ideas)) parsedTextData.ideas = [];
      if (!parsedTextData.expanded) parsedTextData.expanded = "Đoạn văn mở rộng mặc định.";
      if (!parsedTextData.tips || !Array.isArray(parsedTextData.tips)) parsedTextData.tips = [];

      // Bổ sung các gợi ý mặc định có ý nghĩa hơn
      const defaultTitles = [
        `Khám phá vẻ đẹp của ${note.split(" ")[0] || "chủ đề"}`,
        `Hành trình tìm hiểu ${note.split(" ")[0] || "ý tưởng"}`,
        `Bí mật đằng sau ${note.split(" ")[0] || "ghi chú"}`,
      ];
      const defaultIdeas = [
        `Tìm hiểu sâu hơn về ${note.split(" ")[0] || "chủ đề"} qua các ví dụ thực tế.`,
        `Kết hợp ${note.split(" ")[0] || "ý tưởng"} với những trải nghiệm cá nhân để tạo sự độc đáo.`,
        `Tạo một câu chuyện ngắn dựa trên ${note.split(" ")[0] || "ghi chú"} để truyền cảm hứng.`,
      ];
      const defaultTips = [
        "Sử dụng màu sắc để phân loại ghi chú, giúp bạn dễ dàng tìm kiếm.",
        "Ghi lại cảm xúc ngay khi chúng xuất hiện để giữ được sự chân thực.",
        "Tạo thói quen xem lại ghi chú hàng tuần để không bỏ lỡ ý tưởng hay.",
      ];

      // Đảm bảo mỗi mảng có đúng 3 phần tử
      parsedTextData.titles = [...parsedTextData.titles, ...defaultTitles].slice(0, 3);
      parsedTextData.ideas = [...parsedTextData.ideas, ...defaultIdeas].slice(0, 3);
      parsedTextData.tips = [...parsedTextData.tips, ...defaultTips].slice(0, 3);
    } catch (e) {
      console.error("Lỗi khi xử lý dữ liệu văn bản:", e.message, "Dữ liệu thô:", textData.response);
      return NextResponse.json(
        { error: `Không thể tạo gợi ý văn bản: ${e.message}` },
        { status: 500 }
      );
    }

    // 2. Tạo đối tượng gợi ý
    const suggestions = {
      titles: parsedTextData.titles.map(String),
      ideas: parsedTextData.ideas.map(String),
      expanded: String(parsedTextData.expanded),
      tips: parsedTextData.tips.map(String),
    };
    console.log("Gợi ý sau khi chuẩn hóa:", suggestions);

    return NextResponse.json(suggestions, { status: 200 });
  } catch (error) {
    console.error("Lỗi tổng quát:", error.message);
    return NextResponse.json(
      { error: `Đã xảy ra lỗi khi tạo gợi ý: ${error.message}` },
      { status: 500 }
    );
  }
}