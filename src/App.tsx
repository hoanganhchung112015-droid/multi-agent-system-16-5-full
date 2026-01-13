import React, { useState, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import CameraScanner from './components/CameraScanner';
import { Subject, AgentType } from './types';
import { processTask } from './services/geminiService';
import { 
  Camera, 
  MessageSquare, 
  BrainCircuit, 
  Zap, 
  BookOpen, 
  History,
  Loader2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function App() {
  // --- States ---
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  
  // Lưu trữ kết quả của các Agent
  const [allResults, setAllResults] = useState<Partial<Record<AgentType, string>>>({});
  const [parsedSpeedResult, setParsedSpeedResult] = useState<{finalAnswer?: string, casioSteps?: string} | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  // --- Logic Xử lý AI ---
  const runAgents = useCallback(async (
    image: string,
    subject: Subject
  ) => {
    setLoading(true);
    setAllResults({});
    setParsedSpeedResult(null);
    setCurrentImage(image);

    const callSingleAgent = async (agent: AgentType) => {
      try {
        setLoadingStatus(`Chuyên gia ${agent} đang làm việc...`);
        const res = await processTask(subject, agent, "Hãy giải bài tập trong ảnh này", image);
        
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
        setAllResults(prev => ({ ...prev, [agent]: "Không thể kết nối với chuyên gia này." }));
      }
    };

    // 1. Ưu tiên giải nhanh trước
    await callSingleAgent(AgentType.SPEED);
    setLoading(false);

    // 2. Các Agent khác chạy ngầm
    [AgentType.SOCRATIC, AgentType.PERPLEXITY].forEach(agent => callSingleAgent(agent));
  }, []);

  // --- Handlers ---
  const handleCapture = (base64: string) => {
    setShowScanner(false);
    if (selectedSubject) {
      runAgents(base64, selectedSubject);
    }
  };

  // --- UI Components ---
  if (showScanner) {
    return <CameraScanner onCapture={handleCapture} onClose={() => setShowScanner(false)} />;
  }

  return (
    <Layout 
      title={selectedSubject || "Chọn môn học"} 
      onBack={selectedSubject ? () => setSelectedSubject(null) : undefined}
    >
      {!selectedSubject ? (
        // MÀN HÌNH CHỌN MÔN HỌC
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {Object.values(Subject).map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className="group p-6 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all text-left"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="text-indigo-600" />
              </div>
              <h3 className="font-black text-slate-800 text-lg">{sub}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Bắt đầu ngay</p>
            </button>
          ))}
        </div>
      ) : (
        // MÀN HÌNH CHIẾN ĐẤU (SAU KHI CHỌN MÔN)
        <div className="space-y-6">
          {/* Nút Chụp ảnh chính */}
          {!currentImage && !loading && (
            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-center text-white shadow-2xl shadow-indigo-500/40 relative overflow-hidden group">
              <Sparkles className="absolute top-4 right-4 opacity-20 group-hover:rotate-12 transition-transform" size={40} />
              <h2 className="text-2xl font-black mb-2">Sẵn sàng giải bài?</h2>
              <p className="text-indigo-100 mb-8 font-medium">Chụp ảnh đề bài để kích hoạt hệ thống đa tác nhân</p>
              <button 
                onClick={() => setShowScanner(true)}
                className="w-full py-5 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Camera size={24} /> Quét đề bài
              </button>
            </div>
          )}

          {/* Trạng thái Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5 animate-pulse" />
              </div>
              <p className="font-black text-slate-800 animate-pulse uppercase text-xs tracking-widest">{loadingStatus}</p>
            </div>
          )}

          {/* KẾT QUẢ HIỂN THỊ */}
          {(currentImage || Object.keys(allResults).length > 0) && (
            <div className="space-y-6 pb-20">
              {/* Tab Giải Nhanh (Agent SPEED) */}
              <section className="bg-emerald-50 rounded-[2rem] border-2 border-emerald-100 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-emerald-500 text-white flex items-center gap-2">
                  <Zap size={18} fill="currentColor" />
                  <span className="font-black uppercase text-xs tracking-tighter">Kết quả giải nhanh</span>
                </div>
                <div className="p-6 prose prose-slate max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {allResults[AgentType.SPEED] || "Đang phân tích..."}
                  </ReactMarkdown>
                  
                  {parsedSpeedResult?.casioSteps && (
                    <div className="mt-4 p-4 bg-white rounded-xl border border-emerald-200">
                      <p className="text-xs font-black text-emerald-600 uppercase mb-2">Hướng dẫn Casio:</p>
                      <p className="text-sm font-medium text-slate-600">{parsedSpeedResult.casioSteps}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Tab Gia Sư AI (Agent SOCRATIC) */}
              <section className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2 text-indigo-600">
                  <BrainCircuit size={18} />
                  <span className="font-black uppercase text-xs tracking-tighter">Tư duy Socratic</span>
                </div>
                <div className="p-6 text-slate-700 italic font-medium">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {allResults[AgentType.SOCRATIC] || "Chuyên gia đang soạn bài giảng..."}
                  </ReactMarkdown>
                </div>
              </section>

              {/* Tab Luyện Tập (Agent PERPLEXITY) */}
              <section className="bg-slate-900 rounded-[2rem] p-6 text-white">
                <div className="flex items-center gap-2 mb-4 text-emerald-400">
                  <Sparkles size={18} />
                  <span className="font-black uppercase text-xs tracking-tighter">Thử thách tương tự</span>
                </div>
                <div className="text-slate-300 text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {allResults[AgentType.PERPLEXITY] || "Đang tạo đề bài luyện tập..."}
                  </ReactMarkdown>
                </div>
              </section>

              {/* Nút chụp lại khi đã có kết quả */}
              <button 
                onClick={() => {setCurrentImage(null); setAllResults({});}}
                className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
              >
                <RotateCcw size={18} /> Giải bài khác
              </button>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
