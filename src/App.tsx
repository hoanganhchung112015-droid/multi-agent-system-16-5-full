// Tìm đến hàm runAgents trong App.tsx và thay thế bằng:
const runAgents = useCallback(async (
  primaryAgent: AgentType,
  allAgents: AgentType[],
  voiceText: string,
  image: string | null
) => {
  if (!selectedSubject || (!image && !voiceText)) return;

  setLoading(true);
  setLoadingStatus(`Đang kết nối chuyên gia ${primaryAgent}...`);

  const processAgent = async (agent: AgentType) => {
    try {
      const res = await processTask(selectedSubject, agent, voiceText, image || undefined);
      
      // Nếu là Agent SPEED, ta thực hiện phân tách JSON và chuẩn bị Quiz
      if (agent === AgentType.SPEED) {
        const jsonMatch = res.match(/\{[\s\S]*\}/); // Trích xuất JSON nếu AI trả lời thừa chữ
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : res);
        setParsedSpeedResult(parsed);
        setAllResults(prev => ({ ...prev, [agent]: parsed.finalAnswer }));
      } else {
        setAllResults(prev => ({ ...prev, [agent]: res }));
      }
    } catch (error) {
      setAllResults(prev => ({ ...prev, [agent]: "Chuyên gia bận, hãy thử lại." }));
    }
  };

  await processAgent(primaryAgent); // Ưu tiên Agent chính
  setLoading(false);

  // Chạy các Agent còn lại ngầm
  const others = allAgents.filter(a => a !== primaryAgent);
  others.forEach(processAgent);

}, [selectedSubject]);
