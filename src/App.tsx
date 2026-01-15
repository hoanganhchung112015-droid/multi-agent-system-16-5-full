// Trong useAgentSystem hoặc App.tsx
const runAgents = useCallback(async (primary: AgentType, agents: AgentType[], text: string, img: string | null) => {
  if (!selectedSubject) return;
  setLoading(true);

  // Bước 1: Thông mạch - Nén ảnh siêu tốc
  const optimizedImg = img && img.startsWith('data') ? await compressImage(img) : img;

  // Bước 2: Kích hoạt Siêu phân luồng (Async Parallel)
  // Không dùng await ở đây để các luồng không chờ nhau
  agents.forEach(async (agent) => {
    try {
      // Mỗi agent chạy trên 1 lane riêng biệt
      const res = await processTask(selectedSubject, agent, text, optimizedImg || undefined);
      
      if (agent === AgentType.SPEED) {
        try {
          const parsed = JSON.parse(res);
          // BỎ CASIO ĐỂ GIẢM TẢI BĂNG THÔNG
          setParsedSpeedResult({ finalAnswer: parsed.finalAnswer, casioSteps: "" });
          setAllResults(prev => ({ ...prev, [agent]: parsed.finalAnswer }));
        } catch {
          setAllResults(prev => ({ ...prev, [agent]: res }));
        }
      } else {
        // Cập nhật ngay lập tức khi luồng này có kết quả
        setAllResults(prev => ({ ...prev, [agent]: res }));
      }
    } catch (err) {
      setAllResults(prev => ({ ...prev, [agent]: "⚠️ Mạch đang tự phục hồi..." }));
    }
  });

  // Tắt loading tổng thể sớm để người dùng thấy dữ liệu đang đổ về
  setTimeout(() => setLoading(false), 800);
}, [selectedSubject]);
