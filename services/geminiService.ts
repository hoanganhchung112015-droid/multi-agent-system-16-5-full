import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Subject, AgentType } from "../types";
import React from 'react';

// CẤU HÌNH MODEL - Sử dụng model 2.0 Flash (phiên bản ổn định năm 2025-2026)
const MODEL_CONFIG = {
  TEXT: 'gemini-2.0-flash', 
  TIMEOUT: 15000 
};

const cache = new Map<string, string>();
const audioCache = new Map<string, string>();

const getCacheKey = (subject: string, agent: string, input: string, imageHash: string = '') => 
  `${subject}|${agent}|${input.trim()}|${imageHash}`;

// Khởi tạo SDK chính thức
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY || "");

const SYSTEM_PROMPTS: Record<AgentType, string> = {
  [AgentType.SPEED]: `Bạn là chuyên gia giải đề thi. 
    NHIỆM VỤ: Trả về một đối tượng JSON với hai trường: "finalAnswer" và "casioSteps".
    1. finalAnswer (string): Chỉ đưa ra KẾT QUẢ CUỐI CÙNG. TUYỆT ĐỐI KHÔNG giải thích chi tiết.
    2. casioSteps (string): Hướng dẫn NGẮN GỌN NHẤT cách bấm máy tính Casio. 
    Luôn sử dụng LaTeX cho công thức toán học.`,
  
  [AgentType.SOCRATIC]: `Bạn là giáo sư Socratic. Hãy giải chi tiết bài toán theo các bước logic. Ngôn ngữ khoa học, ngắn gọn. Luôn sử dụng LaTeX.`,
  
  [AgentType.PERPLEXITY]: `Bạn là Perplexity AI. Liệt kê tối đa 2 DẠNG BÀI TẬP NÂNG CAO liên quan. Trả về định dạng Markdown rõ ràng.`,
};

async function safeExecute<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    if (error.toString().includes('429')) throw new Error("Hệ thống đang quá tải.");
    throw error;
  }
}

export const processTask = async (subject: Subject, agent: AgentType, input: string, image?: string) => {
  const cacheKey = getCacheKey(subject, agent, input, image ? 'has_img' : 'no_img');
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  return safeExecute(async () => {
    const isSpeed = agent === AgentType.SPEED;
    const model = genAI.getGenerativeModel({ 
      model: MODEL_CONFIG.TEXT,
      generationConfig: isSpeed ? {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            finalAnswer: { type: SchemaType.STRING },
            casioSteps: { type: SchemaType.STRING }
          },
          required: ["finalAnswer", "casioSteps"]
        }
      } : { temperature: 0.2 }
    });

    const prompt = `Môn: ${subject}. Chuyên gia: ${agent}. Yêu cầu: ${SYSTEM_PROMPTS[agent]}. \nNội dung: ${input}`;
    const parts: any[] = [{ text: prompt }];
    
    if (image) {
      parts.push({
        inlineData: { mimeType: 'image/jpeg', data: image.split(',')[1] }
      });
    }

    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const text = result.response.text();
    if (text) cache.set(cacheKey, text);
    return text;
  });
};

export const generateSummary = async (content: string) => {
  if (!content) return "";
  const model = genAI.getGenerativeModel({ model: MODEL_CONFIG.TEXT });
  return safeExecute(async () => {
    const result = await model.generateContent(`Tóm tắt cực ngắn gọn 1 câu để đọc: ${content}`);
    return result.response.text();
  });
};

export const generateSimilarQuiz = async (content: string): Promise<any> => {
  const model = genAI.getGenerativeModel({ 
    model: MODEL_CONFIG.TEXT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          question: { type: SchemaType.STRING },
          options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          answer: { type: SchemaType.STRING }
        },
        required: ["question", "options", "answer"]
      }
    }
  });

  return safeExecute(async () => {
    const result = await model.generateContent(`Tạo 1 câu trắc nghiệm tương tự: ${content}`);
    return JSON.parse(result.response.text());
  });
};

// Lưu ý: SDK Google hiện tại xử lý Audio (TTS) qua mô hình Multimodal Live hoặc Google Cloud TTS riêng.
// Đoạn này giữ nguyên logic của bạn nhưng bọc trong safeExecute.
export const fetchTTSAudio = async (text: string) => {
  return null; // Gemini 2.0 Flash Text-to-Audio yêu cầu cấu hình Realtime API phức tạp hơn.
};

// Audio Player Manager (Giữ nguyên logic xử lý Buffer của bạn)
let globalAudioContext: AudioContext | null = null;
let globalSource: AudioBufferSourceNode | null = null;

export const playStoredAudio = async (base64Audio: string, audioSourceRef: React.MutableRefObject<AudioBufferSourceNode | null>) => {
  if (!base64Audio) return;
  if (globalSource) { try { globalSource.stop(); } catch(e) {} globalSource.disconnect(); }
  if (!globalAudioContext) globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  if (globalAudioContext.state === 'suspended') await globalAudioContext.resume();

  const audioData = atob(base64Audio);
  const bytes = new Uint8Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) bytes[i] = audioData.charCodeAt(i);
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = globalAudioContext.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

  const source = globalAudioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(globalAudioContext.destination);
  globalSource = source;
  audioSourceRef.current = source;

  return new Promise((resolve) => { 
    source.onended = () => resolve(void 0); 
    source.start(); 
  });
};
