import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Star, Play, Info, Calendar, Volume2, VolumeX } from 'lucide-react';
import { getContentByPerson, getStreamingServices, getVideos } from '../services/tmdb';
import type { SearchResult, PersonResult, StreamingService } from '../types/tmdb';
import { useTheme } from '../stores/uiStore';
import MovieModal from './MovieModal';
import StandardizedFavoriteButton from './StandardizedFavoriteButton';
import StandardizedSeeMorePage from './shared/StandardizedSeeMorePage';
import StandardizedSectionContainer from './shared/StandardizedSectionContainer';
import StandardizedThumbnail from './shared/StandardizedThumbnail';
import { useTrailer } from '../stores/uiStore';

interface ActorDetailPageProps {
  actor: PersonResult;
  onBack: () => void;
}

const ActorDetailPage: React.FC<ActorDetailPageProps> = ({ actor, onBack }) => {
  const { effectiveTheme, themeSettings } = useTheme();
  const [filmography, setFilmography] = useState<{ movies: SearchResult[], shows: SearchResult[] }>({ movies: [], shows: [] });
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<SearchResult | null>(null);
  const [streamingServices, setStreamingServices] = useState<StreamingService[]>([]);
  
  // See More functionality
  const [showSeeMorePage, setShowSeeMorePage] = useState(false);
  const [seeMoreSection, setSeeMoreSection] = useState<{
    title: string;
    items: SearchResult[];
    type: 'movies' | 'shows';
  } | null>(null);
  const [seeMoreFilter, setSeeMoreFilter] = useState<'all' | 'movie' | 'tv'>('all');

  // Hero section state
  const [expandedSection, setExpandedSection] = useState<'movies' | 'shows' | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isManuallyControlled, setIsManuallyControlled] = useState(false);
  const [trailerKeys, setTrailerKeys] = useState<Record<number, string>>({});
  const [showTrailer, setShowTrailer] = useState<Record<number, boolean>>({});
  const [isMuted, setIsMuted] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [isTextVisible, setIsTextVisible] = useState(true);
  const [isTextPermanentlyVisible, setIsTextPermanentlyVisible] = useState(false);
  
  const timeoutRefs = useRef<Record<number, NodeJS.Timeout>>({});
  const videoRefs = useRef<Record<number, HTMLIFrameElement | null>>({});
  const manualControlTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textFadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Watchlist store methods moved to StandardizedFavoriteButton component

  const { openTrailer, closeTrailer } = useTrailer();

  useEffect(() => {
    const fetchFilmography = async () => {
      try {
        setLoading(true);
        const data = await getContentByPerson(actor.id);
        
        // Filter and sort movies - show all movies, not limited
        const moviesFiltered = data.filter(item => item.media_type === 'movie');
        // Remove duplicates by ID before sorting
        const uniqueMovies = Array.from(new Map(moviesFiltered.map(item => [item.id, item])).values());
        const movies = uniqueMovies.sort((a: SearchResult, b: SearchResult) => {
            const popularityDiff = (b.popularity || 0) - (a.popularity || 0);
            if (Math.abs(popularityDiff) > 10) return popularityDiff;
            const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
            const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
            return dateB - dateA;
          });

        // Filter and sort TV shows - show all shows, not limited
        const showsFiltered = data.filter(item => item.media_type === 'tv');
        // Remove duplicates by ID before sorting
        const uniqueShows = Array.from(new Map(showsFiltered.map(item => [item.id, item])).values());
        const shows = uniqueShows.sort((a: SearchResult, b: SearchResult) => {
            const popularityDiff = (b.popularity || 0) - (a.popularity || 0);
            if (Math.abs(popularityDiff) > 10) return popularityDiff;
            const dateA = a.first_air_date ? new Date(a.first_air_date).getTime() : 0;
            const dateB = b.first_air_date ? new Date(b.first_air_date).getTime() : 0;
            return dateB - dateA;
          });

        setFilmography({ movies, shows });

        // Fetch trailers for all content
        const allContent = [...movies, ...shows];
        const trailerPromises = allContent.map(async (item) => {
          try {
            if (item.media_type === 'movie' || item.media_type === 'tv') {
              const videos = await getVideos(item.id, item.media_type);
              const trailer = videos.find(video => 
                video.site === 'YouTube' && 
                (video.type === 'Trailer' || video.type === 'Teaser') &&
                video.official
              );
              return { id: item.id, key: trailer?.key || null };
            }
            return { id: item.id, key: null };
          } catch (error) {
            console.error(`Error fetching trailer for ${item.id}:`, error);
            return { id: item.id, key: null };
          }
        });

        const trailerResults = await Promise.all(trailerPromises);
        const trailerMap: Record<number, string> = {};
        trailerResults.forEach(({ id, key }) => {
          if (key) trailerMap[id] = key;
        });
        setTrailerKeys(trailerMap);
      } catch (error) {
        console.error('Error fetching filmography:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilmography();
  }, [actor.id]);

  useEffect(() => {
    if (expandedSection && filmography[expandedSection].length > 0) {
      // Reset text visibility state
      setIsTextVisible(true);
      setIsTextPermanentlyVisible(false);
      
      // Clear existing trailers and stop any active ones
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      // Stop any currently active trailers for this section
      if (Object.keys(showTrailer).length > 0) {
        closeTrailer();
      }
      setShowTrailer({});
      
      // Clear text fade timeout
      if (textFadeTimeoutRef.current) {
        clearTimeout(textFadeTimeoutRef.current);
        textFadeTimeoutRef.current = null;
      }
      
      const currentContent = filmography[expandedSection][currentSlide];
      
      // Start trailer for first slide after 5 seconds (only if autoplay is enabled)
      if (themeSettings.autoplayVideos && currentContent && trailerKeys[currentContent.id]) {
        timeoutRefs.current[currentContent.id] = setTimeout(() => {
          openTrailer({ 
            videoKey: trailerKeys[currentContent.id], 
            title: currentContent.title || currentContent.name || 'Unknown' 
          });
          setShowTrailer(prev => ({ ...prev, [currentContent.id]: true }));
        }, 5000);
      }
      
      // Start text fade-out after 13 seconds
      textFadeTimeoutRef.current = setTimeout(() => {
        if (!isTextPermanentlyVisible) {
          setIsTextVisible(false);
        }
      }, 13000);
    }
  }, [expandedSection, currentSlide, filmography, trailerKeys, isTextPermanentlyVisible, themeSettings.autoplayVideos, openTrailer, closeTrailer, showTrailer]);

  // Scroll functions now handled by StandardizedSectionContainer

  const handleSlideChange = (newSlide: number, fromSlide?: number) => {
    if (newSlide < 0 || newSlide >= (expandedSection === 'movies' ? filmography.movies.length : filmography.shows.length)) {
      return;
    }

    const previousSlide = fromSlide !== undefined ? fromSlide : currentSlide;
    const currentContent = expandedSection === 'movies' ? filmography.movies[previousSlide] : filmography.shows[previousSlide];
    const newContent = expandedSection === 'movies' ? filmography.movies[newSlide] : filmography.shows[newSlide];

    if (!newContent) return;

    // Reset text visibility for new slide
    if (!isTextPermanentlyVisible) {
      setIsTextVisible(true);
      
      if (textFadeTimeoutRef.current) {
        clearTimeout(textFadeTimeoutRef.current);
      }
      
      textFadeTimeoutRef.current = setTimeout(() => {
        if (!isTextPermanentlyVisible) {
          setIsTextVisible(false);
        }
      }, 13000);
    }

    // Stop current trailer if it exists
    if (currentContent?.id) {
      closeTrailer();
      setShowTrailer(prev => ({ ...prev, [currentContent.id]: false }));
      if (timeoutRefs.current[currentContent.id]) {
        clearTimeout(timeoutRefs.current[currentContent.id]);
        delete timeoutRefs.current[currentContent.id];
      }
    }

    // Start new trailer after showing cover content for 5 seconds (only if autoplay is enabled)
    if (themeSettings.autoplayVideos && newContent?.id && trailerKeys[newContent.id]) {
      if (timeoutRefs.current[newContent.id]) {
        clearTimeout(timeoutRefs.current[newContent.id]);
      }
      
      timeoutRefs.current[newContent.id] = setTimeout(() => {
        openTrailer({ 
          videoKey: trailerKeys[newContent.id], 
          title: newContent.title || newContent.name || 'Unknown' 
        });
        setShowTrailer(prev => ({ ...prev, [newContent.id]: true }));
      }, 5000);
    }
  };

  // Auto-advance slides when expanded
  useEffect(() => {
    if (expandedSection && !isManuallyControlled && filmography[expandedSection].length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => {
          const nextSlide = (prev + 1) % filmography[expandedSection].length;
          handleSlideChange(nextSlide, prev);
          return nextSlide;
        });
      }, 21000); // 21 seconds per slide

      return () => clearInterval(interval);
    }
  }, [expandedSection, isManuallyControlled, filmography, handleSlideChange]);

  const handleContentClick = async (content: SearchResult) => {
    try {
      if (content.media_type === 'movie' || content.media_type === 'tv') {
        const services = await getStreamingServices(content.id, content.media_type);
        setStreamingServices(services);
        setSelectedContent(content);
      }
    } catch (error) {
      console.error('Error fetching streaming services:', error);
    }
  };

  const handleBackFromSeeMore = () => {
    setShowSeeMorePage(false);
    setSeeMoreSection(null);
  };

  const handleManualSlideChange = (index: number) => {
    if (index < 0 || index >= (expandedSection === 'movies' ? filmography.movies.length : filmography.shows.length) || index === currentSlide) {
      return;
    }
    
    handleSlideChange(index, currentSlide);
    setCurrentSlide(index);
    setIsManuallyControlled(true);
    
    if (manualControlTimeoutRef.current) {
      clearTimeout(manualControlTimeoutRef.current);
    }
    manualControlTimeoutRef.current = setTimeout(() => {
      setIsManuallyControlled(false);
    }, 30000);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    setIframeKey(prev => prev + 1);
  };

  const handleTextClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsTextPermanentlyVisible(!isTextPermanentlyVisible);
    setIsTextVisible(true);
    
    if (textFadeTimeoutRef.current) {
      clearTimeout(textFadeTimeoutRef.current);
    }
  };

  // Render thumbnail for actor content
  const renderActorThumbnail = (item: SearchResult, index: number) => {
    return (
      <StandardizedThumbnail
        key={`actor-${item.id}-${index}`}
        item={item}
        onClick={() => handleContentClick(item)}
        showRating={true}
        overlayContent={
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center space-x-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleContentClick(item);
                }}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
              >
                <Play size={16} className="text-white" />
              </button>
              <StandardizedFavoriteButton
                item={item}
                size="sm"
              />
            </div>
          </div>
        }
      />
    );
  };

  const renderContentSection = (items: SearchResult[], section: 'movies' | 'shows', title: string) => {
    if (items.length === 0) {
      return null;
    }

    const isExpanded = expandedSection === section;
    const currentContent = isExpanded ? items[currentSlide] : null;
    const currentTrailer = currentContent ? trailerKeys[currentContent.id] : null;
    const isShowingTrailer = currentContent ? showTrailer[currentContent.id] && currentTrailer : false;



    return (
      <StandardizedSectionContainer
        title={title}
        items={items}
        sectionId={`actor-${section}-${actor.id}`}
        isExpanded={isExpanded}
        onExpandedChange={(expanded) => setExpandedSection(expanded ? section : null)}
        showSeeMore={items.length > 6}
        onSeeMoreClick={() => {
          setSeeMoreSection({
            title: `${actor.name} - ${title}`,
            items: items,
            type: section
          });
          setShowSeeMorePage(true);
        }}
        enableHorizontalScroll={true}
        expandable={true}
        enableHeroMode={true}
        renderItem={renderActorThumbnail}
        showNavigationDots={false}
        trailerKeys={trailerKeys}
        currentSlide={currentSlide}
        onSlideChange={handleManualSlideChange}
        showTrailer={showTrailer}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onItemClick={handleContentClick}
      />
    );
  };

  // Show see more page when requested
  if (showSeeMorePage && seeMoreSection) {
    return (
      <>
        <StandardizedSeeMorePage
          title={seeMoreSection.title}
          items={seeMoreSection.items}
          mediaFilter={seeMoreFilter}
          onMediaFilterChange={setSeeMoreFilter}
          showMediaFilter={true}
          onBack={handleBackFromSeeMore}
          onItemClick={handleContentClick}
        />
        
        {/* Modal should show on See More page when item is selected */}
        {selectedContent && streamingServices.length > 0 && (
          <MovieModal
            item={selectedContent}
            streamingServices={streamingServices}
            onClose={() => {
              setSelectedContent(null);
              setStreamingServices([]);
            }}
          />
        )}
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-full bg-gray-950 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading filmography...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-950 text-white">
      {/* Header Section - Similar to home tab styling */}
      <div className="relative">
        {/* Actor Hero Section */}
        <div className="relative h-80 bg-gradient-to-b from-gray-900 to-gray-950">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-gray-950" />
          
          {/* Back Button */}
          <button
            onClick={onBack}
            className="absolute top-6 left-6 z-10 flex items-center space-x-2 bg-black/25 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-black/40 border border-gray-600/20 transition-all shadow-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back</span>
          </button>

          {/* Actor Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="max-w-4xl mx-auto text-center">
              {/* Actor Image */}
              <div className="flex justify-center mb-4">
                <img
                  src={`https://image.tmdb.org/t/p/w342${actor.profile_path}`}
                  alt={actor.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-xl"
                />
              </div>
              
              {/* Actor Details */}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  {actor.name}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections - Similar to home tab with multiple sections */}
      <div className="space-y-8 px-4 sm:px-6 lg:px-8 py-8">
        {/* Movies Section */}
        {renderContentSection(
          filmography.movies, 
          'movies', 
          'Movies'
        )}

        {/* TV Shows Section */}
        {renderContentSection(
          filmography.shows, 
          'shows', 
          'TV Shows'
        )}

        {/* Empty State */}
        {filmography.movies.length === 0 && filmography.shows.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-lg mb-2">No content found</div>
            <div className="text-sm">This actor hasn't appeared in any movies or TV shows in our database</div>
          </div>
        )}
      </div>

      {/* Movie Modal */}
      {selectedContent && (
        <MovieModal
          item={selectedContent}
          streamingServices={streamingServices}
          onClose={() => {
            setSelectedContent(null);
            setStreamingServices([]);
          }}
        />
      )}
    </div>
  );
};

export default ActorDetailPage; 