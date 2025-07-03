import React, { useState } from 'react';
import { ArrowLeft, Star, Tv, Satellite, Radio, ChevronDown, ChevronUp } from 'lucide-react';
import { usePreferences } from '../../stores';
import { GENRES } from '../../constants/genres';
import { STREAMING_SERVICES } from '../../constants/streamingServices';
import { TV_PROVIDERS } from '../../data/tvProviders';
import { BROADCAST_TYPES } from '../../constants/broadcastTypes';

interface StreamingPanelProps {
  onBack: () => void;
}

const StreamingPanel: React.FC<StreamingPanelProps> = ({ onBack }) => {
  const { 
    selectedGenres,
    setSelectedGenres,
    selectedServices,
    setSelectedServices,
    selectedProviders,
    setSelectedProviders,
    hasTVProvider,
    setHasTVProvider,
    followsLiveBroadcasting,
    setFollowsLiveBroadcasting,
    hasSelectedPreferences,
    setHasSelectedPreferences,
    hasSelectedServices,
    setHasSelectedServices,
    hasSelectedProviders,
    setHasSelectedProviders,
    hasSelectedBroadcastTypes,
    setHasSelectedBroadcastTypes,
    selectedBroadcastTypes,
    setSelectedBroadcastTypes,
    selectedSports,
    setSelectedSports,
    selectedSportLevels,
    setSelectedSportLevels,
    selectedNewsCategories,
    setSelectedNewsCategories,
    selectedAwardCategories,
    setSelectedAwardCategories,
    selectedRealityCategories,
    setSelectedRealityCategories,
    selectedCompetitionCategories,
    setSelectedCompetitionCategories,
    selectedGameShowCategories,
    setSelectedGameShowCategories,
    selectedMusicCategories,
    setSelectedMusicCategories,
    selectedTalkShowCategories,
    setSelectedTalkShowCategories,
    selectedWeatherCategories,
    setSelectedWeatherCategories,
    selectedReligiousCategories,
    setSelectedReligiousCategories,
    selectedCeremonyCategories,
    setSelectedCeremonyCategories
  } = usePreferences();

  // State for which section is expanded (accordion behavior)
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Broadcast type emojis
  const broadcastEmojis: { [key: string]: string } = {
    sports: '🏆',
    news: '📰',
    awards: '🏆',
    reality: '📺',
    competition: '🎯',
    gameshow: '🎮',
    music: '🎵',
    talkshow: '🎙️',
    weather: '🌤️',
    religious: '⛪',
    ceremony: '🎉'
  };

  const getSelectedGenres = () => {
    return GENRES.filter(genre => selectedGenres.includes(genre.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(genre => ({
        name: genre.name
      }));
  };

  // Check if tasks are complete
  const isGenresComplete = hasSelectedPreferences && selectedGenres.length > 0;
  const isStreamingComplete = hasSelectedServices && selectedServices.length > 0;
  const isTVProviderComplete = hasSelectedProviders && selectedProviders.length > 0;
  const isLiveBroadcastComplete = hasSelectedBroadcastTypes && followsLiveBroadcasting !== null;

  const selectedGenresList = getSelectedGenres();

  const handleSectionToggle = (sectionId: string) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
    }
  };

  // Genre selection handlers
  const handleGenreToggle = (genreId: string) => {
    const newGenres = selectedGenres.includes(genreId)
      ? selectedGenres.filter(id => id !== genreId)
      : [...selectedGenres, genreId];
    
    setSelectedGenres(newGenres);
    setHasSelectedPreferences(true);
  };

  // Streaming service selection handlers
  const handleServiceToggle = (serviceId: string) => {
    const newServices = selectedServices.includes(serviceId)
      ? selectedServices.filter(id => id !== serviceId)
      : [...selectedServices, serviceId];
    
    setSelectedServices(newServices);
    setHasSelectedServices(true);
  };

  // TV Provider selection handlers
  const handleProviderToggle = (providerId: string) => {
    const newProviders = selectedProviders.includes(providerId)
      ? selectedProviders.filter(id => id !== providerId)
      : [...selectedProviders, providerId];
    
    setSelectedProviders(newProviders);
    setHasSelectedProviders(true);
    setHasTVProvider(true);
  };

  // Live broadcasting handlers
  const handleLiveBroadcastingChoice = (follows: boolean) => {
    setFollowsLiveBroadcasting(follows);
    setHasSelectedBroadcastTypes(true);
    if (!follows) {
      // Clear all broadcast selections if user doesn't want live content
      setSelectedBroadcastTypes([]);
      setSelectedSports([]);
      setSelectedSportLevels([]);
      setSelectedNewsCategories([]);
      setSelectedAwardCategories([]);
      setSelectedRealityCategories([]);
      setSelectedCompetitionCategories([]);
      setSelectedGameShowCategories([]);
      setSelectedMusicCategories([]);
      setSelectedTalkShowCategories([]);
      setSelectedWeatherCategories([]);
      setSelectedReligiousCategories([]);
      setSelectedCeremonyCategories([]);
    }
  };

  const handleBroadcastTypeToggle = (typeId: string) => {
    const newTypes = selectedBroadcastTypes.includes(typeId)
      ? selectedBroadcastTypes.filter(id => id !== typeId)
      : [...selectedBroadcastTypes, typeId];
    
    setSelectedBroadcastTypes(newTypes);
    
    // Update followsLiveBroadcasting based on whether any types are selected
    if (newTypes.length > 0) {
      setFollowsLiveBroadcasting(true);
    } else {
      setFollowsLiveBroadcasting(false);
    }
    
    setHasSelectedBroadcastTypes(true);
  };

  const setupTasks = [
    {
      id: 'genres',
      title: 'Favorite Genres',
      icon: Star,
      isComplete: isGenresComplete,
      description: selectedGenresList.length > 0 ? null : 'No genres selected',
      selectedItems: selectedGenresList.length > 0 ? selectedGenresList : null,
      isExpanded: expandedSection === 'genres'
    },
    {
      id: 'streaming',
      title: 'Streaming Services',
      icon: Tv,
      isComplete: isStreamingComplete,
      description: STREAMING_SERVICES.filter(service => selectedServices.includes(service.id)).length > 0 ? null : 'No streaming services selected',
      selectedItems: STREAMING_SERVICES.filter(service => selectedServices.includes(service.id)).length > 0 ? STREAMING_SERVICES.filter(service => selectedServices.includes(service.id)).sort((a, b) => a.name.localeCompare(b.name)) : null,
      isExpanded: expandedSection === 'streaming'
    },
    {
      id: 'tv-provider',
      title: 'TV Provider',
      icon: Satellite,
      isComplete: isTVProviderComplete,
      description: TV_PROVIDERS.filter(provider => selectedProviders.includes(provider.id)).length > 0 
        ? null
        : 'No TV provider selected',
      selectedItems: TV_PROVIDERS.filter(provider => selectedProviders.includes(provider.id)).length > 0 
        ? TV_PROVIDERS.filter(provider => selectedProviders.includes(provider.id)).sort((a, b) => a.name.localeCompare(b.name))
        : null,
      isExpanded: expandedSection === 'tv-provider'
    },
    {
      id: 'live-broadcast',
      title: 'Live Broadcasting',
      icon: Radio,
      isComplete: isLiveBroadcastComplete,
      description: followsLiveBroadcasting === null
        ? 'Not configured'
        : followsLiveBroadcasting 
          ? (selectedBroadcastTypes.length > 0 ? null : 'Interested but no types selected')
          : 'No options selected',
      selectedItems: followsLiveBroadcasting === true && selectedBroadcastTypes.length > 0 ? BROADCAST_TYPES.filter(type => selectedBroadcastTypes.includes(type.id)).sort((a, b) => a.name.localeCompare(b.name)) : null,
      isExpanded: expandedSection === 'live-broadcast'
    }
  ];

  const renderGenreBubbles = () => (
    <div className="flex flex-wrap gap-2 mt-3">
      {GENRES.sort((a, b) => a.name.localeCompare(b.name)).map((genre) => {
        const isSelected = selectedGenres.includes(genre.id);
        return (
          <button
            key={genre.id}
            onClick={() => handleGenreToggle(genre.id)}
            className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              isSelected
                ? 'bg-purple-600 border border-purple-400 text-white'
                : 'bg-gray-800/50 border border-gray-600 text-gray-300 hover:border-purple-500/50 hover:bg-purple-900/20'
            }`}
          >
            <span>{genre.name}</span>
          </button>
        );
      })}
    </div>
  );

  const renderServiceBubbles = () => (
    <div className="flex flex-wrap gap-2 mt-3">
      {STREAMING_SERVICES.sort((a, b) => a.name.localeCompare(b.name)).map((service) => {
        const isSelected = selectedServices.includes(service.id);
        return (
          <button
            key={service.id}
            onClick={() => handleServiceToggle(service.id)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
              isSelected
                ? 'bg-purple-600 border border-purple-400 text-white'
                : 'bg-gray-800/50 border border-gray-600 text-gray-300 hover:border-purple-500/50 hover:bg-purple-900/20'
            }`}
          >
            <img 
              src={service.logo} 
              alt={service.name}
              className="w-2.5 h-2.5 rounded object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span>{service.name}</span>
          </button>
        );
      })}
    </div>
  );

  const renderTVProviderBubbles = () => (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {TV_PROVIDERS.sort((a, b) => a.name.localeCompare(b.name)).map((provider) => {
          const isSelected = selectedProviders.includes(provider.id);
          return (
            <button
              key={provider.id}
              onClick={() => handleProviderToggle(provider.id)}
              className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                isSelected
                  ? 'bg-purple-600 border border-purple-400 text-white'
                  : 'bg-gray-800/50 border border-gray-600 text-gray-300 hover:border-purple-500/50 hover:bg-purple-900/20'
              }`}
            >
              {provider.id === 'other' ? (
                <span className="text-xs">📺</span>
              ) : (
                <img 
                  src={provider.logo} 
                  alt={provider.name}
                  className="w-2.5 h-2.5 rounded object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <span>{provider.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderLiveBroadcastBubbles = () => (
    <div className="flex flex-wrap gap-2 mt-3">
      {BROADCAST_TYPES.sort((a, b) => a.name.localeCompare(b.name)).map((type) => {
        const isSelected = selectedBroadcastTypes.includes(type.id);
        return (
          <button
            key={type.id}
            onClick={() => handleBroadcastTypeToggle(type.id)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              isSelected
                ? 'bg-purple-600 border border-purple-400 text-white'
                : 'bg-gray-800/50 border border-gray-600 text-gray-300 hover:border-purple-500/50 hover:bg-purple-900/20'
            }`}
          >
            <span className="text-xs">{broadcastEmojis[type.id] || '📺'}</span>
            <span>{type.name}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {setupTasks.map((task) => {
            const IconComponent = task.icon;
            return (
              <div 
                key={task.id}
                className={`bg-gray-800/50 rounded-xl border transition-all duration-300 ${
                  task.isExpanded
                    ? 'border-purple-500/50 bg-purple-500/10'
                    : 'border-gray-700/50'
                }`}
              >
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => handleSectionToggle(task.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-600 flex-shrink-0 mt-1">
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-h-[3rem]">
                        <h3 className="text-lg font-semibold text-white mb-1">{task.title}</h3>
                        <div className="min-h-[1.25rem]">
                          {task.description && (
                            <p className="text-sm text-gray-400">
                              {task.description}
                            </p>
                          )}
                          {task.selectedItems && !task.isExpanded && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {task.id === 'genres' && task.selectedItems.map((genre: any) => (
                                <span
                                  key={genre.name}
                                  className="px-2 py-1 bg-gray-800/50 border border-gray-600 rounded-full text-xs text-gray-300"
                                >
                                  <span>{genre.name}</span>
                                </span>
                              ))}
                              {task.id === 'streaming' && task.selectedItems.map((service: any) => (
                                <span
                                  key={service.id}
                                  className="flex items-center space-x-1 px-2 py-1 bg-gray-800/50 border border-gray-600 rounded-lg text-xs text-gray-300"
                                >
                                  <img 
                                    src={service.logo} 
                                    alt={service.name}
                                    className="w-2.5 h-2.5 rounded object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <span>{service.name}</span>
                                </span>
                              ))}
                              {task.id === 'tv-provider' && task.selectedItems.map((provider: any) => (
                                <span
                                  key={provider.id}
                                  className="flex items-center space-x-1 px-2 py-1 bg-gray-800/50 border border-gray-600 rounded-lg text-xs text-gray-300"
                                >
                                  {provider.id === 'other' ? (
                                    <span className="text-xs">📺</span>
                                  ) : (
                                    <img 
                                      src={provider.logo} 
                                      alt={provider.name}
                                      className="w-2.5 h-2.5 rounded object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  )}
                                  <span>{provider.name}</span>
                                </span>
                              ))}
                              {task.id === 'live-broadcast' && task.selectedItems.map((type: any) => (
                                <span
                                  key={type.id}
                                  className="flex items-center space-x-1 px-2 py-1 bg-gray-800/50 border border-gray-600 rounded-full text-xs text-gray-300"
                                >
                                  <span className="text-xs">{broadcastEmojis[type.id] || '📺'}</span>
                                  <span>{type.name}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 mt-1 flex-shrink-0">
                      {task.isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-purple-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {task.isExpanded && (
                  <div className="px-4 pb-4">
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
      </div>
    </div>
  );
};

export default StreamingPanel;