// Trong App.tsx - Hàm xử lý chính
const runAgents = useCallback(async (primary: AgentType, all: AgentType[], text: string, img: string | null) => {
  if (!selectedSubject) return;
  setLoading(true);
  
  try {
    // --- GIAI ĐOẠN 1: GIẢI NHANH 1S & GIA SƯ AI (Ưu tiên sống sót) ---
    setLoadingStatus("Đang ưu tiên Giải nhanh...");
    
    // Gọi API trực tiếp qua fetch (Thông mạch, không dùng thư viện lỗi)
    const res1 = await fetch('/api/gemini', {
      method: 'POST',
      body: JSON.stringify({ subject: selectedSubject, agent: primary, prompt: text, image: img })
    }).then(r => r.text());

    // Xử lý hiển thị ngay kết quả ưu tiên
    if (primary === AgentType.SPEED) {
      try {
        const parsed = JSON.parse(res1);
        setParsedSpeedResult({ finalAnswer: parsed.finalAnswer, casioSteps: "" }); // Đã bỏ Casio
        setAllResults(prev => ({ ...prev, [primary]: parsed.finalAnswer }));
      } catch {
        setAllResults(prev => ({ ...prev, [primary]: res1 }));
      }
    } else {
      setAllResults(prev => ({ ...prev, [primary]: res1 }));
    }

    // Đã thông mạch luồng chính - Tắt loading để người dùng xem bài
    setLoading(false);

    // --- GIAI ĐOẠN 2: LUYỆN SKILL (Tiếp sức hậu cần) ---
    // Chỉ chạy khi luồng chính đã về đích an toàn
    const skillAgent = AgentType.PERPLEXITY; 
    if (all.includes(skillAgent)) {
      setLoadingStatus("Đang chuẩn bị Luyện Skill...");
      const res2 = await fetch('/api/gemini', {
        method: 'POST',
        body: JSON.stringify({ subject: selectedSubject, agent: skillAgent, prompt: text, image: img })
      }).then(r => r.text());
      
      setAllResults(prev => ({ ...prev, [skillAgent]: res2 }));
    }

  } catch (error) {
    setLoading(false);
    setLoadingStatus("Mạch bận, hãy thử lại.");
  }
}, [selectedSubject]);
