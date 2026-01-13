import { Subject, AgentType } from "../types";

const cache = new Map<string, string>();

const getCacheKey = (subject: string, agent: string, input: string, hasImg: boolean) => 
  `${subject}|${agent}|${input.substring(0,20)}|${hasImg}`;

export const processTask = async (subject: Subject, agent: AgentType, input: string, image?: string) => {
  const cacheKey = getCacheKey(subject, agent, input, !!image);
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, agent, input, image })
  });

  if (!response.ok) throw new Error("Lỗi kết nối AI");
  
  const resultText = await response.text();
  if (resultText) cache.set(cacheKey, resultText);
  return resultText;
};

// Các hàm tóm tắt và tạo Quiz cũng gọi qua fetch('/api/gemini') tương tự...
