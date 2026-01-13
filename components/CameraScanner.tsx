import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, RotateCcw, Check, X, SearchPlus, SearchMinus } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop/types';

interface CameraScannerProps {
  onCapture: (base64Data: string) => void;
  onClose: () => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment', width: 1280, height: 720 } 
    });
    if (videoRef.current) videoRef.current.srcObject = stream;
  };

  useEffect(() => {
    startCamera();
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const capture = () => {
    const canvas = document.createElement('canvas');
    if (videoRef.current) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
    }
  };

  const handleConfirm = async () => {
    if (capturedImage && croppedAreaPixels) {
      const image = new Image();
      image.src = capturedImage;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
        onCapture(canvas.toDataURL('image/jpeg', 0.9)); // Gửi Base64 chuẩn về App
      };
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {!capturedImage ? (
        <div className="relative flex-1">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-10 w-full flex justify-center gap-10">
             <button onClick={onClose} className="p-4 bg-white/20 rounded-full text-white"><X /></button>
             <button onClick={capture} className="p-6 bg-emerald-500 rounded-full text-white"><Camera /></button>
          </div>
        </div>
      ) : (
        <div className="relative flex-1 bg-slate-900 flex flex-col p-4">
          <div className="relative flex-1 rounded-3xl overflow-hidden">
            <Cropper image={capturedImage} crop={crop} zoom={zoom} aspect={4/3} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, p) => setCroppedAreaPixels(p)} />
          </div>
          <div className="py-6 flex gap-4">
             <button onClick={() => setCapturedImage(null)} className="flex-1 py-4 bg-white/10 text-white rounded-2xl flex justify-center gap-2"><RotateCcw /> Chụp lại</button>
             <button onClick={handleConfirm} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl flex justify-center gap-2"><Check /> Xác nhận</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraScanner;
