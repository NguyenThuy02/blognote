import { NextResponse } from "next/server";

export async function POST(request) {
  const { note, template = "freeform", instruction, language = "vi", model = "gemma:2b" } = await request.json();

  if (!note?.trim()) {
    console.log("Không có ghi chú, trả về thông báo lỗi.");
    return NextResponse.json(
      { error: "Vui lòng nhập ghi chú trước khi tạo gợi ý." },
      { status: 400 }
    );
  }

  try {
    // Xây dựng prompt dựa trên template và language
    let prompt;

    if (template === "freeform") {
      prompt = `Dựa trên ghi chú: "${note}", tạo gợi ý sáng tạo, ngắn gọn và đúng trọng tâm. Trả về JSON với:
        - titles: mảng 3 tiêu đề gợi ý, liên quan chặt chẽ đến ghi chú, mỗi tiêu đề dưới 10 từ.
        - ideas: mảng 3 ý tưởng phát triển, mỗi ý tưởng 1-2 câu, mở rộng ghi chú một cách cụ thể.
        - expanded: đoạn văn 2-3 câu mở rộng ghi chú, tự nhiên và đúng trọng tâm.
        - tips: mảng 3 mẹo ghi chú hiệu quả, mỗi mẹo 1 câu, ưu tiên liên quan đến ghi chú.
        Định dạng JSON: {"titles": ["Tiêu đề 1", "Tiêu đề 2", "Tiêu đề 3"], "ideas": ["Ý 1", "Ý 2", "Ý 3"], "expanded": "Đoạn văn", "tips": ["Mẹo 1", "Mẹo 2", "Mẹo 3"]}
        Ngôn ngữ: ${language === "vi" ? "Tiếng Việt" : language === "en" ? "English" : language === "fr" ? "Français" : "Русский"}.
        Chỉ trả JSON hợp lệ, không thêm giải thích, markdown, hay nội dung ngoài JSON.`;
    } else if (template === "meeting") {
      prompt = `Dựa trên chương trình nghị sự: "${note}", tạo gợi ý cuộc họp ngắn gọn, đúng trọng tâm, đảm bảo các mục nghị sự và hành động liên quan trực tiếp đến ghi chú. Trả về JSON với:
        - agendaItems: mảng 3 đối tượng, mỗi đối tượng có "text" (mục nghị sự, dưới 10 từ, phản ánh nội dung cụ thể của ghi chú) và "time" (thời gian hợp lý, ví dụ "5 min", "10 min", "15 min", phù hợp với tầm quan trọng của mục).
        - actionItems: mảng 3 đối tượng, mỗi đối tượng có "text" (hành động cụ thể, 1 câu, liên quan trực tiếp đến nghị sự), "owner" (người phụ trách, tên ngắn), "deadline" (YYYY-MM-DD, trong vòng 1 tháng từ ngày hiện tại).
        - participants: mảng 3 đối tượng, mỗi đối tượng có "name" (tên), "role" (vai trò, dưới 5 từ), "issueAddressed" (vấn đề giải quyết, 1 câu, liên quan trực tiếp đến nghị sự).
        Định dạng JSON: {
          "agendaItems": [{"text": "Mục 1", "time": "10 min"}, ...],
          "actionItems": [{"text": "Hành động 1", "owner": "Người 1", "deadline": "YYYY-MM-DD"}, ...],
          "participants": [{"name": "Tên 1", "role": "Vai trò 1", "issueAddressed": "Vấn đề 1"}, ...]
        }
        Ngôn ngữ: ${language === "vi" ? "Tiếng Việt" : language === "en" ? "English" : language === "fr" ? "Français" : "Русский"}.
        Chỉ trả JSON hợp lệ, không thêm giải thích, markdown, hay nội dung ngoài JSON.`;
    } else if (template === "study") {
      prompt = `Dựa trên ghi chú: "${note}", tạo gợi ý học tập toán học ngắn gọn, đúng trọng tâm. Trả về JSON với:
        - flashcards: mảng 3 đối tượng, mỗi đối tượng có "question" (câu hỏi ôn tập, dưới 10 từ) và "answer" (đáp án, 1-2 câu).
        - quizQuestions: mảng 3 đối tượng, mỗi đối tượng có "question" (câu hỏi trắc nghiệm, dưới 10 từ), "options" (mảng 4 chuỗi, mỗi chuỗi dưới 10 từ), "answer" (lựa chọn đúng, ký tự A/B/C/D).
        - keyConcepts: mảng 3 chuỗi khái niệm chính, mỗi chuỗi 1 câu, liên quan đến ghi chú.
        Định dạng JSON: {
          "flashcards": [{"question": "Câu hỏi 1", "answer": "Đáp án 1"}, ...],
          "quizQuestions": [{"question": "Câu hỏi 1", "options": ["A: ...", "B: ...", "C: ...", "D: ..."], "answer": "A"}, ...],
          "keyConcepts": ["Khái niệm 1", "Khái niệm 2", "Khái niệm 3"]
        }
        Ngôn ngữ: ${language === "vi" ? "Tiếng Việt" : language === "en" ? "English" : language === "fr" ? "Français" : "Русский"}.
        Chỉ trả JSON hợp lệ, không thêm giải thích, markdown, hay nội dung ngoài JSON.`;
    } else if (template === "daily") {
      prompt = `Dựa trên ghi chú: "${note}", tạo gợi ý kế hoạch hàng ngày ngắn gọn, đúng trọng tâm, ưu tiên các hoạt động thư giãn và tự chăm sóc phù hợp với ghi chú. Trả về JSON với:
        - relaxationActivities: mảng 3 đối tượng, mỗi đối tượng có "text" (hoạt động thư giãn, 1 câu, liên quan trực tiếp đến ghi chú) và "duration" (thời gian hợp lý, ví dụ "15 min", "30 min", "60 min", phù hợp với loại hoạt động).
        - productivityTasks: mảng 3 đối tượng, mỗi đối tượng có "text" (nhiệm vụ, 1 câu) và "priority" (High/Medium/Low).
        - selfCareIdeas: mảng 3 đối tượng, mỗi đối tượng có "text" (ý tưởng tự chăm sóc, 1 câu, liên quan đến ghi chú) và "duration" (thời gian hợp lý, ví dụ "10 min", "20 min", "30 min").
        - motivationalMessages: mảng 3 chuỗi thông điệp động viên, mỗi chuỗi 1 câu.
        Định dạng JSON: {
          "relaxationActivities": [{"text": "Hoạt động 1", "duration": "30 min"}, ...],
          "productivityTasks": [{"text": "Nhiệm vụ 1", "priority": "High"}, ...],
          "selfCareIdeas": [{"text": "Ý tưởng 1", "duration": "15 min"}, ...],
          "motivationalMessages": ["Thông điệp 1", "Thông điệp 2", "Thông điệp 3"]
        }
        Ngôn ngữ: ${language === "vi" ? "Tiếng Việt" : language === "en" ? "English" : language === "fr" ? "Français" : "Русский"}.
        Chỉ trả JSON hợp lệ, không thêm giải thích, markdown, hay nội dung ngoài JSON.`;
    } else if (instruction?.includes("tags")) {
      prompt = `Dựa trên ghi chú: "${note}", tạo 3-5 thẻ (tags) ngắn gọn, đúng trọng tâm. Trả về JSON: {"tags": ["tag1", "tag2", ...]}.
        Ngôn ngữ: ${language === "vi" ? "Tiếng Việt" : language === "en" ? "English" : language === "fr" ? "Français" : "Русский"}.
        Chỉ trả JSON hợp lệ, không thêm giải thích, markdown, hay nội dung ngoài JSON.`;
    } else {
      return NextResponse.json(
        { error: "Mẫu ghi chú không được hỗ trợ." },
        { status: 400 }
      );
    }

    // Gửi yêu cầu đến Ollama
    console.log(`Gửi yêu cầu đến Ollama với model: ${model}, template: ${template}, language: ${language}`);
    const textResponse = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          num_ctx: 2048, // Giới hạn ngữ cảnh cho gemma:2b
          temperature: 0.5 // Giảm thêm để tăng tính chính xác JSON
        },
      }),
    });

    if (!textResponse.ok) {
      const errorText = await textResponse.text();
      console.error("Lỗi từ Ollama - Trạng thái:", textResponse.status, "Nội dung:", errorText);
      throw new Error(`Lỗi từ Ollama: ${textResponse.status} - ${errorText}`);
    }

    const textData = await textResponse.json();
    console.log("Phản hồi thô từ Ollama:", textData.response);

    let parsedTextData;
    try {
      if (!textData.response) {
        console.error("Phản hồi từ Ollama không chứa 'response':", textData);
        throw new Error("Phản hồi từ Ollama không hợp lệ.");
      }

      let cleanedResponse = textData.response
        .replace(/```json\n|\n```/g, "") // Loại bỏ thẻ markdown
        .replace(/[\n\r]+/g, " ") // Thay thế xuống dòng
        .replace(/\s+/g, " ") // Chuẩn hóa khoảng trắng
        .trim()
        .replace(/,\s*([\]}])/g, "$1") // Xóa dấu phẩy thừa
        // Sửa lỗi thiếu dấu hai chấm
        .replace(/(\w+)\s*(\{|\[)/g, '$1:$2') // Thêm dấu : nếu thiếu sau tên thuộc tính
        .replace(/(\w+)\s+("|\[|\{)/g, '$1:$2'); // Thêm dấu : trước chuỗi, mảng, hoặc đối tượng

      console.log("Dữ liệu đã làm sạch:", cleanedResponse);

      // Thử parse JSON
      try {
        parsedTextData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("Lỗi parse JSON lần đầu:", parseError.message);
        // Thử sửa thêm lỗi JSON phổ biến
        cleanedResponse = cleanedResponse
          .replace(/([{,]\s*)(\w+)(\s+[}\]])/g, '$1"$2"$3') // Thêm dấu ngoặc kép cho thuộc tính
          .replace(/([{,]\s*)(\w+)(\s*:[^"])/g, '$1"$2"$3'); // Thêm dấu ngoặc kép nếu thiếu
        console.log("Dữ liệu sau khi sửa thêm:", cleanedResponse);
        parsedTextData = JSON.parse(cleanedResponse);
      }

      // Kiểm tra định dạng JSON theo template
      if (template === "freeform") {
        if (!parsedTextData.titles?.length || !parsedTextData.ideas?.length || !parsedTextData.expanded || !parsedTextData.tips?.length) {
          throw new Error("Phản hồi từ Ollama không đúng định dạng freeform.");
        }
      } else if (template === "meeting") {
        if (!parsedTextData.agendaItems?.length || !parsedTextData.actionItems?.length || !parsedTextData.participants?.length) {
          throw new Error("Phản hồi từ Ollama không đúng định dạng meeting.");
        }
      } else if (template === "study") {
        if (!parsedTextData.flashcards?.length || !parsedTextData.quizQuestions?.length || !parsedTextData.keyConcepts?.length) {
          throw new Error("Phản hồi từ Ollama không đúng định dạng study.");
        }
      } else if (template === "daily") {
        if (
          !parsedTextData.relaxationActivities?.length ||
          !parsedTextData.productivityTasks?.length ||
          !parsedTextData.selfCareIdeas?.length ||
          !parsedTextData.motivationalMessages?.length
        ) {
          throw new Error("Phản hồi từ Ollama không đúng định dạng daily.");
        }
      } else if (instruction?.includes("tags")) {
        if (!parsedTextData.tags?.length) {
          throw new Error("Phản hồi từ Ollama không đúng định dạng tags.");
        }
        parsedTextData.tags = parsedTextData.tags.slice(0, 5);
      }

      console.log("Dữ liệu đã parse:", parsedTextData);

      // Đảm bảo đúng số lượng phần tử
      if (template === "freeform") {
        parsedTextData.titles = parsedTextData.titles.slice(0, 3);
        parsedTextData.ideas = parsedTextData.ideas.slice(0, 3);
        parsedTextData.tips = parsedTextData.tips.slice(0, 3);
      } else if (template === "meeting") {
        parsedTextData.agendaItems = parsedTextData.agendaItems.slice(0, 3);
        parsedTextData.actionItems = parsedTextData.actionItems.slice(0, 3);
        parsedTextData.participants = parsedTextData.participants.slice(0, 3);
      } else if (template === "study") {
        parsedTextData.flashcards = parsedTextData.flashcards.slice(0, 3);
        parsedTextData.quizQuestions = parsedTextData.quizQuestions.slice(0, 3);
        parsedTextData.keyConcepts = parsedTextData.keyConcepts.slice(0, 3);
      } else if (template === "daily") {
        parsedTextData.relaxationActivities = parsedTextData.relaxationActivities.slice(0, 3);
        parsedTextData.productivityTasks = parsedTextData.productivityTasks.slice(0, 3);
        parsedTextData.selfCareIdeas = parsedTextData.selfCareIdeas.slice(0, 3);
        parsedTextData.motivationalMessages = parsedTextData.motivationalMessages.slice(0, 3);
      }

      console.log("Gợi ý chuẩn hóa:", parsedTextData);

      return NextResponse.json(parsedTextData, { status: 200 });
    } catch (e) {
      console.error("Lỗi xử lý dữ liệu:", e.message, "Dữ liệu thô:", textData.response);
      return NextResponse.json(
        { error: `Không thể tạo gợi ý từ Ollama: ${e.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Lỗi tổng quát:", error.message);
    return NextResponse.json(
      { error: `Lỗi tạo gợi ý: ${error.message}` },
      { status: 500 }
    );
  }
}