export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const { subject, prompt, image, agent } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    const isSpeed = agent === 'SPEED';
    const systemInstruction = isSpeed 
      ? `Trả về JSON: {"finalAnswer": "đáp án toán học kèm LaTeX"}. Không giải thích, không Casio.` 
      : `Bạn là giáo viên môn ${subject}. Giải chi tiết bài tập theo phong cách luyện tập kỹ năng.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `${systemInstruction}\nNội dung: ${prompt}` },
            ...(image ? [{ inlineData: { mimeType: "image/jpeg", data: image.split(",")[1] || image } }] : [])
          ]
        }],
        generationConfig: { temperature: 0.1, ...(isSpeed ? { responseMimeType: "application/json" } : {}) }
      })
    });

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không có phản hồi";
    return new Response(result, { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Mạch bận' }), { status: 500 });
  }
}
