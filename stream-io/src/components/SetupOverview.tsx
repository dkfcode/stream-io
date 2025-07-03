import React, { useState } from 'react';
import { Star, Tv, Satellite, Radio, ChevronDown, ChevronUp } from 'lucide-react';
import { usePreferences } from '../stores/preferencesStore';
import { GENRES } from '../constants/genres';
import { STREAMING_SERVICES } from '../constants/streamingServices';
import { TV_PROVIDERS } from '../data/tvProviders';
import { BROADCAST_TYPES } from '../constants/broadcastTypes';

interface SetupOverviewProps {
  onNext: () => void;
}

const SetupOverview: React.FC<SetupOverviewProps> = ({ onNext }) => {
  const { 
    preferences,
    toggleGenre, 
    toggleService, 
    toggleProvider,
    isGenreSelected,
    isServiceSelected,
    isProviderSelected
  } = usePreferences();

  // State for which section is expanded (accordion behavior)
  const [expandedSection, setExpandedSection] = useState<string | null>('genres');

  // For broadcast types - simplified implementation since not all broadcast functionality is in current store
  const [selectedBroadcastTypes, setSelectedBroadcastTypes] = useState<string[]>([]);

  const handleSectionToggle = (sectionId: string) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
    }
  };

  const handleBroadcastTypeToggle = (typeId: string) => {
    const newTypes = selectedBroadcastTypes.includes(typeId)
      ? selectedBroadcastTypes.filter(id => id !== typeId)
      : [...selectedBroadcastTypes, typeId];
    
    setSelectedBroadcastTypes(newTypes);
  };

  // Calculate completion status
  const selectedGenres = preferences?.selected_genres || [];
  const selectedServices = preferences?.selected_services || [];
  const selectedProviders = preferences?.selected_providers || [];

  const isGenresComplete = selectedGenres.length > 0;
  const isStreamingComplete = selectedServices.length > 0;
  const isTVProviderComplete = selectedProviders.length > 0;
  const isLiveBroadcastComplete = selectedBroadcastTypes.length > 0;

  // Check if all sections are complete (at least one selection from each)
  const allSectionsComplete = isGenresComplete && isStreamingComplete && isTVProviderComplete && isLiveBroadcastComplete;
  
  // Allow users to proceed anytime without minimum requirements
  const canProceed = true;



  const setupTasks = [
    {
      id: 'genres',
      title: 'Favorite Genres',
      icon: Star,
      isComplete: isGenresComplete,
      isExpanded: expandedSection === 'genres',
      selectedCount: selectedGenres.length
    },
    {
      id: 'streaming',
      title: 'Streaming Services',
      icon: Tv,
      isComplete: isStreamingComplete,
      isExpanded: expandedSection === 'streaming',
      selectedCount: selectedServices.length
    },
    {
      id: 'tv-provider',
      title: 'TV Provider',
      icon: Satellite,
      isComplete: isTVProviderComplete,
      isExpanded: expandedSection === 'tv-provider',
      selectedCount: selectedProviders.length
    },
    {
      id: 'live-broadcast',
      title: 'Live Broadcasting',
      icon: Radio,
      isComplete: isLiveBroadcastComplete,
      isExpanded: expandedSection === 'live-broadcast',
      selectedCount: selectedBroadcastTypes.length
    }
  ];

  const renderGenreBubbles = () => (
    <div className="flex flex-wrap gap-2 mt-3 w-full">
      {GENRES.sort((a, b) => a.name.localeCompare(b.name)).map((genre) => {
        const isSelected = isGenreSelected(genre.id);
        return (
          <button
            key={genre.id}
            onClick={() => toggleGenre(genre.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              isSelected
                ? 'bg-purple-600 border border-purple-400 text-white'
                : 'bg-gray-800/50 border border-gray-600 text-gray-300 hover:border-purple-500/50 hover:bg-purple-900/20'
            }`}
          >
            <span className="whitespace-nowrap">{genre.name}</span>
          </button>
        );
      })}
    </div>
  );

  const renderServiceBubbles = () => (
    <div className="flex flex-wrap gap-2 mt-3 w-full">
      {STREAMING_SERVICES.sort((a, b) => a.name.localeCompare(b.name)).map((service) => {
        const isSelected = isServiceSelected(service.id);
        return (
          <button
            key={service.id}
            onClick={() => toggleService(service.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              isSelected
                ? 'bg-purple-600 border border-purple-400 text-white'
                : 'bg-gray-800/50 border border-gray-600 text-gray-300 hover:border-purple-500/50 hover:bg-purple-900/20'
            }`}
          >
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              <img 
                src={service.logo} 
                alt={service.name}
                className="w-4 h-4 rounded object-contain"
                onError={(e) => {
                  e.currentTarget.style.visibility = 'hidden';
                }}
              />
            </div>
            <span className="whitespace-nowrap">{service.name}</span>
          </button>
        );
      })}
    </div>
  );

  const renderTVProviderBubbles = () => (
    <div className="flex flex-wrap gap-2 mt-3 w-full">
      {TV_PROVIDERS.sort((a, b) => a.name.localeCompare(b.name)).map((provider) => {
        const isSelected = isProviderSelected(provider.id);
        return (
          <button
            key={provider.id}
            onClick={() => toggleProvider(provider.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              isSelected
                ? 'bg-purple-600 border border-purple-400 text-white'
                : 'bg-gray-800/50 border border-gray-600 text-gray-300 hover:border-purple-500/50 hover:bg-purple-900/20'
            }`}
          >
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              {provider.id === 'other' ? (
                <span className="text-sm">📺</span>
              ) : (
                <img 
                  src={provider.logo} 
                  alt={provider.name}
                  className="w-4 h-4 rounded object-contain"
                  onError={(e) => {
                    e.currentTarget.style.visibility = 'hidden';
                  }}
                />
              )}
            </div>
            <span className="whitespace-nowrap">{provider.name}</span>
          </button>
        );
      })}
    </div>
  );

  const renderLiveBroadcastBubbles = () => (
    <div className="flex flex-wrap gap-2 mt-3 w-full">
      {BROADCAST_TYPES.sort((a, b) => a.name.localeCompare(b.name)).map((type) => {
        const isSelected = selectedBroadcastTypes.includes(type.id);
        const emoji = type.id === 'sports' ? '🏆' : 
                     type.id === 'news' ? '📰' : 
                     type.id === 'awards' ? '🏆' : 
                     type.id === 'reality' ? '📺' : 
                     type.id === 'competition' ? '🎯' : 
                     type.id === 'gameshow' ? '🎮' : 
                     type.id === 'music' ? '🎵' : 
                     type.id === 'talkshow' ? '🎙️' : 
                     type.id === 'weather' ? '🌤️' : 
                     type.id === 'religious' ? '⛪' : 
                     type.id === 'ceremony' ? '🎉' : '📺';
        return (
          <button
            key={type.id}
            onClick={() => handleBroadcastTypeToggle(type.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              isSelected
                ? 'bg-purple-600 border border-purple-400 text-white'
                : 'bg-gray-800/50 border border-gray-600 text-gray-300 hover:border-purple-500/50 hover:bg-purple-900/20'
            }`}
          >
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              <span>{emoji}</span>
            </div>
            <span className="whitespace-nowrap">{type.name}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            {allSectionsComplete ? 'Setup Complete!' : 'Personalize Your Experience'}
          </h1>
          <p className="text-gray-400 text-lg">
            {allSectionsComplete 
              ? "You're all set! Start discovering amazing content." 
              : "These steps help us recommend better content for you"
            }
          </p>
        </div>

        {/* Collapsible Sections */}
        <div className="space-y-4 mb-8 lg:w-[900px] lg:mx-auto">
          {setupTasks.map((task) => {
            const IconComponent = task.icon;
            return (
              <div 
                key={task.id}
                className={`w-full min-h-[80px] bg-gray-800/30 rounded-xl border transition-all duration-300 ${
                  task.isExpanded
                    ? 'border-purple-500/50 bg-purple-500/5'
                    : 'border-gray-700/50'
                }`}
              >
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => handleSectionToggle(task.id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-600 flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-semibold text-white truncate">{task.title}</h3>
                        {task.selectedCount === 0 ? (
                          <p className="text-gray-400 text-sm">
                            {task.id === 'genres' && 'No genres selected'}
                            {task.id === 'streaming' && 'No streaming services selected'}
                            {task.id === 'tv-provider' && 'No TV provider selected'}
                            {task.id === 'live-broadcast' && 'No broadcast categories selected'}
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {task.id === 'genres' && selectedGenres.slice(0, 5).map(genreId => {
                              const genre = GENRES.find(g => g.id === genreId);
                              return genre ? (
                                <span key={genreId} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                                  {genre.name}
                                </span>
                              ) : null;
                            })}
                            {task.id === 'streaming' && selectedServices.slice(0, 5).map(serviceId => {
                              const service = STREAMING_SERVICES.find(s => s.id === serviceId);
                              return service ? (
                                <span key={serviceId} className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                                  <div className="w-3 h-3 flex items-center justify-center flex-shrink-0">
                                    <img 
                                      src={service.logo} 
                                      alt={service.name}
                                      className="w-3 h-3 rounded object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.visibility = 'hidden';
                                      }}
                                    />
                                  </div>
                                  <span className="whitespace-nowrap">{service.name}</span>
                                </span>
                              ) : null;
                            })}
                            {task.id === 'tv-provider' && selectedProviders.slice(0, 5).map(providerId => {
                              const provider = TV_PROVIDERS.find(p => p.id === providerId);
                              return provider ? (
                                <span key={providerId} className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                                  <div className="w-3 h-3 flex items-center justify-center flex-shrink-0">
                                    {provider.id === 'other' ? (
                                      <span className="text-xs">📺</span>
                                    ) : (
                                      <img 
                                        src={provider.logo} 
                                        alt={provider.name}
                                        className="w-3 h-3 rounded object-contain"
                                        onError={(e) => {
                                          e.currentTarget.style.visibility = 'hidden';
                                        }}
                                      />
                                    )}
                                  </div>
                                  <span className="whitespace-nowrap">{provider.name}</span>
                                </span>
                              ) : null;
                            })}
                            {task.id === 'live-broadcast' && selectedBroadcastTypes.slice(0, 5).map(typeId => {
                              const type = BROADCAST_TYPES.find(t => t.id === typeId);
                              const emoji = typeId === 'sports' ? '🏆' : 
                                           typeId === 'news' ? '📰' : 
                                           typeId === 'awards' ? '🏆' : 
                                           typeId === 'reality' ? '📺' : 
                                           typeId === 'competition' ? '🎯' : 
                                           typeId === 'gameshow' ? '🎮' : 
                                           typeId === 'music' ? '🎵' : 
                                           typeId === 'talkshow' ? '🎙️' : 
                                           typeId === 'weather' ? '🌤️' : 
                                           typeId === 'religious' ? '⛪' : 
                                           typeId === 'ceremony' ? '🎉' : '📺';
                              return type ? (
                                <span key={typeId} className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                                  <div className="w-3 h-3 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs">{emoji}</span>
                                  </div>
                                  <span className="whitespace-nowrap">{type.name}</span>
                                </span>
                              ) : null;
                            })}
                            {task.selectedCount > 5 && (
                              <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full border border-gray-500/30">
                                +{task.selectedCount - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center flex-shrink-0">
                      {task.isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-purple-400" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {task.isExpanded && (
                  <div className="px-6 pb-6">
                    {task.id === 'genres' && renderGenreBubbles()}
                    {task.id === 'streaming' && renderServiceBubbles()}
                    {task.id === 'tv-provider' && renderTVProviderBubbles()}
                    {task.id === 'live-broadcast' && renderLiveBroadcastBubbles()}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={onNext}
            className="px-8 py-4 rounded-xl font-semibold text-lg transition-all bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-purple-500/25"
          >
            {allSectionsComplete ? 'Start Discovering Content' : 'Start Exploring Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupOverview; 