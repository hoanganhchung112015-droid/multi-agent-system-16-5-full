const runAgents = useCallback(async (primary: any, all: any[], voice: string, img: string | null) => {
  if (!selectedSubject) return;
  setLoading(true);

  // Nén ảnh trước khi "đưa vào ống"
  const finalImg = img && img.startsWith('data') ? await compressImage(img) : img;

  // Luồng song song: Các agent chạy đua, không đợi nhau
  all.forEach(async (agent) => {
    const res = await processTask(selectedSubject, agent, voice, finalImg || undefined);
    if (agent === 'SPEED') {
      try {
        const parsed = JSON.parse(res);
        setParsedSpeedResult({ finalAnswer: parsed.finalAnswer, casioSteps: "" }); // BỎ CASIO
        setAllResults(prev => ({ ...prev, [agent]: parsed.finalAnswer }));
      } catch {
        setAllResults(prev => ({ ...prev, [agent]: res }));
      }
    } else {
      setAllResults(prev => ({ ...prev, [agent]: res }));
    }
  });
  
  // Tự động tắt loading sau 2s (hoặc dựa trên kết quả đầu tiên)
  setTimeout(() => setLoading(false), 2000);
}, [selectedSubject]);
