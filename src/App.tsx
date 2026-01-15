import React, { useState, useEffect, useCallback, useRef } from 'react';
// Giữ lại toàn bộ phần import CSS và Icon cũ của bạn ở đây
// import { Send, Mic, Image as ImageIcon, ... } from 'lucide-react';

export default function App() {
  // --- STATE CŨ VÀ MỚI (Để giao diện cũ không bị lỗi) ---
  const [selectedSubject, setSelectedSubject] = useState("Toán");
  const [voiceText, setVoiceText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [allResults, setAllResults] = useState<Record<string, string>>({});

  // --- LOGIC PHÂN LUỒNG BẬC THANG (Tính năng mới) ---
  const handleStartProcessing = useCallback(async (text: string, img: string | null) => {
    if (!selectedSubject) return;
    setLoading(true);
    setAllResults({}); // Reset kết quả cũ

    try {
      // GIAI ĐOẠN 1: GIẢI NHANH 1S (Hoặc Gia sư AI)
      setLoadingStatus("⚡ Đang ưu tiên Giải nhanh...");
      const res1 = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: selectedSubject, agent: 'SPEED', prompt: text, image: img })
      }).then(r => r.text());

      // Cập nhật kết quả 1 ngay để "Thông mạch"
      setAllResults(prev => ({ ...prev, SPEED: res1 }));
      setLoading(false); // Tắt loading chính cho người dùng đỡ chờ

      // GIAI ĐOẠN 2: LUYỆN SKILL (Tiếp sức hậu cần)
      setLoadingStatus("📚 Đang chuẩn bị Luyện Skill...");
      const res2 = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: selectedSubject, agent: 'PERPLEXITY', prompt: text, image: img })
      }).then(r => r.text());

      setAllResults(prev => ({ ...prev, PERPLEXITY: res2 }));
    } catch (error) {
      console.error("Mạch bận:", error);
      setLoading(false);
    }
    setLoadingStatus("");
  }, [selectedSubject]);

  // --- PHẦN HIỂN THỊ (Dán giao diện cũ của bạn vào đây) ---
  return (
    <div className="flex h-screen bg-slate-50"> 
      {/* 1. SIDEBAR CŨ CỦA BẠN */}
      <aside className="w-64 bg-white border-r hidden md:block">
         {/* Copy code Sidebar cũ của bạn vào đây */}
      </aside>

      <main className="flex-1 flex flex-col relative">
        {/* 2. HEADER CŨ */}
        <header className="p-4 border-b bg-white flex justify-between items-center">
          <h1 className="font-bold text-xl text-blue-600">Giải nhanh 1S & Gia sư AI</h1>
          {loadingStatus && <span className="text-sm text-orange-500 animate-pulse">{loadingStatus}</span>}
        </header>

        {/* 3. KHU VỰC HIỂN THỊ KẾT QUẢ (Nơi chứa luồng dữ liệu) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* LUỒNG ƯU TIÊN 1 */}
          {allResults['SPEED'] && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-blue-700 font-bold mb-2">🚀 Kết quả Giải nhanh:</h3>
              <div className="prose max-w-none">{allResults['SPEED']}</div>
            </div>
          )}

          {/* LUỒNG TIẾP SỨC 2 */}
          {allResults['PERPLEXITY'] && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm animate-fade-in">
              <h3 className="text-green-700 font-bold mb-2">📖 Luyện tập bổ trợ:</h3>
              <div className="prose max-w-none">{allResults['PERPLEXITY']}</div>
            </div>
          )}
        </div>

        {/* 4. THANH INPUT CŨ CỦA BẠN */}
        <footer className="p-4 bg-white border-t">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
             <input 
               type="text" 
               value={voiceText}
               onChange={(e) => setVoiceText(e.target.value)}
               placeholder="Nhập câu hỏi hoặc chụp ảnh..."
               className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
             <button 
               onClick={() => handleStartProcessing(voiceText, image)}
               disabled={loading}
               className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
             >
               {loading ? "Đang xử lý..." : "Gửi ngay"}
             </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
