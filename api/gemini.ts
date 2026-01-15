// --- api/gemini.ts ---
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { subject, prompt, image, agent } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  const systemInstruction = agent === 'SPEED' 
    ? `Trả về JSON: {"finalAnswer": "..."}. Chỉ đáp án, bỏ mọi thứ khác.`
    : `Môn ${subject}. Giải chi tiết Socratic.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: `${systemInstruction}\nĐề: ${prompt}` },
          ...(image ? [{ inlineData: { mimeType: "image/jpeg", data: image.split(",")[1] } }] : [])
        ]
      }],
      generationConfig: { temperature: 0.1, ...(agent === 'SPEED' ? { responseMimeType: "application/json" } : {}) }
    })
  });

  const data = await response.json();
  return new Response(data.candidates?.[0]?.content?.parts?.[0]?.text || "Lỗi mạch", {
    headers: { 'Content-Type': 'application/json' }
  });
}
