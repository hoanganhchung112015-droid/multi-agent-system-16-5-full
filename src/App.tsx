// --- Tìm và thay thế hàm runAgents trong App.tsx ---
const runAgents = useCallback(async (
  primaryAgent: AgentType,
  allAgents: AgentType[],
  voiceText: string,
  image: string | null
) => {
  if (!selectedSubject) return;

  setLoading(true);
  setLoadingStatus("Đang phân luồng chuyên gia...");

  // LUỒNG XỬ LÝ SONG SONG (Thông suốt tuyệt đối)
  const taskPool = allAgents.map(async (agent) => {
    try {
      const res = await processTask(selectedSubject, agent, voiceText, image || undefined);
      
      if (agent === AgentType.SPEED) {
        try {
          const parsed = JSON.parse(res);
          // CHỈ LẤY ĐÁP ÁN, BỎ CASIO ĐỂ TĂNG TỐC
          setParsedSpeedResult({ finalAnswer: parsed.finalAnswer, casioSteps: "" });
          setAllResults(prev => ({ ...prev, [agent]: parsed.finalAnswer }));
        } catch (e) {
          setAllResults(prev => ({ ...prev, [agent]: res }));
        }
      } else {
        setAllResults(prev => ({ ...prev, [agent]: res }));
      }
    } catch (err) {
      setAllResults(prev => ({ ...prev, [agent]: "⚠️ Đang thử kết nối lại mạch..." }));
    }
  });

  // Chạy đồng thời tất cả các mạch
  Promise.all(taskPool).finally(() => {
    setLoading(false);
    setLoadingStatus("");
  });

}, [selectedSubject]);

// Cập nhật hàm bấm nút Giải bài để nén ảnh trước khi đi
const handleRunAnalysis = useCallback(async () => {
    if (!selectedSubject || (!image && !voiceText)) return;
    
    setScreen('ANALYSIS');
    let optimizedImage = image;
    if (image && image.startsWith('data:image')) {
        optimizedImage = await compressImage(image); // Nén ảnh "thông mạch"
    }
    runAgents(selectedAgent, agents, voiceText, optimizedImage);
}, [selectedSubject, image, voiceText, selectedAgent, agents, runAgents]);
