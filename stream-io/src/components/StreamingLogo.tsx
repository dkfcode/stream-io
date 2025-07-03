import React, { useState } from 'react';
import { optimizedTmdbService } from '../services/optimizedTmdbService';

interface StreamingLogoProps {
  serviceId: string;
  className?: string;
  alt?: string;
}

const StreamingLogo: React.FC<StreamingLogoProps> = ({ 
  serviceId, 
  className = "w-12 h-12 rounded-lg object-cover",
  alt
}) => {
  const service = optimizedTmdbService[serviceId];
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!service) {
    return (
      <div className={`${className} bg-gray-600 flex items-center justify-center`}>
        <span className="text-white text-lg">📺</span>
      </div>
    );
  }

  const allUrls = [service.primaryLogo, ...service.fallbackLogos];
  const currentUrl = allUrls[currentUrlIndex];

  const handleError = () => {
    // Try next fallback URL
    if (currentUrlIndex < allUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
      setIsLoading(true);
    } else {
      // All URLs failed, show icon fallback
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  if (hasError) {
    return (
      <div 
        className={`${className} flex items-center justify-center`}
        style={{ backgroundColor: service.color }}
      >
        <span className="text-white text-lg">{service.icon}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} bg-gray-700 animate-pulse flex items-center justify-center absolute inset-0`}>
          <span className="text-gray-400 text-xs">...</span>
        </div>
      )}
      <img 
        src={currentUrl}
        alt={alt || service.name}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  );
};

export default StreamingLogo; 