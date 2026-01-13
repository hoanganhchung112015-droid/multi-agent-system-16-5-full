export const config = { runtime: 'edge' };

export default async function (req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: 'Missing API Key' }), { status: 500 });

  try {
    const { subject, agent, input, image } = await req.json();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `Môn: ${subject}. Chuyên gia: ${agent}. Nội dung: ${input}` },
            ...(image ? [{ inlineData: { mimeType: "image/jpeg", data: image.includes(",") ? image.split(",")[1] : image } }] : [])
          ]
        }],
        generationConfig: {
          // Chỉ ép JSON khi dùng Agent SPEED (Giải 1s)
          responseMimeType: agent.includes("Giải 1s") ? "application/json" : "text/plain",
          temperature: 0.1
        }
      })
    });

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    return new Response(content, { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server Error' }), { status: 500 });
  }
}
