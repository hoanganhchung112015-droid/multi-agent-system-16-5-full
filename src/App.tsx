const runAgents = useCallback(async (
  primary: AgentType, 
  all: AgentType[], 
  text: string, 
  img: string | null
) => {
  if (!selectedSubject) return;
  setLoading(true);

  // GIAI ĐOẠN 1: GIẢI NHANH 1S / GIA SƯ AI (Ưu tiên sống sót)
  try {
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
        // ĐÃ BỎ hoàn toàn CasioSteps để nhẹ mạch
        setParsedSpeedResult({ finalAnswer: parsed.finalAnswer, casioSteps: "" });
        setAllResults(prev => ({ ...prev, [primary]: parsed.finalAnswer }));
      } catch {
        setAllResults(prev => ({ ...prev, [primary]: res1 }));
      }
    } else {
      setAllResults(prev => ({ ...prev, [primary]: res1 }));
    }
  } catch (error) {
    setAllResults(prev => ({ ...prev, [primary]: "⚠️ Mạch giải nhanh gặp sự cố." }));
  }

  // Luôn luôn tắt loading chính sau khi Giai đoạn 1 hoàn tất
  setLoading(false);

  // GIAI ĐOẠN 2: LUYỆN SKILL (Tiếp sức hậu cần - Chạy sau luồng chính)
  const skillAgent = AgentType.PERPLEXITY; // Tên Agent Luyện Skill của bạn
  if (all.includes(skillAgent)) {
    try {
      setLoadingStatus("Đang chuẩn bị Luyện Skill...");
      const response2 = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: selectedSubject, agent: skillAgent, prompt: text, image: img })
      });
      const res2 = await response2.text();
      setAllResults(prev => ({ ...prev, [skillAgent]: res2 }));
    } catch (error) {
      setAllResults(prev => ({ ...prev, [skillAgent]: "⚠️ Luồng luyện skill đang bận." }));
    }
  }

  setLoadingStatus(""); 
}, [selectedSubject]);
