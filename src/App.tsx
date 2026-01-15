import React, { useState, useEffect, useCallback, useRef } from 'react';
// Giữ lại toàn bộ phần import CSS và Icon cũ của bạn ở đây
// import { Send, Mic, Image as ImageIcon, ... } from 'lucide-react';

export default function App() {
  // --- STATE CŨ VÀ MỚI (Để giao diện cũ không bị lỗi) ---
  const [selectedSubject, setSelectedSubject] = useState("Toán");
  const [voiceText, setVoiceText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [allResults, setAllResults] = useState<Record<string, string>>({});

  // --- LOGIC PHÂN LUỒNG BẬC THANG (Tính năng mới) ---
  const handleStartProcessing = useCallback(async (text: string, img: string | null) => {
    if (!selectedSubject) return;
    setLoading(true);
    setAllResults({}); // Reset kết quả cũ

    try {
      // GIAI ĐOẠN 1: GIẢI NHANH 1S (Hoặc Gia sư AI)
      setLoadingStatus("⚡ Đang ưu tiên Giải nhanh...");
      const res1 = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: selectedSubject, agent: 'SPEED', prompt: text, image: img })
      }).then(r => r.text());

      // Cập nhật kết quả 1 ngay để "Thông mạch"
      setAllResults(prev => ({ ...prev, SPEED: res1 }));
      setLoading(false); // Tắt loading chính cho người dùng đỡ chờ

      // GIAI ĐOẠN 2: LUYỆN SKILL (Tiếp sức hậu cần)
      setLoadingStatus("📚 Đang chuẩn bị Luyện Skill...");
      const res2 = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: selectedSubject, agent: 'PERPLEXITY', prompt: text, image: img })
      }).then(r => r.text());

      setAllResults(prev => ({ ...prev, PERPLEXITY: res2 }));
    } catch (error) {
      console.error("Mạch bận:", error);
      setLoading(false);
    }
    setLoadingStatus("");
  }, [selectedSubject]);

  // --- PHẦN HIỂN THỊ (Dán giao diện cũ của bạn vào đây) ---
  return (
    <div className="flex h-screen bg-slate-50">
