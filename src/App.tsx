// Sửa hàm runAgents để tạo siêu phân luồng
const runAgents = useCallback(async (primary: any, allAgents: any[], text: string, img: string | null) => {
  if (!selectedSubject) return;
  setLoading(true);

  // 1. Nén ảnh siêu tốc để "thông ống" (chỉ tốn vài ms)
  const optimizedImg = img && img.startsWith('data') ? await compressImage(img) : img;

  // 2. KÍCH HOẠT SIÊU PHÂN LUỒNG: Các luồng chạy độc lập
  allAgents.forEach(async (agent) => {
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        body: JSON.stringify({ subject: selectedSubject, agent, prompt: text, image: optimizedImg })
      }).then(r => r.text());

      if (agent === 'SPEED') {
        try {
          const parsed = JSON.parse(res);
          setParsedSpeedResult({ finalAnswer: parsed.finalAnswer, casioSteps: "" }); // Đã bỏ Casio
          setAllResults(prev => ({ ...prev, [agent]: parsed.finalAnswer }));
        } catch {
          setAllResults(prev => ({ ...prev, [agent]: res }));
        }
      } else {
        // Cập nhật kết quả ngay khi luồng đó "về đích"
        setAllResults(prev => ({ ...prev, [agent]: res }));
      }
    } catch {
      setAllResults(prev => ({ ...prev, [agent]: "⚠️ Đang thử lại..." }));
    }
  });

  // Tắt loading sớm để giao diện mượt mà
  setTimeout(() => setLoading(false), 1000);
}, [selectedSubject]);
