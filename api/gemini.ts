import { GoogleGenerativeAI } from '@google/generative-ai';

// Cấu hình Edge Runtime để chạy siêu tốc và không bị Timeout
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method === 'HEAD') return new Response(null, { status: 200 });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const { subject, agentType, prompt, image } = await req.json();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    
    // Sử dụng Gemini 1.5 Flash để có tốc độ Streaming nhanh nhất
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let parts: any[] = [{ text: `Môn học: ${subject}. Nhiệm vụ: ${prompt}` }];

    // Nếu có ảnh, nạp vào luồng xử lý
    if (image) {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(',')[0].split(':')[1].split(';')[0];
      parts.push({
        inlineData: { data: base64Data, mimeType }
      });
    }

    // KÍCH HOẠT STREAMING
    const result = await model.generateContentStream(parts);

    // Tạo luồng dữ liệu trả về cho Frontend
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(encoder.encode(chunkText));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
