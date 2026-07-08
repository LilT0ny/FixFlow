import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X, Trash2, ZoomIn } from 'lucide-react';
import type { EvidencePhoto } from '../../../../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../../components/molecules/Modal';

interface EvidencePhotosModalProps {
  isOpen: boolean;
  orderNumber: string;
  photos: EvidencePhoto[];
  onClose: () => void;
  onUpload: (stage: EvidencePhoto['stage'], file: File) => void;
  onDelete: (index: number) => void;
}

type Stage = EvidencePhoto['stage'];

const STAGES: { key: Stage; label: string; dot: string }[] = [
  { key: 'antes',   label: 'Antes',   dot: 'bg-blue-500' },
  { key: 'durante', label: 'Durante', dot: 'bg-amber-500' },
  { key: 'despues', label: 'Después', dot: 'bg-emerald-500' },
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

  const photosByStage = (stage: Stage) => photos.filter(p => p.stage === stage);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalHeader
          title="Fotos de evidencia"
          subtitle={`Orden #${orderNumber} · ${photos.length} foto${photos.length !== 1 ? 's' : ''}`}
          onClose={onClose}
        />

        <ModalBody className="space-y-6">
          {STAGES.map(({ key, label, dot }) => {
            const stagePhotos = photosByStage(key);
            return (
              <section key={key}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-sm font-medium text-surface-900">{label}</span>
                    {stagePhotos.length > 0 && (
                      <span className="text-xs text-surface-400">({stagePhotos.length})</span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openCamera(key)}
                      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 text-surface-600 border border-surface-200 rounded-lg hover:bg-surface-50 hover:text-surface-900 transition-colors duration-150"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Cámara
                    </button>
                    <button
                      onClick={() => fileInputRefs.current[key]?.click()}
                      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 text-surface-600 border border-surface-200 rounded-lg hover:bg-surface-50 hover:text-surface-900 transition-colors duration-150"
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
                {stagePhotos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {stagePhotos.map((photo, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-surface-200 bg-surface-50">
                        <img
                          src={photo.url}
                          alt={`${label} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Acciones: siempre visibles en táctil, con hover en desktop */}
                        <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 p-1.5 bg-gradient-to-t from-black/50 to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => setLightboxUrl(photo.url)}
                            className="p-1.5 bg-white/90 rounded-md hover:bg-white transition-colors duration-150"
                            title="Ampliar"
                          >
                            <ZoomIn className="w-3.5 h-3.5 text-surface-700" />
                          </button>
                          <button
                            onClick={() => onDelete(photos.indexOf(photo))}
                            className="p-1.5 bg-white/90 rounded-md hover:bg-danger-50 transition-colors duration-150"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-danger-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRefs.current[key]?.click()}
                    className="w-full flex items-center justify-center gap-2 py-5 rounded-lg border border-dashed border-surface-300 text-sm text-surface-400 hover:border-surface-400 hover:text-surface-600 transition-colors duration-150"
                  >
                    <Upload className="w-4 h-4" />
                    Agregar foto
                  </button>
                )}
              </section>
            );
          })}
        </ModalBody>

        <ModalFooter>
          <button
            onClick={onClose}
            className="w-full h-11 bg-surface-900 text-white rounded-lg text-sm font-medium hover:bg-surface-800 active:scale-[0.99] transition-all duration-150"
          >
            Listo
          </button>
        </ModalFooter>
      </Modal>

      {/* ─── Vista de Cámara (overlay por encima del modal) ─── */}
      {cameraStage && (
        <div className="fixed inset-0 z-[210] bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <span className="text-white font-medium text-sm">
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

      {/* ─── Lightbox (overlay por encima del modal) ─── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[220] bg-black/90 flex items-center justify-center p-4"
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
    </>
  );
};
