import React, { useState, useCallback } from 'react';
import { Layout } from '../components/Layout';
import CameraScanner from '../components/CameraScanner';
import { Subject, AgentType } from '../types';
import { processTask } from '../services/geminiService';
import { 
  Camera, Mic, Image as ImageIcon, Sparkles, 
  Zap, BrainCircuit, Loader2, RotateCcw, BookOpen 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function App() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [allResults, setAllResults] = useState<Partial<Record<AgentType, string>>>({});
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [voiceText, setVoiceText] = useState('');
  const [isListening, setIsListening] = useState(false);

  // --- Logic Ghi âm (Web Speech API) ---
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Trình duyệt không hỗ trợ ghi âm");
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      setVoiceText(event.results[0][0].transcript);
    };
    recognition.start();
  };

  // --- Logic Tải ảnh từ máy ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCurrentImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // --- Logic Chạy AI ---
  const runAgents = async () => {
    if (!selectedSubject || (!currentImage && !voiceText)) return;
    setLoading(true);
    setAllResults({});

    const callAgent = async (agent: AgentType) => {
      try {
        setLoadingStatus(`Chuyên gia ${agent} đang xử lý...`);
        const res = await processTask(selectedSubject, agent, voiceText || "Giải bài tập này", currentImage || undefined);
        setAllResults(prev => ({ ...prev, [agent]: res }));
      } catch (e) {
        setAllResults(prev => ({ ...prev, [agent]: "Lỗi kết nối." }));
      }
    };

    await callAgent(AgentType.SPEED); // Giải nhanh trước
    setLoading(false);
    [AgentType.SOCRATIC, AgentType.PERPLEXITY].forEach(callAgent); // Các agent khác chạy sau
  };

  if (showScanner) return <CameraScanner onCapture={(img) => {setCurrentImage(img); setShowScanner(false)}} onClose={() => setShowScanner(false)} />;

  return (
    <Layout title={selectedSubject || "Symbiotic AI"} onBack={selectedSubject ? () => {setSelectedSubject(null); setCurrentImage(null); setVoiceText('');} : undefined}>
      {!selectedSubject ? (
        // Màn hình chọn môn (Giữ nguyên như cũ)
        <div className="grid grid-cols-2 gap-4">
          {Object.values(Subject).map(sub => (
            <button key={sub} onClick={() => setSelectedSubject(sub)} className="p-6 bg-white border-2 rounded-[2rem] hover:border-indigo-500 transition-all text-left">
              <BookOpen className="text-indigo-600 mb-2" />
              <h3 className="font-bold">{sub}</h3>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* INPUT SECTION */}
          <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-xl space-y-4">
            <textarea 
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              placeholder="Nhập câu hỏi hoặc dùng Micro..."
              className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] font-medium"
            />
            
            {currentImage && (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-500">
                <img src={currentImage} className="w-full h-full object-cover" />
                <button onClick={() => setCurrentImage(null)} className="absolute top-0 right-0 bg-red-500 text-white p-1"><RotateCcw size={12}/></button>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setShowScanner(true)} className="flex-1 py-3 bg-slate-100 rounded-xl flex justify-center items-center gap-2 text-slate-700 hover:bg-slate-200"><Camera size={18}/> Ảnh</button>
              <label className="flex-1 py-3 bg-slate-100 rounded-xl flex justify-center items-center gap-2 text-slate-700 hover:bg-slate-200 cursor-pointer">
                <ImageIcon size={18}/> File <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
              </label>
              <button onClick={handleVoiceInput} className={`flex-1 py-3 rounded-xl flex justify-center items-center gap-2 transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
                <Mic size={18}/> {isListening ? '...' : 'Ghi âm'}
              </button>
            </div>

            <button onClick={runAgents} disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />} Kích hoạt AI
            </button>
          </div>

          {/* LOADING & RESULTS (Giữ nguyên phần render kết quả Markdown như bản trước) */}
          {/* ... (Phần hiển thị allResults tôi đã viết ở trên, bạn giữ nguyên nhé) ... */}
        </div>
      )}
    </Layout>
  );
}
