import React, { useState } from 'react';
import { Star, Play, Info } from 'lucide-react';
import type { SearchResult } from '../../types/tmdb';
import StandardizedFavoriteButton from '../StandardizedFavoriteButton';
import { getThumbnailOverlayTheme } from '../../utils/sectionThemes';

export interface StandardizedThumbnailProps {
  /** Content item to display */
  item: SearchResult;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show overlay on hover */
  showOverlay?: boolean;
  /** Whether to show rating badge */
  showRating?: boolean;
  /** Whether to show media type badge */
  showMediaType?: boolean;
  /** Whether to show favorite button */
  showFavoriteButton?: boolean;
  /** Whether to show play button */
  showPlayButton?: boolean;
  /** Click handler */
  onClick?: (item: SearchResult) => void;
  /** Custom overlay content */
  overlayContent?: React.ReactNode;
  /** Whether thumbnail should be interactive */
  interactive?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Hover callback */
  onHover?: (itemId: number | null) => void;
  /** Whether this thumbnail is currently hovered (for external hover state) */
  isHovered?: boolean;
}

const StandardizedThumbnail: React.FC<StandardizedThumbnailProps> = ({
  item,
  size = 'md',
  showOverlay = true,
  showRating = true,
  showMediaType = true,
  showFavoriteButton = true,
  showPlayButton = true,
  onClick,
  overlayContent,
  interactive = true,
  className = '',
  isLoading = false,
  onHover,
  isHovered = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const overlayTheme = getThumbnailOverlayTheme();

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-24 h-36', aspect: 'aspect-[2/3]' },
    md: { container: 'w-32 h-48', aspect: 'aspect-[2/3]' },
    lg: { container: 'w-44 h-66', aspect: 'aspect-[2/3]' },
    xl: { container: 'w-52 h-78', aspect: 'aspect-[2/3]' }
  };

  const currentSize = sizeConfig[size];

  const handleClick = () => {
    if (interactive && onClick) {
      onClick(item);
    }
  };

  const handleMouseEnter = () => {
    if (onHover) {
      onHover(item.id);
    }
  };

  const handleMouseLeave = () => {
    if (onHover) {
      onHover(null);
    }
  };

  if (isLoading) {
    return (
      <div className={`${currentSize.container} ${currentSize.aspect} bg-gray-800 rounded-xl animate-pulse ${className}`} />
    );
  }

  return (
    <div 
      className={`relative group ${currentSize.container} flex-shrink-0 p-1 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleClick}
        disabled={!interactive}
        className={`
          relative w-full h-full rounded-xl overflow-hidden 
          ${interactive ? 'focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 transform hover:scale-[1.02] hover:z-10 cursor-pointer' : 'cursor-default'}
          ${!interactive ? 'pointer-events-none' : ''}
        `}
      >
        {/* Poster Image */}
        <img
          src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
          alt={item.title || item.name}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Loading placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Overlay */}
        {showOverlay && (
          <div className={`${overlayTheme.overlay} ${isHovered ? 'opacity-100' : ''}`}>
            <div className="absolute inset-0 flex flex-col justify-between p-3">
              {/* Top Row - Rating and Type Badge */}
              <div className="flex items-start justify-between">
                {showRating && item.vote_average && item.vote_average > 0 && (
                  <div className={overlayTheme.ratingBadge}>
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-white text-xs font-medium">
                      {item.vote_average.toFixed(1)}
                    </span>
                  </div>
                )}
                
                {showMediaType && (
                  <div className={overlayTheme.typeBadge}>
                    {item.media_type === 'movie' ? 'Movie' : 'TV'}
                  </div>
                )}
              </div>

              {/* Center - Custom overlay content */}
              {overlayContent && (
                <div className="flex-1 flex items-center justify-center">
                  {overlayContent}
                </div>
              )}

              {/* Bottom Row - Action Buttons */}
              <div className="flex items-end justify-between">
                {showPlayButton && (
                  <div className={overlayTheme.playButton}>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play</span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onClick) onClick(item);
                    }}
                    className="flex items-center justify-center w-8 h-8 bg-black/60 backdrop-blur-sm text-white rounded-full hover:bg-black/80 transition-colors"
                    aria-label="More info"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Favorite Button - Outside overlay to prevent click conflicts */}
        {showFavoriteButton && (
          <div className={overlayTheme.favoriteButton}>
            <StandardizedFavoriteButton
              item={item}
              size={size === 'sm' ? 'sm' : size === 'xl' ? 'lg' : 'md'}
            />
          </div>
        )}
      </button>
    </div>
  );
};

export default StandardizedThumbnail; 