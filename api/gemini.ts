// --- api/gemini.ts ---
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { subject, prompt, image, agent } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  // Cấu hình siêu tốc: Speed trả về JSON, các Agent khác trả về Text
  const isSpeed = agent === 'SPEED';
  const systemPrompt = isSpeed 
    ? `Chỉ trả về JSON: {"finalAnswer": "đáp án"}. Tuyệt đối không giải thích, không Casio.`
    : `Bạn là giáo viên môn ${subject} phong cách ${agent}. Giải ngắn gọn bằng LaTeX.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `${systemPrompt}\nNội dung: ${prompt}` },
            ...(image ? [{ inlineData: { mimeType: "image/jpeg", data: image.split(",")[1] } }] : [])
          ]
        }],
        generationConfig: { temperature: 0.2, ...(isSpeed ? { responseMimeType: "application/json" } : {}) }
      })
    });

    const data = await response.json();
    return new Response(data.candidates?.[0]?.content?.parts?.[0]?.text || "Lỗi mạch", {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response("Mạch bận", { status: 500 });
  }
}
