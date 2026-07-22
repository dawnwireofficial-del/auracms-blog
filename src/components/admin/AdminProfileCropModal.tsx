import React, { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';

interface AdminProfileCropModalProps {
  currentPhotoUrl?: string;
  onSave: (croppedImageUrl: string) => void;
  onClose: () => void;
}

export const AdminProfileCropModal: React.FC<AdminProfileCropModalProps> = ({
  currentPhotoUrl,
  onSave,
  onClose,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(currentPhotoUrl || null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setRotation(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!selectedImage) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleApplyCrop = async () => {
    if (!selectedImage || !imgRef.current) return;

    setIsUploading(true);
    setUploadProgress(20);

    const canvas = document.createElement('canvas');
    const size = 300; // Final cropped square size 300x300
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      const img = imgRef.current;
      const aspect = img.naturalWidth / img.naturalHeight;
      let drawW = size;
      let drawH = size;
      if (aspect > 1) {
        drawW = size * aspect;
      } else {
        drawH = size / aspect;
      }

      ctx.drawImage(
        img,
        -drawW / 2 + pan.x / zoom,
        -drawH / 2 + pan.y / zoom,
        drawW,
        drawH
      );
      ctx.restore();
    }

    setUploadProgress(60);

    // Get Data URL
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

    // Try uploading to Firebase Storage if configured, or use cropped data URL
    try {
      const storageRef = ref(storage, `admin-avatars/profile-${Date.now()}.jpg`);
      
      // Convert Data URL to Blob
      const res = await fetch(croppedDataUrl);
      const blob = await res.blob();

      setUploadProgress(85);
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      setUploadProgress(100);
      onSave(downloadUrl);
    } catch (e) {
      console.warn('Firebase Storage upload fallback to Data URL:', e);
      // Fallback to Data URL directly
      setUploadProgress(100);
      onSave(croppedDataUrl);
    } finally {
      setIsUploading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✂️</span>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
              Admin Profile Image Crop & Firebase Upload
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Upload Drop Zone or Image Crop Stage */}
        {!selectedImage ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/30"
          >
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl">
              📷
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                Click to Select Image or Drag & Drop
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports JPG, PNG, WEBP (Max 5MB)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Interactive Crop Stage */}
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="relative h-64 w-full bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center cursor-move select-none"
            >
              <img
                ref={imgRef}
                src={selectedImage}
                alt="Crop preview"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
                className="max-h-full max-w-full object-contain"
                draggable={false}
              />

              {/* Circular Mask Overlay */}
              <div className="absolute inset-0 pointer-events-none border-[32px] border-slate-950/70 rounded-full flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border-2 border-dashed border-amber-400/80 shadow-2xl" />
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-3 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Zoom Level</span>
                  <span>{zoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Rotate</span>
                  <span>{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="15"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-blue-600">
              <span>Uploading to Firebase Storage...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            disabled={!selectedImage || isUploading}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-40"
          >
            Change Image
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!selectedImage || isUploading}
              onClick={handleApplyCrop}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-extrabold rounded-xl text-xs shadow-md shadow-blue-600/30"
            >
              {isUploading ? 'Uploading...' : 'Crop & Save Avatar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
