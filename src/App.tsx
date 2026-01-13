import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import CameraScanner from './components/CameraScanner';
import { Subject, AgentType } from './types';
import { processTask } from './services/geminiService';
import { 
  Camera, Mic, Image as ImageIcon, Sparkles, Zap, BrainCircuit, 
  Loader2, RotateCcw, BookOpen, History, Timer, CheckCircle2 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Định nghĩa màu sắc và logo cho từng môn
const subjectConfigs = {
  [Subject.MATH]: { color: 'bg-blue-500', icon: <div className="text-2xl">∑</div>, shadow: 'shadow-blue-200' },
  [Subject.PHYSICS]: { color: 'bg-purple-500', icon: <div className="text-2xl">⚛</div>, shadow: 'shadow-purple-200' },
  [Subject.CHEMISTRY]: { color: 'bg-orange-500', icon: <div className="text-2xl">🧪</div>, shadow: 'shadow-orange-200' },
};

export default function App() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [allResults, setAllResults] = useState<Partial<Record<AgentType, string>>>({});
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [voiceText, setVoiceText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load nhật ký từ LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('symbiotic_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // Logic Ghi âm chuyên nghiệp
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Trình duyệt không hỗ trợ Web Speech API");

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;

    recognition.onstart = () => {
      setIsListening(true);
      setRecordingTime(0);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setVoiceText(prev => prev + " " + transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // Đếm giờ ghi âm
  useEffect(() => {
    let interval: any;
    if (isListening) {
      interval = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCurrentImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const runAgents = async () => {
    if (!selectedSubject || (!currentImage && !voiceText)) return;
    setLoading(true);
    setAllResults({});

    const callAgent = async (agent: AgentType) => {
      try {
        setLoadingStatus(`Chuyên gia ${agent} đang làm việc...`);
        const res = await processTask(selectedSubject, agent, voiceText || "Giải bài này", currentImage || undefined);
        setAllResults(prev => ({ ...prev, [agent]: res }));
        return res;
      } catch (e) {
        return "Lỗi kết nối AI.";
      }
    };

    const speedRes = await callAgent(AgentType.SPEED);
    setLoading(false);
    
    // Lưu vào nhật ký
    const newEntry = {
      subject: selectedSubject,
      date: new Date().toLocaleString('vi-VN'),
      query: voiceText || "Câu hỏi hình ảnh",
      result: speedRes
    };
    const updatedHistory = [newEntry, ...history].slice(0, 20);
    setHistory(updatedHistory);
    localStorage.setItem('symbiotic_history', JSON.stringify(updatedHistory));

    [AgentType.SOCRATIC, AgentType.PERPLEXITY].forEach(callAgent);
  };

  if (showScanner) return <CameraScanner onCapture={(img) => {setCurrentImage(img); setShowScanner(false)}} onClose={() => setShowScanner(false)} />;

  return (
    <Layout title={selectedSubject || "Symbiotic AI 16.5"} onBack={selectedSubject ? () => setSelectedSubject(null) : undefined}>
      
      {!selectedSubject ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {Object.values(Subject).map(sub => (
              <button key={sub} onClick={() => setSelectedSubject(sub)} 
                className={`p-6 ${subjectConfigs[sub].color} text-white rounded-[2rem] shadow-xl ${subjectConfigs[sub].shadow} hover:scale-105 transition-all text-left relative overflow-hidden group`}>
                <div className="mb-4 bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center">{subjectConfigs[sub].icon}</div>
                <h3 className="font-black text-xl">{sub}</h3>
                <Sparkles className="absolute -right-2 -bottom-2 opacity-20 group-hover:rotate-12 transition-transform" size={60} />
              </button>
            ))}
            <button onClick={() => setShowHistory(!showHistory)} className="col-span-2 p-6 bg-slate-800 text-white rounded-[2rem] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <History className="text-indigo-400" />
                <span className="font-bold">Nhật ký học tập</span>
              </div>
              <CheckCircle2 size={20} className="text-emerald-400" />
            </button>
          </div>

          {showHistory && (
            <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 max-h-[400px] overflow-y-auto space-y-4">
              {history.length === 0 && <p className="text-center text-slate-400 italic">Chưa có hoạt động nào.</p>}
              {history.map((item, i) => (
                <div key={i} className="border-l-4 border-indigo-500 pl-4 py-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{item.date} - {item.subject}</p>
                  <p className="font-bold text-slate-800 line-clamp-1">{item.query}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* BẢNG ĐIỀU KHIỂN ĐA PHƯƠNG THỨC */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border-2 border-slate-50 space-y-4">
            <div className="relative">
              <textarea value={voiceText} onChange={(e) => setVoiceText(e.target.value)} placeholder="Mời bạn nhập câu hỏi hoặc ghi âm..."
                className="w-full p-5 bg-slate-50 rounded-3xl border-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] font-medium" />
              {isListening && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full animate-bounce">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase">Đang ghi âm: {recordingTime}s</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowScanner(true)} className="flex-1 py-4 bg-indigo-50 text-indigo-600 rounded-2xl flex flex-col items-center gap-1 font-bold"><Camera size={20}/>Ảnh</button>
              <label className="flex-1 py-4 bg-orange-50 text-orange-600 rounded-2xl flex flex-col items-center gap-1 font-bold cursor-pointer">
                <ImageIcon size={20}/>File <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
              </label>
              <button onClick={startListening} className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-1 font-bold ${isListening ? 'bg-red-500 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                <Mic size={20}/>{isListening ? 'Dừng' : 'Ghi âm'}
              </button>
            </div>

            <button onClick={runAgents} disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 transition-all">
              {loading ? <Loader2 className="animate-spin" /> : <Zap className="text-yellow-400" size={20} />} Kích hoạt AI Đa tác nhân
            </button>
          </div>

          {/* LOADING TRẠNG THÁI */}
          {loading && (
            <div className="py-10 flex flex-col items-center gap-4 animate-pulse">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-black text-indigo-900 uppercase text-xs tracking-widest">{loadingStatus}</p>
            </div>
          )}

          {/* KẾT QUẢ HIỂN THỊ (Markdown) */}
          {Object.keys(allResults).length > 0 && (
            <div className="space-y-6 pb-20 animate-in fade-in duration-500">
               {Object.entries(allResults).map(([agent, res]) => (
                 <section key={agent} className="bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden">
                   <div className="px-6 py-3 bg-slate-50 border-b flex justify-between items-center">
                     <span className="font-black text-[10px] uppercase tracking-widest text-indigo-600">{agent}</span>
                     <div className="flex gap-1">
                       <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                       <div className="w-2 h-2 bg-emerald-400 rounded-full opacity-50"></div>
                     </div>
                   </div>
                   <div className="p-6 prose prose-slate max-w-none">
                     <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{res || ""}</ReactMarkdown>
                   </div>
                 </section>
               ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
