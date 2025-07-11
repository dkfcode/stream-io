import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, Calendar, Users, Play } from 'lucide-react';
import type { LiveEvent } from '../types/liveEvents';
import type { SearchResult } from '../types/tmdb';
import { useWatchlistStore } from '../stores/watchlistStore';
import { useTheme } from '../stores/uiStore';
import { format } from 'date-fns';
import { handleAsyncError, handleError } from '../services/errorHandler';

interface LiveContentModalProps {
  item: LiveEvent;
  onClose: () => void;
}

const LiveContentModal: React.FC<LiveContentModalProps> = ({ 
  item, 
  onClose 
}) => {
  const { effectiveTheme } = useTheme();
  const [sportsData, setSportsData] = useState<any>(null);
  const [isLoadingSports, setIsLoadingSports] = useState(false);
  const [newsData, setNewsData] = useState<any>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [entertainmentData, setEntertainmentData] = useState<any>(null);
  const [isLoadingEntertainment, setIsLoadingEntertainment] = useState(false);
  const [specialEventData, setSpecialEventData] = useState<any>(null);
  const [isLoadingSpecialEvent, setIsLoadingSpecialEvent] = useState(false);
  
  const { 
    addToFavorite,
    removeFromFavorite,
    isInFavorite,
    addToWatchLater,
    removeFromWatchLater,
    isInWatchLater,
    addToWatchedAlready,
    removeFromWatchedAlready,
    isInWatchedAlready
  } = useWatchlistStore();

  // Enhanced data fetching based on content type
  useEffect(() => {
    const fetchEnhancedData = async () => {
      if (!item) return;

      try {
        // Determine content category and fetch relevant data
        const category = item.category?.toLowerCase() || 'general';
        
        if (category.includes('sport')) {
          setIsLoadingSports(true);
          // Simulate sports data fetch
          setTimeout(() => {
            setSportsData({
              league: item.channel?.includes('ESPN') ? 'NFL' : 'NBA',
              teams: ['Team A', 'Team B'],
              score: '14-7',
              quarter: '2nd Quarter',
              timeRemaining: '8:45'
            });
            setIsLoadingSports(false);
          }, 1000);
        } else if (category.includes('news')) {
          setIsLoadingNews(true);
          // Simulate news data fetch
          setTimeout(() => {
            setNewsData({
              category: 'Breaking News',
              location: 'National',
              urgency: 'High',
              lastUpdate: new Date().toISOString()
            });
            setIsLoadingNews(false);
          }, 800);
        } else if (category.includes('entertainment') || category.includes('movie') || category.includes('tv')) {
          setIsLoadingEntertainment(true);
          // Simulate entertainment data fetch
          setTimeout(() => {
            setEntertainmentData({
              genre: item.genre_ids?.[0] || 'Drama',
              rating: 'TV-14',
              awards: ['Emmy Winner', 'Golden Globe Nominee'],
              cast: ['Actor 1', 'Actor 2', 'Actor 3']
            });
            setIsLoadingEntertainment(false);
          }, 1200);
        } else if (category.includes('special') || category.includes('event')) {
          setIsLoadingSpecialEvent(true);
          // Simulate special event data fetch
          setTimeout(() => {
            setSpecialEventData({
              eventType: 'Awards Ceremony',
              venue: 'Los Angeles',
              expectedGuests: ['Celebrity 1', 'Celebrity 2'],
              highlights: ['Red Carpet', 'Main Show', 'After Party']
            });
            setIsLoadingSpecialEvent(false);
          }, 1500);
        }
      } catch (error) {
        handleAsyncError(error as Error, {
          operation: 'fetchEnhancedLiveData',
          context: { itemId: item.id, category: item.category }
        });
      }
    };

    fetchEnhancedData();
  }, [item]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleWatchlistAction = (action: 'favorite' | 'watchLater' | 'watchedAlready', add: boolean) => {
    try {
      // Convert LiveEvent to SearchResult format for watchlist compatibility
      const searchResult: SearchResult = {
        id: parseInt(item.id) || 0,
        title: item.title,
        name: item.title,
        overview: item.description || '',
        poster_path: item.thumbnail || null,
        backdrop_path: item.thumbnail || null,
        vote_average: 0,
        vote_count: 0,
        popularity: item.viewers || 0,
        adult: false,
        original_language: 'en',
        original_title: item.title,
        release_date: item.startTime ? item.startTime.split('T')[0] : '',
        first_air_date: item.startTime ? item.startTime.split('T')[0] : '',
        genre_ids: item.genre_ids || [],
        media_type: 'tv'
      };

      switch (action) {
        case 'favorite':
          if (add) {
            addToFavorite(searchResult);
          } else {
            removeFromFavorite(searchResult.id);
          }
          break;
        case 'watchLater':
          if (add) {
            addToWatchLater(searchResult);
          } else {
            removeFromWatchLater(searchResult.id);
          }
          break;
        case 'watchedAlready':
          if (add) {
            addToWatchedAlready(searchResult);
          } else {
            removeFromWatchedAlready(searchResult.id);
          }
          break;
      }
    } catch (error) {
      handleError(error as Error, {
        operation: 'handleWatchlistAction',
        context: { action, add, itemId: item.id }
      });
    }
  };

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const formatTime = (timeString: string) => {
    try {
      return format(new Date(timeString), 'h:mm a');
    } catch {
      return timeString;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const itemId = parseInt(item.id) || 0;
  const isFavorited = isInFavorite(itemId);
  const isInWatchList = isInWatchLater(itemId);
  const isWatched = isInWatchedAlready(itemId);

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-black/90 backdrop-blur-xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative border border-purple-500/20">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-gray-400 hover:text-white rounded-xl p-2 transition-colors backdrop-blur-sm"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="overflow-y-auto max-h-[90vh]">
          {/* Header Section */}
          <div className="relative">
            {item.thumbnail && (
              <div className="aspect-video bg-gray-900 relative overflow-hidden">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                {/* Live Badge */}
                {item.isLive && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span>LIVE</span>
                  </div>
                )}

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 transition-colors">
                    <Play className="w-8 h-8 fill-current" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-6 space-y-6">
            {/* Title and Basic Info */}
            <div>
              <h1 id="modal-title" className="text-3xl font-bold text-white mb-2">
                {item.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-300 mb-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatTime(item.startTime)} - {formatTime(item.endTime)}</span>
                </div>
                
                {item.duration && (
                  <div className="flex items-center space-x-1">
                    <span>{formatDuration(item.duration)}</span>
                  </div>
                )}
                
                {item.viewers && (
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{item.viewers.toLocaleString()} viewers</span>
                  </div>
                )}

                {item.channel && (
                  <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded-md text-sm">
                    {item.channel}
                  </span>
                )}
              </div>

              {item.description && (
                <p className="text-gray-300 text-lg leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleWatchlistAction('favorite', !isFavorited)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isFavorited 
                    ? 'bg-purple-500/80 hover:bg-purple-600/80 text-white border border-purple-400/40' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-white/20'
                }`}
              >
                <Star className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                <span>{isFavorited ? 'Favorited' : 'Add to Favorites'}</span>
              </button>

              <button
                onClick={() => handleWatchlistAction('watchLater', !isInWatchList)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isInWatchList 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>{isInWatchList ? 'In Watch Later' : 'Watch Later'}</span>
              </button>

              <button
                onClick={() => handleWatchlistAction('watchedAlready', !isWatched)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isWatched 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <span>{isWatched ? 'Watched' : 'Mark as Watched'}</span>
              </button>
            </div>

            {/* Enhanced Data Sections */}
            {/* Sports Data */}
            {(sportsData || isLoadingSports) && (
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-xl font-semibold text-white mb-4">Game Details</h3>
                {isLoadingSports ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                  </div>
                ) : sportsData && (
                  <div className="grid grid-cols-2 gap-4 text-gray-300">
                    <div>
                      <span className="text-gray-400">League:</span> {sportsData.league}
                    </div>
                    <div>
                      <span className="text-gray-400">Score:</span> {sportsData.score}
                    </div>
                    <div>
                      <span className="text-gray-400">Quarter:</span> {sportsData.quarter}
                    </div>
                    <div>
                      <span className="text-gray-400">Time:</span> {sportsData.timeRemaining}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* News Data */}
            {(newsData || isLoadingNews) && (
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-xl font-semibold text-white mb-4">News Details</h3>
                {isLoadingNews ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                  </div>
                ) : newsData && (
                  <div className="space-y-2 text-gray-300">
                    <div>
                      <span className="text-gray-400">Category:</span> {newsData.category}
                    </div>
                    <div>
                      <span className="text-gray-400">Coverage:</span> {newsData.location}
                    </div>
                    <div>
                      <span className="text-gray-400">Priority:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        newsData.urgency === 'High' ? 'bg-red-600' : 'bg-yellow-600'
                      }`}>
                        {newsData.urgency}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Entertainment Data */}
            {(entertainmentData || isLoadingEntertainment) && (
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-xl font-semibold text-white mb-4">Show Details</h3>
                {isLoadingEntertainment ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                  </div>
                ) : entertainmentData && (
                  <div className="space-y-3 text-gray-300">
                    <div>
                      <span className="text-gray-400">Genre:</span> {entertainmentData.genre}
                    </div>
                    <div>
                      <span className="text-gray-400">Rating:</span> {entertainmentData.rating}
                    </div>
                    {entertainmentData.awards && (
                      <div>
                        <span className="text-gray-400">Awards:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {entertainmentData.awards.map((award: string, index: number) => (
                            <span key={index} className="bg-yellow-600/20 text-yellow-300 px-2 py-1 rounded text-sm">
                              {award}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Special Event Data */}
            {(specialEventData || isLoadingSpecialEvent) && (
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-xl font-semibold text-white mb-4">Event Details</h3>
                {isLoadingSpecialEvent ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                  </div>
                ) : specialEventData && (
                  <div className="space-y-3 text-gray-300">
                    <div>
                      <span className="text-gray-400">Event Type:</span> {specialEventData.eventType}
                    </div>
                    <div>
                      <span className="text-gray-400">Venue:</span> {specialEventData.venue}
                    </div>
                    {specialEventData.highlights && (
                      <div>
                        <span className="text-gray-400">Program:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {specialEventData.highlights.map((highlight: string, index: number) => (
                            <span key={index} className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-sm">
                              {highlight}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LiveContentModal; 