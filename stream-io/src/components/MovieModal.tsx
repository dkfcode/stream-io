import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, StarHalf, Plus, ChevronDown, Film, Bookmark, BookmarkPlus, Eye, Check, EyeOff } from 'lucide-react';
import type { SearchResult, StreamingService, VideoResult } from '../types/tmdb';
import { format } from 'date-fns';
import { getVideos } from '../services/tmdb';
import VideoPlayer from './VideoPlayer';
import { useWatchlistStore } from '../stores/watchlistStore';
import ListSelectionDialog from './ListSelectionDialog';
import { useTheme, useModal, useTrailer } from '../stores';
import { usePreferencesStore } from '../stores/preferencesStore';
import { getChannelBrandColors } from '../constants/channelBrandColors';
import StandardizedFavoriteButton from './StandardizedFavoriteButton';

interface MovieModalProps {
  item: SearchResult;
  streamingServices: StreamingService[];
  onClose: () => void;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const stars = [];
  const fullStars = Math.floor(rating / 2);
  const hasHalfStar = rating % 2 >= 1;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(<StarHalf key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />);
    } else {
      stars.push(<Star key={i} className="w-4 h-4 text-gray-500" />);
    }
  }

  return <div className="flex gap-0.5">{stars}</div>;
};

const isInTheaters = (releaseDate: string, streamingServices: StreamingService[]): boolean => {
  if (!releaseDate) return false;
  
  // For now, show "Only in Theaters" for any movie with no streaming services
  // This will demonstrate the feature working
  return streamingServices.length === 0;
  
  // TODO: Implement proper date logic later
  // const release = new Date(releaseDate);
  // const now = new Date();
  // const daysSinceRelease = Math.floor((now.getTime() - release.getTime()) / (1000 * 60 * 60 * 24));
  // return daysSinceRelease >= 0 && daysSinceRelease <= 90 && streamingServices.length === 0;
};

const MovieModal: React.FC<MovieModalProps> = ({ 
  item, 
  streamingServices, 
  onClose 
}) => {
  const { themeSettings } = useTheme();
  const { preferences } = usePreferencesStore();
  const { closeTrailer } = useTrailer();
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { 
    watchlists, 
    addToFavorites,
    removeFromFavorite,
    isInFavorite,
    addToHidden,
    removeFromHidden,
    isInHidden,
    addToWatchLater,
    markAsWatched,
    removeFromWatchlist,
    isInWatchLater,
    isInWatched,
    removeFromWatchLater,
    removeFromWatched
  } = useWatchlistStore();

  // Helper function to convert SearchResult to WatchlistItem structure
  const convertToWatchlistItem = (searchItem: SearchResult) => ({
    tmdb_id: searchItem.id,
    media_type: searchItem.media_type as 'movie' | 'tv', // Type assertion since we know it's movie or tv in this context
    title: searchItem.title || searchItem.name || '',
    poster_path: searchItem.poster_path || undefined, // Ensure it's undefined, not null
    release_date: searchItem.release_date || searchItem.first_air_date || undefined,
    rating: searchItem.vote_average || undefined,
    is_watched: false
  });
  
  // Filter out default lists to show only custom lists
  const customUserLists = watchlists.filter(list => !list.is_default);

  // Check if movie is in theaters (only for movies, not TV shows)
  const movieInTheaters = item.media_type === 'movie' && item.release_date && 
    isInTheaters(item.release_date, streamingServices);

  // Check if content is unavailable (no streaming services and not in theaters)
  const isUnavailable = streamingServices.length === 0 && !movieInTheaters;

  // Debug: Log the item data to see what's being passed
  console.log('MovieModal item data:', {
    title: item.title || item.name,
    vote_average: item.vote_average,
    vote_count: item.vote_count,
    release_date: item.release_date,
    media_type: item.media_type
  });

  useEffect(() => {
    const fetchVideos = async () => {
      if (item.media_type === 'movie' || item.media_type === 'tv') {
        const videoData = await getVideos(item.id, item.media_type);
        setVideos(videoData);
      }
    };
    fetchVideos();
  }, [item.id, item.media_type]);

  // Manage trailer state when modal opens/closes
  useEffect(() => {
    // Close any open trailers when modal opens
    closeTrailer();
    
    return () => {
      // Component is unmounting - close trailers
      closeTrailer();
    };
  }, []); // Remove closeTrailer from dependencies to prevent infinite loop

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, isDropdownOpen]);

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{ 
        paddingTop: '64px', // Reduced from 88px
        paddingBottom: '64px', // Reduced from 96px
        paddingLeft: '16px', // Reduced from 24px
        paddingRight: '16px', // Reduced from 24px
        zIndex: 2147483647 // Maximum z-index value
      }}
    >
      <div className="card-elevated rounded-2xl max-w-2xl w-full max-h-full overflow-hidden relative animate-fadeIn flex flex-col">
        {/* Blurred Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/w780${item.poster_path})`,
            filter: 'blur(40px)',
            transform: 'scale(1.2)',
          }}
        />
        
        {/* Dark Overlay for Readability */}
        <div className="absolute inset-0 bg-black/85" />
        
        <div className="absolute top-3 right-3" style={{ zIndex: 2147483647 }}>
          <button
            onClick={onClose}
            className="bg-black/80 hover:bg-black text-gray-400 hover:text-white rounded-xl p-2 transition-colors backdrop-blur-sm border border-gray-800/50"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Video/Image Header - Fixed and Smaller */}
        <div className="flex-shrink-0 relative z-10">
          {videos.length > 0 ? (
            <VideoPlayer
              videoKey={videos[0].key}
              title={item.title || item.name || ''}
              posterPath={item.poster_path || ''}
              disableAutoplay={!preferences.autoplayVideos}
              componentId="movie-modal"
              contentId={item.id}
            />
          ) : (
            <img
              src={`https://image.tmdb.org/t/p/w780${item.poster_path}`}
              alt={item.title || item.name}
              className="w-full aspect-video object-cover rounded-t-2xl max-h-48"
            />
          )}
        </div>
        
        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto min-h-0 relative z-10">
          <div className="p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h2 id="modal-title" className="text-lg font-bold text-white mb-1">
                  {item.title || item.name}
                </h2>
                
                {/* Metadata Capsules */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {/* Release Year Capsule */}
                  <span className="px-1.5 py-0.5 bg-gray-800/50 border border-gray-600 rounded-full text-xs font-medium text-gray-300">
                    {format(new Date(item.release_date || item.first_air_date || ''), 'yyyy')}
                  </span>
                  
                  {/* Rating Capsule */}
                  {item.vote_average && item.vote_average > 0 && (
                    <span className="flex items-center space-x-1 px-1.5 py-0.5 bg-gray-800/50 border border-gray-600 rounded-full text-xs font-medium text-gray-300">
                      <span className="text-xs">⭐</span>
                      <span>{item.vote_average.toFixed(1)}</span>
                    </span>
                  )}
                  
                  {/* Maturity Rating Capsule (Mock data for demonstration) */}
                  <span className="px-1.5 py-0.5 bg-gray-800/50 border border-gray-600 rounded-full text-xs font-medium text-gray-300">
                    {item.vote_average && item.vote_average > 7 ? 'PG-13' : item.vote_average && item.vote_average > 5 ? 'PG' : 'R'}
                  </span>
                  
                  {/* Duration Capsule (Borderless) */}
                  <span className="px-1.5 py-0.5 bg-gray-800/50 rounded-full text-xs font-medium text-gray-300">
                    {item.media_type === 'movie' ? '2h 30m' : '45m'}
                  </span>
                  
                  {/* Popularity/Trending Capsule */}
                  {item.popularity && item.popularity > 100 && (
                    <span className="px-1.5 py-0.5 bg-purple-600/20 border border-purple-500/30 rounded-full text-xs font-medium text-purple-300">
                      Trending
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm mb-2 leading-relaxed line-clamp-2">{item.overview}</p>
            
            {/* Streaming Platforms - Moved Before Action Buttons */}
            <div className="mb-2">
              <div className="relative">
                <div 
                  ref={scrollContainerRef}
                  className="overflow-x-auto pb-1 scroll-smooth hide-scrollbar"
                >
                  <div className="flex gap-1 min-w-max">
                    {streamingServices.map((service) => (
                      <a
                        key={service.name}
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 bg-gray-800 hover:bg-gray-700 rounded-md px-2 h-7 transition-colors border border-gray-700/50 whitespace-nowrap flex-shrink-0"
                      >
                        <img 
                          src={service.logo}
                          alt={`${service.name} logo`}
                          className="w-3 h-3 rounded-full object-cover"
                        />
                        <span className="text-xs text-white font-medium">{service.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Status Indicators - Moved Above Action Buttons */}
            <div className="space-y-1 mb-2">
              {/* Only in Theaters Indicator */}
              {movieInTheaters && (
                <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 px-3 py-1.5 rounded-lg border border-amber-500/30">
                  <Film className="w-4 h-4" />
                  <span className="text-xs font-medium">Only in Theaters</span>
                </div>
              )}

              {/* Unavailable Indicator */}
              {isUnavailable && (
                <div className="flex items-center justify-center gap-2 bg-gray-800/30 text-gray-500 px-3 py-1.5 rounded-lg border border-gray-700/30">
                  <Film className="w-4 h-4" />
                  <span className="text-xs font-medium">Unavailable</span>
                </div>
              )}
            </div>
            
            {/* Action Buttons - Now Horizontal Scrollable with Custom Lists */}
            <div className="mb-3">
              <div className="overflow-x-auto pb-1 scroll-smooth hide-scrollbar">
                <div className="flex gap-2 min-w-max">
                  {/* Default Action Buttons */}
                  {/* Favorite Button */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        if (isInFavorite(item.id)) {
                          await removeFromFavorite(item.id);
                        } else {
                          await addToFavorites(convertToWatchlistItem(item));
                        }
                      } catch (error) {
                        console.error('Error managing favorites:', error);
                      }
                    }}
                    className={`flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-200 flex-shrink-0 ${
                      isInFavorite(item.id)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80'
                    }`}
                    aria-label={isInFavorite(item.id) ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <Star className={`w-5 h-5 mb-0.5 ${isInFavorite(item.id) ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-medium text-center leading-tight">Favorite</span>
                  </button>

                  {/* Watch Later Button */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        if (isInWatchLater(item.id)) {
                          await removeFromWatchLater(item.id);
                        } else {
                          await addToWatchLater(convertToWatchlistItem(item));
                        }
                      } catch (error) {
                        console.error('Error managing watch later:', error);
                      }
                    }}
                    className={`flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-200 flex-shrink-0 ${
                      isInWatchLater(item.id)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80'
                    }`}
                    aria-label={isInWatchLater(item.id) ? "Remove from Watch Later" : "Add to Watch Later"}
                  >
                    <Bookmark className={`w-5 h-5 mb-0.5 ${isInWatchLater(item.id) ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-medium text-center leading-tight">Watch Later</span>
                  </button>

                  {/* Watched Already Button */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        if (isInWatched(item.id)) {
                          await removeFromWatched(item.id);
                        } else {
                          await markAsWatched(convertToWatchlistItem(item));
                        }
                      } catch (error) {
                        console.error('Error managing watched status:', error);
                      }
                    }}
                    className={`flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-200 flex-shrink-0 ${
                      isInWatched(item.id)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80'
                    }`}
                    aria-label={isInWatched(item.id) ? "Remove from Watched" : "Mark as Watched"}
                  >
                    <Check className={`w-5 h-5 mb-0.5 ${isInWatched(item.id) ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-medium text-center leading-tight">Watched</span>
                  </button>

                  {/* Hide Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      try {
                        if (isInHidden(item.id)) {
                          removeFromHidden(item.id);
                        } else {
                          addToHidden(item.id);
                          // Close modal after hiding the item
                          onClose();
                        }
                      } catch (error) {
                        console.error('Error managing hidden status:', error);
                      }
                    }}
                    className={`flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-200 flex-shrink-0 ${
                      isInHidden(item.id)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80'
                    }`}
                    aria-label={isInHidden(item.id) ? "Unhide Item" : "Hide Item"}
                  >
                    <EyeOff className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] font-medium text-center leading-tight">Hide</span>
                  </button>
                  
                  {/* Custom Lists - Only show lists that already contain this item */}
                  {customUserLists
                    .filter(list => list.items && list.items.some(listItem => listItem.tmdb_id === item.id))
                    .map((list) => {
                      return (
                        <button
                          key={list.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Find the item in the watchlist and remove it
                            const watchlistItem = list.items?.find(listItem => listItem.tmdb_id === item.id);
                            if (watchlistItem) {
                              removeFromWatchlist(watchlistItem.id);
                            }
                          }}
                          className="flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-200 flex-shrink-0 bg-purple-600 text-white"
                          aria-label={`Remove from ${list.name}`}
                        >
                          <Check className="w-5 h-5 mb-0.5" />
                          <span className="text-[10px] font-medium text-center leading-tight truncate w-full px-1">
                            {list.name}
                          </span>
                        </button>
                      );
                    })}
                  
                  {/* Add New Custom List Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen(true);
                    }}
                    className="flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-200 flex-shrink-0 bg-gray-800/60 text-gray-300 hover:bg-gray-700/80 border-2 border-dashed border-gray-600 hover:border-purple-500"
                    aria-label="Create New Custom List"
                  >
                    <Plus className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] font-medium text-center leading-tight">Custom</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* List Selection Dialog */}
            {isDropdownOpen && (
              <ListSelectionDialog
                item={item}
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
                onItemAdded={() => {}}
              />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MovieModal;