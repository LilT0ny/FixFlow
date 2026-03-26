import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X, Trash2, ZoomIn } from 'lucide-react';
import type { EvidencePhoto } from '../../../../types';

interface EvidencePhotosModalProps {
  isOpen: boolean;
  orderNumber: string;
  photos: EvidencePhoto[];
  onClose: () => void;
  onUpload: (stage: EvidencePhoto['stage'], file: File) => void;
  onDelete: (index: number) => void;
}

type Stage = EvidencePhoto['stage'];

const STAGES: { key: Stage; label: string; color: string; bg: string }[] = [
  { key: 'antes',    label: 'Antes',   color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  { key: 'durante',  label: 'Durante', color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
  { key: 'despues',  label: 'Después', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
];

export const EvidencePhotosModal: React.FC<EvidencePhotosModalProps> = ({
  isOpen, orderNumber, photos, onClose, onUpload, onDelete
}) => {
  const fileInputRefs = useRef<Record<Stage, HTMLInputElement | null>>({
    antes: null, durante: null, despues: null
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraStage, setCameraStage] = useState<Stage | null>(null);
  const [stream, setStream]           = useState<MediaStream | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const openCamera = useCallback(async (stage: Stage) => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      setStream(mediaStream);
      setCameraStage(stage);
      // Allow the video element to render before assigning srcObject
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      });
    } catch {
      alert('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
    }
  }, []);

  const closeCamera = useCallback(() => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setCameraStage(null);
    setIsCapturing(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraStage) return;
    setIsCapturing(true);
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], `foto_${cameraStage}_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onUpload(cameraStage, file);
      }
      closeCamera();
    }, 'image/jpeg', 0.85);
  }, [cameraStage, closeCamera, onUpload]);

  const handleFileChange = (stage: Stage, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(stage, file);
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  const photosByStage = (stage: Stage) => photos.filter(p => p.stage === stage);

  return (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:rounded-3xl sm:max-w-2xl max-h-[95dvh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Fotos de Evidencia</h3>
            <p className="text-xs text-gray-500 mt-0.5">Orden #{orderNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {STAGES.map(({ key, label, color, bg }) => (
            <section key={key} className={`rounded-2xl border p-4 ${bg}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-black uppercase tracking-wider ${color}`}>{label}</span>
                <div className="flex gap-2">
                  {/* Cámara */}
                  <button
                    onClick={() => openCamera(key)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Cámara
                  </button>
                  {/* Subir archivo */}
                  <button
                    onClick={() => fileInputRefs.current[key]?.click()}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Archivo
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={el => { fileInputRefs.current[key] = el; }}
                    onChange={e => handleFileChange(key, e)}
                  />
                </div>
              </div>

              {/* Galería */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photosByStage(key).map((photo, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-white shadow-sm">
                    <img
                      src={photo.url}
                      alt={`${label} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => setLightboxUrl(photo.url)}
                        className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                      >
                        <ZoomIn className="w-3.5 h-3.5 text-gray-700" />
                      </button>
                      <button
                        onClick={() => onDelete(photos.indexOf(photo))}
                        className="p-1.5 bg-red-500/90 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
                {photosByStage(key).length === 0 && (
                  <div className="col-span-full flex items-center justify-center py-6 text-sm text-gray-400 font-medium">
                    Sin fotos aún — usa Cámara o Archivo
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-colors"
          >
            Listo ({photos.length} foto{photos.length !== 1 ? 's' : ''})
          </button>
        </div>
      </div>

      {/* ─── Vista de Cámara (overlay) ─── */}
      {cameraStage && (
        <div className="fixed inset-0 z-[120] bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <span className="text-white font-bold text-sm uppercase tracking-wider">
              Foto: {STAGES.find(s => s.key === cameraStage)?.label}
            </span>
            <button onClick={closeCamera} className="p-2 rounded-full bg-white/20">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="flex-1 object-cover w-full"
          />
          <canvas ref={canvasRef} className="hidden" />

          <div className="flex justify-center items-center py-8 shrink-0">
            <button
              onClick={capturePhoto}
              disabled={isCapturing}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform disabled:opacity-50"
            >
              <div className="w-16 h-16 rounded-full border-4 border-gray-300 bg-white" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Lightbox ─── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[130] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 rounded-full"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={lightboxUrl}
            alt="Vista ampliada"
            className="max-w-full max-h-full rounded-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
