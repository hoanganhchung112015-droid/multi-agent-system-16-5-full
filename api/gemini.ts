// api/gemini.ts
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { subject, prompt, image, agent } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  // Giữ nguyên logic prompt cũ của bạn
  const isSpeed = agent === 'SPEED';
  const instruction = isSpeed 
    ? `Trả về JSON: {"finalAnswer": "đáp án"}. Không giải thích.` 
    : `Giải môn ${subject} phong cách ${agent}.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: `${instruction}\nĐề: ${prompt}` },
          ...(image ? [{ inlineData: { mimeType: "image/jpeg", data: image.split(",")[1] } }] : [])
        ]
      }],
      generationConfig: { temperature: 0.2, ...(isSpeed ? { responseMimeType: "application/json" } : {}) }
    })
  });

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lỗi phản hồi";
  return new Response(text);
}
