import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Users, Star, Play, Calendar, ChevronRight, Signal, Info } from 'lucide-react';
import { useTrailer } from '../stores/uiStore';
import { useWatchlistStore } from '../stores/watchlistStore';
import { useModal } from '../stores';
import type { SearchResult } from '../types/tmdb';
import { getChannelBrandColors, hexToRgba } from '../constants/channelBrandColors';
import { liveChannelScheduleService, type LiveProgramInfo } from '../services/liveChannelScheduleService';

interface ChannelNetworkModalProps {
  channel: SearchResult & { 
    channel_info: {
      id: string;
      name: string;
      number: string;
      logo: string;
      category: string;
      popularity: number;
    }
  };
  onClose: () => void;
}

// Using LiveProgramInfo from the service

const ChannelNetworkModal: React.FC<ChannelNetworkModalProps> = ({ 
  channel, 
  onClose 
}) => {
  const { openModal, closeModal } = useModal();
  const [currentProgram, setCurrentProgram] = useState<LiveProgramInfo | null>(null);
  const [upcomingPrograms, setUpcomingPrograms] = useState<LiveProgramInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState<number>(0);

  const { 
    addToFavorite,
    removeFromFavorite,
    isInFavorite,
  } = useWatchlistStore();

  // Generate realistic programming data based on the channel
  const generateProgrammingData = (channelInfo: any): { current: LiveProgramInfo, upcoming: LiveProgramInfo[] } => {
    const now = new Date();
    const currentHour = now.getHours();
    const channelName = channelInfo.name;
    const category = channelInfo.category;

    // Base programming templates by channel type
    const programmingTemplates: { [key: string]: { current: Partial<LiveProgramInfo>, upcoming: Partial<LiveProgramInfo>[] } } = {
      'ESPN': {
        current: {
          title: 'SportsCenter',
          description: 'Comprehensive sports news, highlights, and analysis from around the world',
          genre: 'Sports News',
          rating: 'TV-PG'
        },
        upcoming: [
          { title: 'NBA Tonight', description: 'Live NBA game coverage and analysis', genre: 'Sports' },
          { title: 'College GameDay', description: 'College sports highlights and previews', genre: 'Sports' },
          { title: 'MLB Central', description: 'Baseball news and game recaps', genre: 'Sports' }
        ]
      },
      'CNN': {
        current: {
          title: 'CNN Newsroom',
          description: 'Breaking news coverage and in-depth analysis of current events',
          genre: 'News',
          rating: 'TV-14'
        },
        upcoming: [
          { title: 'Anderson Cooper 360°', description: 'In-depth news analysis and interviews', genre: 'News' },
          { title: 'The Situation Room', description: 'Political news and breaking developments', genre: 'News' },
          { title: 'CNN Tonight', description: 'Late-night news coverage and commentary', genre: 'News' }
        ]
      },
      'Food Network': {
        current: {
          title: 'Chopped',
          description: 'Chefs compete in fast-paced culinary challenges using mystery ingredients',
          genre: 'Reality Competition',
          rating: 'TV-G',
          episode: { season: 52, episode: 8, title: 'Thanksgiving Leftovers' }
        },
        upcoming: [
          { title: 'Beat Bobby Flay', description: 'Culinary competition show', genre: 'Competition' },
          { title: 'Diners, Drive-Ins and Dives', description: 'Food adventure series', genre: 'Food' },
          { title: 'The Kitchen', description: 'Cooking tips and recipes', genre: 'Cooking' }
        ]
      }
    };

    // Get template or create generic one
    const template = programmingTemplates[channelName] || {
      current: {
        title: `${channelName} Prime Time`,
        description: `Featured programming on ${channelName}`,
        genre: category,
        rating: 'TV-PG'
      },
      upcoming: [
        { title: `${channelName} Evening`, description: 'Evening programming', genre: category },
        { title: `${channelName} Late Night`, description: 'Late night programming', genre: category },
        { title: `${channelName} Special`, description: 'Special presentation', genre: category }
      ]
    };

    // Generate current program with realistic times
    const startTime = new Date(now);
    startTime.setHours(currentHour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(currentHour + 1, 0, 0, 0);

    const currentProgram: LiveProgramInfo = {
      id: `current-${channelInfo.id}`,
      title: template.current.title || 'Live Programming',
      description: template.current.description || `Live programming on ${channelName}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: 60,
      genre: template.current.genre || category,
      rating: template.current.rating,
      isLive: true,
      episode: template.current.episode
    };

    // Generate upcoming programs
    const upcoming: LiveProgramInfo[] = template.upcoming.map((prog, index) => {
      const progStart = new Date(endTime);
      progStart.setHours(endTime.getHours() + index, 0, 0, 0);
      const progEnd = new Date(progStart);
      progEnd.setHours(progStart.getHours() + 1, 0, 0, 0);

      return {
        id: `upcoming-${channelInfo.id}-${index}`,
        title: prog.title || `Program ${index + 1}`,
        description: prog.description || 'Upcoming programming',
        startTime: progStart.toISOString(),
        endTime: progEnd.toISOString(),
        duration: 60,
        genre: prog.genre || category,
        rating: 'TV-PG',
        isLive: false
      };
    });

    return { current: currentProgram, upcoming };
  };

  useEffect(() => {
    const loadProgrammingData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch real-time schedule data from the service
        const scheduleData = await liveChannelScheduleService.getChannelSchedule(
          channel.channel_info.name
        );
        
        setCurrentProgram(scheduleData.current || null);
        setUpcomingPrograms(scheduleData.upcoming);
        
        // Generate realistic viewer count based on channel popularity
        const baseViewers = channel.channel_info.popularity * 1000;
        const randomVariation = Math.floor(Math.random() * baseViewers * 0.5);
        setViewerCount(baseViewers + randomVariation);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading channel schedule:', error);
        
        // Fallback to generated data if service fails
        const { current, upcoming } = generateProgrammingData(channel.channel_info);
        setCurrentProgram(current);
        setUpcomingPrograms(upcoming);
        
        const baseViewers = channel.channel_info.popularity * 1000;
        const randomVariation = Math.floor(Math.random() * baseViewers * 0.5);
        setViewerCount(baseViewers + randomVariation);
        
        setIsLoading(false);
      }
    };

    loadProgrammingData();
  }, [channel.channel_info]);

  // Manage trailer state when modal opens/closes
  useEffect(() => {
    setModalOpen(true);
    return () => {
      setModalOpen(false);
    };
  }, [setModalOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
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
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatViewerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const channelId = parseInt(channel.channel_info.id);
  const isChannelFavorite = isInFavorite(channelId);

  const handleToggleFavorite = () => {
    const channelItem = {
      id: channelId,
      title: channel.channel_info.name,
      name: channel.channel_info.name,
      media_type: 'tv' as const,
      poster_path: channel.channel_info.logo,
      backdrop_path: channel.channel_info.logo,
      overview: `${channel.channel_info.name} - ${channel.channel_info.category} Channel`,
      vote_average: 0,
      genre_ids: [],
      popularity: channel.channel_info.popularity,
      first_air_date: new Date().toISOString().split('T')[0]
    };

    if (isChannelFavorite) {
      removeFromFavorite(channelId);
    } else {
      addToFavorite(channelItem);
    }
  };

  if (isLoading) {
    return createPortal(
      <div 
        className="fixed inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm"
        onClick={handleBackdropClick}
        style={{ 
          paddingTop: '88px',
          paddingBottom: '96px',
          paddingLeft: '24px',
          paddingRight: '24px',
          zIndex: 2147483647
        }}
      >
        <div className="bg-black/95 backdrop-blur-sm border border-purple-500/20 rounded-2xl max-w-2xl w-full p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400 text-sm">Loading channel information...</p>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      style={{ 
        paddingTop: '88px',
        paddingBottom: '96px',
        paddingLeft: '24px',
        paddingRight: '24px',
        zIndex: 2147483647
      }}
    >
      <div className="bg-black/95 backdrop-blur-sm border border-purple-500/20 rounded-2xl max-w-4xl w-full max-h-full overflow-hidden relative animate-fadeIn shadow-2xl">
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={onClose}
            className="bg-black/80 hover:bg-black text-gray-400 hover:text-white rounded-xl p-2 transition-colors backdrop-blur-sm border border-gray-800/50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col max-h-full">
          {/* Header Section */}
          <div className="flex-shrink-0 p-6 border-b border-gray-800/50">
            <div className="flex items-start space-x-6">
              {/* Channel Logo */}
              <div className="flex-shrink-0">
                {(() => {
                  const brandColors = getChannelBrandColors(channel.channel_info.name);
                  const backgroundStyle = {
                    backgroundColor: hexToRgba(brandColors.backgroundColor, 0.9)
                  };
                  
                  return (
                    <div 
                      className="w-24 h-24 rounded-xl overflow-hidden border border-gray-700/50 flex items-center justify-center"
                      style={backgroundStyle}
                    >
                      <img
                        src={channel.channel_info.logo}
                        alt={channel.channel_info.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                  );
                })()}
              </div>

              {/* Channel Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-white truncate">
                    {channel.channel_info.name}
                  </h1>
                  <span className="text-gray-400 text-sm bg-gray-800/50 px-2 py-1 rounded">
                    CH {channel.channel_info.number}
                  </span>
                </div>

                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-1">
                    <Signal className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 text-sm font-medium">LIVE</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300 text-sm">
                      {formatViewerCount(viewerCount)} watching
                    </span>
                  </div>

                  <span className="text-purple-400 text-sm bg-purple-500/20 px-2 py-1 rounded">
                    {channel.channel_info.category}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleToggleFavorite}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors border ${
                      isChannelFavorite
                        ? 'bg-purple-500/80 border-purple-400/40 text-white hover:bg-purple-600/80'
                        : 'bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:border-gray-500'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${isChannelFavorite ? 'fill-current' : ''}`} />
                    <span className="text-sm">
                      {isChannelFavorite ? 'Favorited' : 'Add to Favorites'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Currently Playing */}
            {currentProgram && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <Play className="w-5 h-5 text-purple-500" />
                  <span>On Now</span>
                </h2>
                
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-white mb-1">
                        {currentProgram.title}
                      </h3>
                      {currentProgram.episode && (
                        <p className="text-purple-400 text-sm mb-2">
                          Season {currentProgram.episode.season}, Episode {currentProgram.episode.episode}
                          {currentProgram.episode.title && ` • ${currentProgram.episode.title}`}
                        </p>
                      )}
                      <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                        {currentProgram.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 bg-red-600 px-2 py-1 rounded text-white text-xs font-bold ml-4 flex-shrink-0">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>LIVE</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">
                          {formatTime(currentProgram.startTime)} - {formatTime(currentProgram.endTime)}
                        </span>
                      </div>
                      
                      <span className="text-gray-500 bg-gray-800/50 px-2 py-1 rounded">
                        {currentProgram.genre}
                      </span>
                      
                      {currentProgram.rating && (
                        <span className="text-gray-500 bg-gray-800/50 px-2 py-1 rounded">
                          {currentProgram.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Programs */}
            {upcomingPrograms.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <span>Coming Up</span>
                </h2>
                
                <div className="space-y-3">
                  {upcomingPrograms.map((program) => (
                    <div 
                      key={program.id}
                      className="bg-gray-900/30 rounded-xl p-4 border border-gray-800/30 hover:bg-gray-900/50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium group-hover:text-purple-400 transition-colors">
                            {program.title}
                          </h4>
                          <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                            {program.description}
                          </p>
                          <div className="flex items-center space-x-3 mt-2 text-sm">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-500">
                                {formatTime(program.startTime)}
                              </span>
                            </div>
                            <span className="text-gray-600 bg-gray-800/30 px-2 py-0.5 rounded text-xs">
                              {program.genre}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-500 transition-colors flex-shrink-0 ml-3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Channel Stats/Info */}
            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center space-x-2 mb-3">
                <Info className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-medium">Channel Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Network:</span>
                  <p className="text-white font-medium">{channel.channel_info.name}</p>
                </div>
                <div>
                  <span className="text-gray-400">Category:</span>
                  <p className="text-white font-medium">{channel.channel_info.category}</p>
                </div>
                <div>
                  <span className="text-gray-400">Channel Number:</span>
                  <p className="text-white font-medium">{channel.channel_info.number}</p>
                </div>
                <div>
                  <span className="text-gray-400">Current Viewers:</span>
                  <p className="text-white font-medium">{formatViewerCount(viewerCount)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChannelNetworkModal; 