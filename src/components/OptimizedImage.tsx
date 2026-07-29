import React, { useState, useRef, useEffect } from 'react';
import { proxyImageUrl } from '../utils/safeRender';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  aspectRatio?: string;
  fallback?: string;
  priority?: boolean;
  sizes?: string;
  lazyLoadEnabled?: boolean;
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  aspectRatio,
  fallback = '',
  priority,
  sizes,
  lazyLoadEnabled = true,
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [intersected, setIntersected] = useState(false);

  const finalSrc = error && fallback ? fallback : src;
  const effLoading = priority ? 'eager' : loading;
  const shouldLazy = effLoading === 'lazy' && lazyLoadEnabled;

  useEffect(() => {
    if (!shouldLazy || !imgRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntersected(true);
          obs.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(imgRef.current);
    return () => obs.disconnect();
  }, [shouldLazy]);

  const style: React.CSSProperties = {};
  if (width && height) {
    style.aspectRatio = `${width} / ${height}`;
  } else if (aspectRatio) {
    style.aspectRatio = aspectRatio;
  }

  const imgProps: React.ImgHTMLAttributes<HTMLImageElement> = {
    src: shouldLazy && !intersected ? undefined : proxyImageUrl(finalSrc),
    referrerPolicy: 'no-referrer' as any,
    alt,
    className: `${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`,
    loading: priority ? 'eager' : shouldLazy ? 'lazy' : loading,
    width,
    height,
    style,
    decoding: 'async',
    onError: () => setError(true),
    onLoad: () => setLoaded(true),
    ...(sizes ? { sizes } : {}),
  };

  if (sizes) {
    imgProps.srcSet = finalSrc;
  }

  return <img ref={imgRef} {...imgProps} />;
}
