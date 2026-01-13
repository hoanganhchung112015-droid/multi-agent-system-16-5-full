import React, { useState, useCallback } from 'react';
import { Subject, AgentType } from './types';
import { processTask } from './services/geminiService';

// Giả sử đây là bên trong Component App
export default function App() {
  const [selectedSubject, setSelectedSubject] = useState<Subject>(Subject.MATH);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [allResults, setAllResults] = useState<Partial<Record<AgentType, string>>>({});
  const [parsedSpeedResult, setParsedSpeedResult] = useState<any>(null);

  const runAgents = useCallback(async (
    primaryAgent: AgentType,
    allAgents: AgentType[],
    voiceText: string,
    image: string | null
  ) => {
    if (!selectedSubject || (!image && !voiceText)) return;

    setLoading(true);
    setAllResults({}); // Xóa kết quả cũ khi bắt đầu lượt mới
    setLoadingStatus(`Đang kết nối chuyên gia ${primaryAgent}...`);

    const callSingleAgent = async (agent: AgentType) => {
      try {
        const res = await processTask(selectedSubject, agent, voiceText, image || undefined);
        
        if (agent === AgentType.SPEED) {
          // Xử lý JSON từ Agent giải nhanh
          try {
            const jsonMatch = res.match(/\{[\s\S]*\}/);
            const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : res);
            setParsedSpeedResult(parsed);
            setAllResults(prev => ({ ...prev, [agent]: parsed.finalAnswer }));
          } catch (e) {
            setAllResults(prev => ({ ...prev, [agent]: res }));
          }
        } else {
          setAllResults(prev => ({ ...prev, [agent]: res }));
        }
      } catch (error) {
        setAllResults(prev => ({ ...prev, [agent]: "Chuyên gia đang bận, vui lòng thử lại." }));
      }
    };

    // 1. Chạy Agent ưu tiên trước và đợi kết quả
    await callSingleAgent(primaryAgent);
    setLoading(false);

    // 2. Chạy các Agent còn lại song song (Background) để tiết kiệm thời gian
    const otherAgents = allAgents.filter(a => a !== primaryAgent);
    otherAgents.forEach(agent => callSingleAgent(agent));

  }, [selectedSubject]);

  // ... các phần còn lại của Component
  return (
    // JSX của bạn ở đây
    <div>Symbiotic AI</div>
  );
}
