// --- File: services/geminiService.ts ---
export const compressImage = (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1000;
      let width = img.width; let height = img.height;
      if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
  });
};

export const processTask = async (subject: any, agent: any, input: string, image?: string, retries = 2): Promise<string> => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, agent, prompt: input, image })
    });
    if (!response.ok) throw new Error();
    return await response.text();
  } catch (error) {
    if (retries > 0) return processTask(subject, agent, input, image, retries - 1);
    return "Lỗi kết nối mạch.";
  }
};

// Vô hiệu hóa các hàm phụ gây lag
export const generateSummary = async () => "";
export const generateSimilarQuiz = async () => null;
export const fetchTTSAudio = async () => "";
export const playStoredAudio = async () => {};
