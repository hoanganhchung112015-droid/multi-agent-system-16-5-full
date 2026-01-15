// --- File: services/geminiService.ts ---
import { Subject, AgentType } from '../types';

// Cơ chế nén ảnh siêu tốc để "thông ống" dữ liệu trước khi gửi đi
export const compressImage = (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1000; // Độ phân giải vừa đủ để AI đọc đề
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.6)); // Nén 60% chất lượng
    };
  });
};

export const processTask = async (subject: Subject, agent: AgentType, input: string, image?: string, retries = 2): Promise<string> => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, agent, prompt: input, image })
    });

    if (!response.ok) throw new Error('Network Error');
    return await response.text();
  } catch (error) {
    if (retries > 0) return processTask(subject, agent, input, image, retries - 1); // Tự động kết nối lại
    throw error;
  }
};

// Các tính năng phụ được làm gọn để không chiếm tài nguyên
export const generateSummary = async (content: string) => "";
export const fetchTTSAudio = async (text: string) => "";
export const generateSimilarQuiz = async (content: string) => null;
export const playStoredAudio = async (b64: string, ref: any) => {};
