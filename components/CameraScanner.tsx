import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, Timer } from 'lucide-react';

interface Props { onCapture: (base64: string) => void; onClose: () => void; }

const CameraScanner: React.FC<Props> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [countdown, setCountdown] = useState(10);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Yêu cầu quyền camera
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        setHasPermission(true);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setHasPermission(false));

    // Logic đếm ngược 10 giây
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          capture();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const capture = () => {
    const v = videoRef.current;
    if (v) {
      const cvs = document.createElement('canvas');
      cvs.width = v.videoWidth; cvs.height = v.videoHeight;
      cvs.getContext('2d')?.drawImage(v, 0, 0);
      onCapture(cvs.toDataURL('image/jpeg', 0.8));
    }
  };

  if (hasPermission === false) return <div className="fixed inset-0 bg-black text-white flex items-center justify-center p-6 text-center">Bạn cần cấp quyền truy cập Camera trong cài đặt trình duyệt.</div>;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      
      {/* Overlay đếm ngược */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/50 px-6 py-2 rounded-full flex items-center gap-3 border border-white/20">
        <Timer className="text-yellow-400 animate-pulse" />
        <span className="text-white font-black text-2xl">Tự động chụp sau: {countdown}s</span>
      </div>

      <div className="absolute bottom-10 w-full flex justify-center gap-10">
        <button onClick={onClose} className="p-4 bg-white/20 rounded-full text-white"><X/></button>
        <button onClick={capture} className="p-6 bg-emerald-500 rounded-full text-white shadow-xl shadow-emerald-500/40"><Camera/></button>
      </div>
    </div>
  );
};
export default CameraScanner;
