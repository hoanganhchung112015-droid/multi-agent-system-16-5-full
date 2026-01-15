// --- File: api/gemini.ts ---
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: 'Thiếu cấu hình API Key' }), { status: 500 });

  try {
    const { subject, prompt, image, agent } = await req.json();
    const isSpeed = agent === 'SPEED';

    // CHIẾN THUẬT: Chỉ dẫn cực đoan để AI không suy nghĩ lan man, giảm độ trễ
    const systemPrompt = isSpeed 
      ? `Bạn là chuyên gia giải đề nhanh. Trả về JSON: {"finalAnswer": "đáp án ngắn gọn kèm LaTeX"}. Không giải thích.` 
      : `Bạn là giáo viên môn ${subject} phong cách ${agent}. Giải chi tiết, ngắn gọn, dùng LaTeX.`;

    const body = {
      contents: [{
        role: "user",
        parts: [
          { text: `${systemPrompt}\nNội dung đề: ${prompt}` },
          ...(image ? [{ inlineData: { mimeType: "image/jpeg", data: image.split(",")[1] || image } }] : [])
        ]
      }],
      generationConfig: {
        temperature: 0.1, // Thấp nhất để ra kết quả thẳng, không treo máy
        ...(isSpeed ? { responseMimeType: "application/json" } : {})
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không có phản hồi từ AI";

    return new Response(resultText, { 
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store' // Đảm bảo dữ liệu luôn mới nhất
      } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Mạch lỗi, đang tự động kết nối lại...' }), { status: 504 });
  }
}
