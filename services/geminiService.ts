import { Subject, AgentType } from "../types";

const cache = new Map<string, string>();

export const processTask = async (subject: Subject, agent: AgentType, input: string, image?: string) => {
  const cacheKey = `${subject}-${agent}-${input.substring(0, 30)}-${!!image}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, agent, input, image })
  });

  if (!response.ok) throw new Error("Không thể kết nối với trí tuệ nhân tạo");
  
  const resultText = await response.text();
  if (resultText) cache.set(cacheKey, resultText);
  return resultText;
};

export const generateSummary = async (content: string) => {
  // Logic tóm tắt nhanh để đọc voice
  return content.substring(0, 100) + "..."; 
};

export const fetchTTSAudio = async (text: string) => {
    // Để tiết kiệm, bạn có thể dùng Web Speech API thay vì gọi Gemini TTS liên tục
    return null; 
};
