import React, { useState } from 'react';
import { usePreferences } from '../stores/preferencesStore';
import { ChevronDown, ChevronUp, Star, Tv, Satellite } from 'lucide-react';
import { GENRES } from '../constants/genres';
import { STREAMING_SERVICES } from '../constants/streamingServices';
import { TV_PROVIDERS } from '../data/tvProviders';

interface SetupCompleteProps {
  onStartDiscovering: () => void;
}

const SetupComplete: React.FC<SetupCompleteProps> = ({ onStartDiscovering }) => {
  const { preferences } = usePreferences();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  
  // Safely access preferences with fallbacks
  const selectedGenres = preferences?.selected_genres || [];
  const selectedServices = preferences?.selected_services || [];
  const selectedProviders = preferences?.selected_providers || [];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const renderCollapsibleSection = (
    id: string,
    title: string,
    icon: React.ComponentType<any>,
    items: string[],
    getItemName: (id: string) => string
  ) => {
    const isExpanded = expandedSections.includes(id);
    const Icon = icon;

    return (
      <div className="bg-gray-800/30 rounded-xl border border-gray-700/30">
        <button
          onClick={() => toggleSection(id)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-700/20 transition-colors rounded-xl"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <Icon className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-white font-semibold">{title}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {isExpanded && (
          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-2 pt-2">
              {items.map((itemId) => (
                <span
                  key={itemId}
                  className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-sm"
                >
                  {getItemName(itemId)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 shadow-2xl max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Setup Complete!</h1>
        <p className="text-gray-400 text-lg">
          You're all set! Start discovering amazing content.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {/* Favorite Genres */}
        {renderCollapsibleSection(
          'genres',
          'Favorite Genres',
          Star,
          selectedGenres,
          (genreId) => GENRES.find(g => g.id === genreId)?.name || genreId
        )}

        {/* Streaming Services */}
        {renderCollapsibleSection(
          'services',
          'Streaming Services',
          Tv,
          selectedServices,
          (serviceId) => STREAMING_SERVICES.find(s => s.id === serviceId)?.name || serviceId
        )}

        {/* TV Provider */}
        {renderCollapsibleSection(
          'providers',
          'TV Provider',
          Satellite,
          selectedProviders,
          (providerId) => TV_PROVIDERS.find(p => p.id === providerId)?.name || providerId
        )}


      </div>

      <div className="text-center">
        <button
          onClick={onStartDiscovering}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25"
        >
          Start Discovering Content
        </button>
      </div>
    </div>
  );
};

export default SetupComplete; 