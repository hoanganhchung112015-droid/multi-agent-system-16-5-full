import React, { useState, useEffect, useCallback, useRef } from 'react';
// Import các icon hoặc thư viện khác của bạn ở đây
// import { ... } from 'lucide-react';

// Giả định các Enum/Type của bạn (Hãy điều chỉnh nếu tên khác)
enum AgentType {
  SPEED = 'SPEED',
  PERPLEXITY = 'PERPLEXITY', // Luồng Luyện Skill
  ADVISOR = 'ADVISOR'
}

export default function App() {
  // --- 1. KHAI BÁO STATE (Mấu chốt để hết lỗi "... is not defined") ---
  const [selectedSubject, setSelectedSubject] = useState<string>("Toán");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [allResults, setAllResults] = useState<Record<string, string>>({});
  const [parsedSpeedResult, setParsedSpeedResult] = useState({ finalAnswer: "", casioSteps: "" });

  // --- 2. HÀM XỬ LÝ BẬC THANG (Logic bạn yêu cầu) ---
  const runAgents = useCallback(async (
    primary: AgentType, 
    all: AgentType[], 
    text: string, 
    img: string | null
  ) => {
    if (!selectedSubject) return;
    setLoading(true);
    setAllResults({}); // Xóa kết quả cũ để thông mạch

    try {
      // GIAI ĐOẠN 1: GIẢI NHANH 1S (Ưu tiên sống sót)
      setLoadingStatus("Đang ưu tiên Giải nhanh...");
      const response1 = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: selectedSubject, agent: primary, prompt: text, image: img })
      });
      const res1 = await response1.text();

      if (primary === AgentType.SPEED) {
        try {
          const parsed = JSON.parse(res1);
          setParsedSpeedResult({ finalAnswer: parsed.finalAnswer, casioSteps: "" });
          setAllResults(prev => ({ ...prev, [primary]: parsed.finalAnswer }));
        } catch {
          setAllResults(prev => ({ ...prev, [primary]: res1 }));
        }
      } else {
        setAllResults(prev => ({ ...prev, [primary]: res1 }));
      }

      // Thông mạch luồng 1 -> Cho người dùng xem bài ngay
      setLoading(false);

      // GIAI ĐOẠN 2: LUYỆN SKILL (Tiếp sức hậu cần)
      const skillAgent = AgentType.PERPLEXITY;
      if (all.includes(skillAgent)) {
        setLoadingStatus("Đang chuẩn bị Luyện Skill...");
        const response2 = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject: selectedSubject, agent: skillAgent, prompt: text, image: img })
        });
        const res2 = await response2.text();
        setAllResults(prev => ({ ...prev, [skillAgent]: res2 }));
      }
    } catch (error) {
      console.error("Lỗi luồng:", error);
      setLoading(false);
    }
    setLoadingStatus("");
  }, [selectedSubject]); // Dependency array quan trọng để không lỗi defined

  // --- 3. GIAO DIỆN TẠM THỜI ĐỂ KIỂM TRA ---
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold">AI Teacher - Luồng Bậc Thang</h1>
      <p>Trạng thái: {loadingStatus || (loading ? "Đang chạy..." : "Sẵn sàng")}</p>
      
      {/* Nơi hiển thị kết quả Giải nhanh */}
      <div className="mt-4 p-4 bg-white rounded shadow">
        <h2 className="font-bold text-blue-600">Giải nhanh 1S:</h2>
        <div>{allResults[AgentType.SPEED] || "Chưa có dữ liệu"}</div>
      </div>

      {/* Nơi hiển thị Luyện Skill */}
      <div className="mt-4 p-4 bg-white rounded shadow">
        <h2 className="font-bold text-green-600">Luyện Skill:</h2>
        <div>{allResults[AgentType.PERPLEXITY] || "Đang đợi luồng chính..."}</div>
      </div>
    </div>
  );
}
