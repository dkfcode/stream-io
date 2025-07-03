import React, { useState, useRef, useEffect } from 'react';
import { imageOptimizer } from '../../services/performanceOptimizer';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height?: number;
  className?: string;
  quality?: number;
  lazy?: boolean;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  quality = 80,
  lazy = true,
  placeholder,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Get optimized image URL
  const optimizedSrc = imageOptimizer.getOptimizedImageUrl(src, width, height, quality);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || shouldLoad) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, shouldLoad]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Render placeholder while loading
  if (!shouldLoad || (!isLoaded && !hasError)) {
    return (
      <div 
        ref={imgRef}
        className={`bg-gray-800 animate-pulse flex items-center justify-center ${className}`}
        style={{ width, height: height || 'auto' }}
      >
        {placeholder ? (
          <img
            src={placeholder}
            alt={alt}
            className="opacity-50"
            style={{ maxWidth: '50%', maxHeight: '50%' }}
          />
        ) : (
          <div className="text-gray-500 text-sm">Loading...</div>
        )}
      </div>
    );
  }

  // Render error state
  if (hasError) {
    return (
      <div 
        className={`bg-gray-800 flex items-center justify-center ${className}`}
        style={{ width, height: height || 'auto' }}
      >
        <div className="text-gray-500 text-sm text-center">
          <div>Image</div>
          <div>Not Available</div>
        </div>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      onLoad={handleLoad}
      onError={handleError}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
    />
  );
};

export default OptimizedImage; 