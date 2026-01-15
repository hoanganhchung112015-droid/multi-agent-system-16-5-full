const runAgents = useCallback(async (primaryAgent: AgentType, allAgents: AgentType[], voiceText: string, image: string | null) => {
  if (!selectedSubject) return;
  setLoading(true);
  
  try {
    // BƯỚC 1: ƯU TIÊN SINH TỒN - Chạy Giải nhanh hoặc Gia sư trước
    // Chúng ta chọn Agent quan trọng nhất để thông mạch đầu tiên
    setLoadingStatus("Đang ưu tiên giải nhanh...");
    
    const firstResult = await processTask(selectedSubject, primaryAgent, voiceText, image || undefined);
    
    // Cập nhật kết quả ngay để người dùng thấy "thông mạch"
    if (primaryAgent === AgentType.SPEED) {
      try {
        const parsed = JSON.parse(firstResult);
        setParsedSpeedResult({ finalAnswer: parsed.finalAnswer, casioSteps: "" });
        setAllResults(prev => ({ ...prev, [primaryAgent]: parsed.finalAnswer }));
      } catch {
        setAllResults(prev => ({ ...prev, [primaryAgent]: firstResult }));
      }
    } else {
      setAllResults(prev => ({ ...prev, [primaryAgent]: firstResult }));
    }

    // Tắt loading chính vì đã có kết quả quan trọng nhất
    setLoading(false);

    // BƯỚC 2: HẬU CẦN - Kích hoạt Luyện Skill (Chạy ngầm sau khi luồng 1 đã xong)
    const skillAgent = AgentType.PERPLEXITY; // Giả sử đây là luồng Luyện Skill
    if (allAgents.includes(skillAgent)) {
      setLoadingStatus("Đang chuẩn bị bài luyện tập...");
      const skillResult = await processTask(selectedSubject, skillAgent, voiceText, image || undefined);
      setAllResults(prev => ({ ...prev, [skillAgent]: skillResult }));
    }

  } catch (error) {
    console.error("Mạch bị nghẽn:", error);
    setLoading(false);
    setLoadingStatus("Mạch bận, vui lòng thử lại sau.");
  }
}, [selectedSubject]);
