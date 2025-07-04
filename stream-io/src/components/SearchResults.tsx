import React, { useState, useEffect } from 'react';
import { ArrowLeft, LayoutGrid, List, Star, User, Film, Tv, Calendar, TrendingUp, Award, ChevronRight } from 'lucide-react';
import type { SearchResult, StreamingService, PersonResult } from '../types/tmdb';
import { getContentByPerson } from '../services/tmdb';
import MovieModal from './MovieModal';
import ActorDetailPage from './ActorDetailPage';
import { getSeeMoreGridLayout } from '../utils/gridLayoutUtils';
import StandardizedThumbnail from './shared/StandardizedThumbnail';

interface SearchResultsProps {
  results: SearchResult[];
  streamingServices: Record<number, StreamingService[]>;
  onActorClick?: (actor: PersonResult) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ 
  results, 
  streamingServices,
  onActorClick 
}) => {
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [selectedActor, setSelectedActor] = useState<PersonResult | null>(null);
  const [isViewingActor, setIsViewingActor] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [actorFilmography, setActorFilmography] = useState<Record<number, SearchResult[]>>({});
  const [loadingFilmography, setLoadingFilmography] = useState<Set<number>>(new Set());

  if (results.length === 0) return null;

  // Separate results by type
  const movies = results.filter(item => item.media_type === 'movie');
  const shows = results.filter(item => item.media_type === 'tv');
  const actors = results.filter(item => item.media_type === 'person');

  // Load actor filmography for preview
  useEffect(() => {
    const loadActorPreviews = async () => {
      for (const actor of actors.slice(0, 5)) { // Limit to top 5 actors
        if (!actorFilmography[actor.id] && !loadingFilmography.has(actor.id)) {
          setLoadingFilmography(prev => new Set(prev).add(actor.id));
          
          try {
            const filmography = await getContentByPerson(actor.id);
            const topContent = filmography
              .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
              .slice(0, 3);
            
            setActorFilmography(prev => ({
              ...prev,
              [actor.id]: topContent
            }));
          } catch (error) {
            console.warn(`Failed to load filmography for actor ${actor.id}:`, error);
          } finally {
            setLoadingFilmography(prev => {
              const newSet = new Set(prev);
              newSet.delete(actor.id);
              return newSet;
            });
          }
        }
      }
    };

    if (actors.length > 0) {
      loadActorPreviews();
    }
  }, [actors, actorFilmography, loadingFilmography]);

  const handleActorClick = (actor: SearchResult) => {
    // Convert SearchResult to PersonResult format
    const personResult: PersonResult = {
      id: actor.id,
      name: actor.name || 'Unknown',
      profile_path: actor.profile_path || null,
      known_for_department: actor.known_for_department || 'Acting',
      known_for: actor.known_for || [],
      popularity: actor.popularity || 0
    };
    
    setSelectedActor(personResult);
    setIsViewingActor(true);
    
    // Call parent handler if provided
    onActorClick?.(personResult);
  };

  const handleBackFromActor = () => {
    setSelectedActor(null);
    setIsViewingActor(false);
  };

  const handleContentClick = (item: SearchResult) => {
    if (item.media_type === 'person') {
      handleActorClick(item);
    } else {
      setSelectedItem(item);
    }
  };

  const renderActorItem = (actor: SearchResult, index: number) => {
    const filmography = actorFilmography[actor.id] || [];
    const isLoading = loadingFilmography.has(actor.id);

    return (
      <div 
        key={`actor-${actor.id}`} 
        className="p-6 hover:bg-gray-700/50 border-b border-gray-700 last:border-0 cursor-pointer group transition-all duration-200"
        onClick={() => handleActorClick(actor)}
      >
        <div className="flex items-start space-x-4">
          <div className="relative flex-shrink-0">
            {actor.profile_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                alt={actor.name}
                className="w-16 h-16 object-cover rounded-full ring-2 ring-gray-600 group-hover:ring-purple-500 transition-all duration-200"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center ring-2 ring-gray-600 group-hover:ring-purple-500 transition-all duration-200">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
            {/* Popularity Indicator */}
            {actor.popularity && actor.popularity > 15 && (
              <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {Math.round(actor.popularity)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                  {actor.name}
                </h3>
                <div className="flex items-center text-gray-400 text-sm mt-1">
                  <User className="w-4 h-4 mr-1" />
                  <span>{actor.known_for_department || 'Acting'}</span>
                  {actor.popularity && actor.popularity > 10 && (
                    <>
                      <span className="mx-2">•</span>
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span>Popular</span>
                    </>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContentItem = (item: SearchResult) => (
    <div 
      key={`${item.media_type}-${item.id}`} 
      className="p-4 hover:bg-gray-700/50 border-b border-gray-700 last:border-0 cursor-pointer group transition-all duration-200"
      onClick={() => handleContentClick(item)}
    >
      <div className="flex items-start space-x-4">
        <div className="relative flex-shrink-0">
          {item.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
              alt={item.title || item.name}
              className="w-16 h-24 object-cover rounded"
            />
          ) : (
            <div className="w-16 h-24 bg-gray-700 rounded flex items-center justify-center">
              {item.media_type === 'movie' ? (
                <Film className="w-6 h-6 text-gray-400" />
              ) : (
                <Tv className="w-6 h-6 text-gray-400" />
              )}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
              {item.title || item.name}
            </h3>
          </div>
          <p className="text-sm text-gray-400 mb-2">
            {item.media_type === 'movie' ? 'Movie' : 'TV Show'} •{' '}
            {item.release_date ? new Date(item.release_date).getFullYear() : 
             item.first_air_date ? new Date(item.first_air_date).getFullYear() : 
             'Release date unknown'}
          </p>
          {item.vote_average && item.vote_average > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm text-gray-400">{item.vote_average.toFixed(1)}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {streamingServices[item.id]?.map((service) => (
              <a
                key={service.name}
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 bg-purple-500/20 hover:bg-purple-500/30 rounded-md px-1.5 py-0.5 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <img 
                  src={service.logo}
                  alt={`${service.name} logo`}
                  className="w-3 h-3 rounded-full object-cover"
                />
                <span className="text-xs font-medium text-purple-200">{service.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Show actor detail page when viewing an actor
  if (isViewingActor && selectedActor) {
    return (
      <div className="fixed inset-0 bg-gray-950 z-50 overflow-y-auto">
        <ActorDetailPage
          actor={selectedActor}
          onBack={handleBackFromActor}
        />
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-xl max-h-[70vh] overflow-y-auto z-50">
      {/* Search Results Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Search Results ({results.length})
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="max-h-[60vh] overflow-y-auto">
        {/* Movies Section */}
        {movies.length > 0 && (
          <div className="border-b border-gray-700">
            <div className="p-4 bg-gray-800/50">
              <h4 className="text-md font-medium text-gray-300 flex items-center gap-2">
                <Film className="w-4 h-4" />
                Movies ({movies.length})
              </h4>
            </div>
            <div>
              {movies.slice(0, 6).map(renderContentItem)}
            </div>
          </div>
        )}

        {/* TV Shows Section */}
        {shows.length > 0 && (
          <div className={`${actors.length > 0 ? 'border-b border-gray-700' : ''}`}>
            <div className="p-4 bg-gray-800/50">
              <h4 className="text-md font-medium text-gray-300 flex items-center gap-2">
                <Tv className="w-4 h-4" />
                TV Shows ({shows.length})
              </h4>
            </div>
            <div>
              {shows.slice(0, 6).map(renderContentItem)}
            </div>
          </div>
        )}

        {/* Actors Section */}
        {actors.length > 0 && (
          <div>
            <div className="p-4 bg-gray-800/50">
              <h4 className="text-md font-medium text-gray-300 flex items-center gap-2">
                <User className="w-4 h-4" />
                Actors ({actors.length})
              </h4>
            </div>
            <div>
              {actors.slice(0, 5).map((actor, index) => renderActorItem(actor, index))}
              {actors.length > 5 && (
                <div className="p-4 text-center">
                  <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                    View all {actors.length} actors →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Results */}
        {movies.length === 0 && shows.length === 0 && actors.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <div className="text-lg mb-2">No results found</div>
            <div className="text-sm">Try searching for different content, actors, or keywords</div>
          </div>
        )}
      </div>

      {/* Movie Modal */}
      {selectedItem && !isViewingActor && (
        <MovieModal
          item={selectedItem}
          streamingServices={streamingServices[selectedItem.id] || []}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

export default SearchResults;