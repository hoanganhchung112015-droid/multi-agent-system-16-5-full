export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const apiKey = process.env.GEMINI_API_KEY;
  const { subject, prompt, image, agent } = await req.json();

  const isSpeed = agent === 'SPEED';
  const systemPrompt = isSpeed 
    ? `Bạn là chuyên gia giải đề nhanh. Trả về JSON: {"finalAnswer": "đáp án ngắn gọn kèm LaTeX"}. Không giải thích.` 
    : `Bạn là giáo viên môn ${subject} phong cách ${agent}. Giải chi tiết, ngắn gọn, dùng LaTeX.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `${systemPrompt}\nNội dung: ${prompt}` },
            ...(image ? [{ inlineData: { mimeType: "image/jpeg", data: image.split(",")[1] || image } }] : [])
          ]
        }],
        generationConfig: { temperature: 0.1, ...(isSpeed ? { responseMimeType: "application/json" } : {}) }
      })
    });

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lỗi AI";
    return new Response(resultText, { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Mạch nghẽn' }), { status: 504 });
  }
}
