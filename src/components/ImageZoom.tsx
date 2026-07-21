import React, { useState, useRef, useCallback } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
}

export default function ImageZoom({ src, alt, className = '', containerClassName = '', aspectRatio, width, height, loading = 'lazy' }: ImageZoomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  const imgRef = useRef<HTMLImageElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%` });
  }, []);

  return (
    <>
      <div
        className={`relative overflow-hidden cursor-crosshair group ${containerClassName}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsOpen(true)}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={loading}
          width={width}
          height={height}
          className={`transition-transform duration-150 ease-out select-none ${isHovering ? 'scale-[2.2]' : 'scale-100'} ${className}`}
          style={{ ...(isHovering ? zoomStyle : {}), ...(aspectRatio ? { aspectRatio } : {}) }}
          draggable={false}
          decoding="async"
        />
        <div className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <ZoomIn className="w-4 h-4" />
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-8"
          onClick={() => setIsOpen(false)}
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 p-2 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-zoom-out"
            onClick={(e) => e.stopPropagation()}
            loading="eager"
          />
        </div>
      )}
    </>
  );
}
