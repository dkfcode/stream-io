import React, { useState } from 'react';
import { ArrowLeft, LayoutGrid, List } from 'lucide-react';
import type { SearchResult, StreamingService } from '../types/tmdb';
import MovieModal from './MovieModal';
import { getSeeMoreGridLayout } from '../utils/gridLayoutUtils';
import StandardizedThumbnail from './shared/StandardizedThumbnail';

interface SearchResultsProps {
  results: SearchResult[];
  streamingServices: Record<number, StreamingService[]>;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, streamingServices }) => {
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);

  if (results.length === 0) return null;

  const sortedResults = [...results].sort((a, b) => {
    const aScore = (a.vote_average || 0) * (a.vote_count || 0);
    const bScore = (b.vote_average || 0) * (b.vote_count || 0);
    return bScore - aScore;
  });

  const renderListItem = (item: SearchResult) => (
    <div 
      key={item.id} 
      className="p-4 hover:bg-gray-700 border-b border-gray-700 last:border-0 cursor-pointer"
      onClick={() => setSelectedItem(item)}
    >
      <div className="flex items-start space-x-4">
        {item.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
            alt={item.title || item.name}
            className="w-16 h-24 object-cover rounded"
          />
        ) : (
          <div className="w-16 h-24 bg-gray-700 rounded flex items-center justify-center">
  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-xl max-h-[70vh] overflow-y-auto z-50">
      {sortedResults.map((result) => (
        <div 
          key={result.id} 
          className="p-4 hover:bg-gray-700 border-b border-gray-700 last:border-0 cursor-pointer"
          onClick={() => setSelectedItem(result)}
        >
          <div className="flex items-start space-x-4">
            {result.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w92${result.poster_path}`}
                alt={result.title || result.name}
                className="w-16 h-24 object-cover rounded"
              />
            ) : (
              <div className="w-16 h-24 bg-gray-700 rounded flex items-center justify-center">
                <span className="text-gray-500">No Image</span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-white">
                  {result.title || result.name}
                </h3>
              </div>
              <p className="text-sm text-gray-400 mb-2">
                {result.media_type === 'movie' ? 'Movie' : 'TV Show'} •{' '}
                {result.release_date || result.first_air_date || 'Release date unknown'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {streamingServices[result.id]?.map((service) => (
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
      ))}

      {selectedItem && (
        <MovieModal
          item={selectedItem}
          streamingServices={streamingServices[selectedItem.id] || []}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

export default SearchResults;