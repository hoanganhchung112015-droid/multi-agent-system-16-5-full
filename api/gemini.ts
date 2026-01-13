export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: 'Thiếu API Key trên Server' }), { status: 500 });

  try {
    const { subject, agent, input, image } = await req.json();

    // Cấu hình Prompt chuyên sâu cho từng Agent
    let systemInstruction = "";
    if (agent.includes("Giải 1s")) {
      systemInstruction = `Bạn là chuyên gia giải đề thi. Trả về JSON: {"finalAnswer": "đáp án và kết quả kèm LaTeX", "casioSteps": "các bước bấm máy"}. Không giải thích dài dòng.`;
    } else if (agent.includes("Gia sư")) {
      systemInstruction = `Bạn là giáo sư Socratic. Hãy giải thích các bước tư duy logic, ngắn gọn, đi thẳng vào trọng tâm kiến thức. Dùng LaTeX.`;
    } else {
      systemInstruction = `Bạn là chuyên gia luyện kỹ năng. Hãy đưa ra 2 bài tập trắc nghiệm tương tự mức độ vận dụng cao kèm đáp án đối chứng.`;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `Môn: ${subject}. ${systemInstruction} Đề bài: ${input}` },
            ...(image ? [{ inlineData: { mimeType: "image/jpeg", data: image.includes(",") ? image.split(",")[1] : image } }] : [])
          ]
        }],
        generationConfig: {
          responseMimeType: agent.includes("Giải 1s") ? "application/json" : "text/plain",
          temperature: 0.1
        }
      })
    });

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    return new Response(content, { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Lỗi xử lý AI' }), { status: 500 });
  }
}
