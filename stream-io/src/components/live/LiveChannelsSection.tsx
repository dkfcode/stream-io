import React, { useState, useEffect } from 'react';
import StandardizedSectionContainer from '../shared/StandardizedSectionContainer';
import StandardizedThumbnail from '../shared/StandardizedThumbnail';
import { usePreferences } from '../../stores/preferencesStore';
import { useI18n } from '../../constants/i18n';
import { useSectionExpansion } from '../../stores/uiStore';
import type { SearchResult } from '../../types/tmdb';
import { getChannelBrandColors, hexToRgba } from '../../constants/channelBrandColors';
import { Play, Info, Star } from 'lucide-react';

interface LiveChannelsSectionProps {
  onChannelClick: (channel: any) => void;
  selectedFilter?: string;
}

// Channel data structure for Live TV
interface ChannelInfo {
  id: number;
  name: string;
  number: string;
  logo: string;
  category: string;
  popularity: number;
  currentShow?: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
  };
}

const LiveChannelsSection: React.FC<LiveChannelsSectionProps> = ({
  onChannelClick,
  selectedFilter = 'all'
}) => {
  const { preferences } = usePreferences();
  const selectedProviders = preferences.selected_providers || [];
  const { t } = useI18n();
  const { isExpanded } = useSectionExpansion();
  
  // Check if this section is expanded
  const sectionIsExpanded = isExpanded('on-now');
  
  // State for hero focus in expanded mode
  const [heroChannelIndex, setHeroChannelIndex] = useState(0);

  // Define the specific channels requested by user in alphabetical order
  const getChannelsForUser = (): ChannelInfo[] => {
    const requestedChannels: ChannelInfo[] = [
      {
        id: 3001,
        name: 'ABC',
        number: '007',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/ABC_2021_logo_White.png/1200px-ABC_2021_logo_White.png',
        category: 'Broadcast',
        popularity: 92,
        currentShow: {
          title: 'Good Morning America',
          description: 'Morning news and talk show with breaking news, weather, and celebrity interviews',
          startTime: '07:00',
          endTime: '09:00'
        }
      },
      {
        id: 3002,
        name: 'CBS',
        number: '002',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/CBS_logo.svg/512px-CBS_logo.svg.png',
        category: 'Broadcast',
        popularity: 94,
        currentShow: {
          title: 'CBS This Morning',
          description: 'Morning news program with the latest headlines and in-depth reporting',
          startTime: '07:00',
          endTime: '09:00'
        }
      },
      {
        id: 3003,
        name: 'CNN',
        number: '200',
        logo: 'https://download.logo.wine/logo/CNN/CNN-Logo.wine.png',
        category: 'News',
        popularity: 88,
        currentShow: {
          title: 'CNN Newsroom',
          description: 'Breaking news and analysis from around the world with expert commentary',
          startTime: '18:00',
          endTime: '19:00'
        }
      },
      {
        id: 3004,
        name: 'Disney',
        number: '290',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Disney_Channel_2014_Gradient.png/960px-Disney_Channel_2014_Gradient.png?20241124035508',
        category: 'Kids',
        popularity: 85,
        currentShow: {
          title: 'Mickey Mouse Clubhouse',
          description: 'Educational kids show teaching problem-solving and teamwork',
          startTime: '08:00',
          endTime: '08:30'
        }
      },
      {
        id: 3005,
        name: 'ESPN',
        number: '206',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/512px-ESPN_wordmark.svg.png',
        category: 'Sports',
        popularity: 95,
        currentShow: {
          title: 'SportsCenter',
          description: 'Sports news and highlights from NFL, NBA, MLB, and college sports',
          startTime: '19:00',
          endTime: '20:00'
        }
      },
      {
        id: 3006,
        name: 'Food Network',
        number: '231',
        logo: 'https://comcastadvertising.com/wp-content/uploads/2021/10/Food-White-Small.webp',
        category: 'Lifestyle',
        popularity: 78,
        currentShow: {
          title: 'Chopped',
          description: 'Cooking competition where chefs create dishes using mystery ingredients',
          startTime: '19:30',
          endTime: '20:30'
        }
      },
      {
        id: 3007,
        name: 'Fox',
        number: '005',
        logo: 'https://wp-cdn.milocloud.com/cap-equity-wp/wp-content/uploads/2020/04/08180526/ox-logo-fox-tv-logo-png.png',
        category: 'Broadcast',
        popularity: 90,
        currentShow: {
          title: 'The Five',
          description: 'News and opinion show with political analysis and current events',
          startTime: '17:00',
          endTime: '18:00'
        }
      },
      {
        id: 3008,
        name: 'Hallmark',
        number: '312',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Hallmark_Channel.svg/512px-Hallmark_Channel.svg.png',
        category: 'Entertainment',
        popularity: 75,
        currentShow: {
          title: 'When Calls the Heart',
          description: 'Heartwarming drama series set in a frontier town in the early 1900s',
          startTime: '20:00',
          endTime: '21:00'
        }
      },
      {
        id: 3009,
        name: 'ION Television',
        number: '049',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Ion_logo.svg/250px-Ion_logo.svg.png',
        category: 'Entertainment',
        popularity: 65,
        currentShow: {
          title: 'Blue Bloods',
          description: 'Police procedural drama following a family of law enforcement officers',
          startTime: '19:00',
          endTime: '20:00'
        }
      },
      {
        id: 3010,
        name: 'Lifetime',
        number: '252',
        logo: 'https://aenselect.com/admin/images/Lifetime_Logo_2019_WHITE.png',
        category: 'Entertainment',
        popularity: 72,
        currentShow: {
          title: 'Dance Moms',
          description: 'Reality competition series following young dancers and their mothers',
          startTime: '18:00',
          endTime: '19:00'
        }
      },
      {
        id: 3011,
        name: 'FOX News',
        number: '201',
        logo: 'https://cdn.shopify.com/s/files/1/0558/6413/1764/files/Fox_News_Logo_Design_History_Evolution_0_1024x1024.jpg?v=1694099298',
        category: 'News',
        popularity: 85,
        currentShow: {
          title: 'The Five',
          description: 'News and opinion discussion show with political commentary',
          startTime: '17:00',
          endTime: '18:00'
        }
      },
      {
        id: 3012,
        name: 'NBC',
        number: '004',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/NBC_logo.svg/512px-NBC_logo.svg.png',
        category: 'Broadcast',
        popularity: 93,
        currentShow: {
          title: 'Today Show',
          description: 'Morning news and talk show with weather, entertainment, and lifestyle segments',
          startTime: '07:00',
          endTime: '09:00'
        }
      },
      {
        id: 3013,
        name: 'Nickelodeon',
        number: '299',
        logo: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/a5c95036-7303-4d2d-a772-c4d136a13666/dgac7br-88e5738d-89be-4e30-8811-ddb2a05900cf.png/v1/fill/w_1280,h_183/nickelodeon_2009_logo_white_by_gamer8371_dgac7br-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTgzIiwicGF0aCI6IlwvZlwvYTVjOTUwMzYtNzMwMy00ZDJkLWE3NzItYzRkMTM2YTEzNjY2XC9kZ2FjN2JyLTg4ZTU3MzhkLTg5YmUtNGUzMC04ODExLWRkYjJhMDU5MDBjZi5wbmciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.MzGkbXjjLkwUVRJPBzyaFEolRwsRlhehviikEnS4bAk',
        category: 'Kids',
        popularity: 80,
        currentShow: {
          title: 'SpongeBob SquarePants',
          description: 'Animated comedy series about a sea sponge and his underwater adventures',
          startTime: '16:00',
          endTime: '16:30'
        }
      },
      {
        id: 3014,
        name: 'TBS',
        number: '239',
        logo: 'https://cdn.sanity.io/images/1pn9obcz/production/8a8fc88a9f4cbd965b864f6c81bc02f48233c36a-1920x1080.jpg',
        category: 'Entertainment',
        popularity: 77,
        currentShow: {
          title: 'The Big Bang Theory',
          description: 'Comedy series about a group of scientists and their social interactions',
          startTime: '18:00',
          endTime: '18:30'
        }
      },
      {
        id: 3015,
        name: 'TNT',
        number: '245',
        logo: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/be74b3f4-088f-4981-a2fa-c8b64335dc92/dex71v9-cbd0f25b-6009-46ef-80f6-6ba17bc375a5.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcL2JlNzRiM2Y0LTA4OGYtNDk4MS1hMmZhLWM4YjY0MzM1ZGM5MlwvZGV4NzF2OS1jYmQwZjI1Yi02MDA5LTQ2ZWYtODBmNi02YmExN2JjMzc1YTUucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.ss2XoAcnnf4QlcpoGV5xTewkd_SdlL8xrYb5t7ux76E',
        category: 'Entertainment',
        popularity: 81,
        currentShow: {
          title: 'Law & Order',
          description: 'Crime drama series following police investigations and legal proceedings',
          startTime: '19:00',
          endTime: '20:00'
        }
      }
    ];

    // Return channels in alphabetical order (already sorted above)
    return requestedChannels.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Apply filters to channels based on selectedFilter
  const applyChannelFilter = (channels: ChannelInfo[]): ChannelInfo[] => {
    if (selectedFilter === 'live-now') {
      // All channels are considered "live now" since they're broadcasting
      return channels;
    }
    if (selectedFilter === 'upcoming') {
      // For upcoming, we could filter based on upcoming shows, but for now return all
      return channels;
    }
    return channels;
  };

  // Convert channel to SearchResult format for StandardizedThumbnail
  const channelToSearchResult = (channel: ChannelInfo): SearchResult => ({
    id: channel.id,
    title: channel.currentShow?.title || channel.name, // Use show title if available, fallback to channel name
    name: channel.currentShow?.title || channel.name, // Use show title if available, fallback to channel name
    poster_path: channel.logo,
    backdrop_path: channel.logo,
    overview: channel.currentShow?.description || `${channel.name} - ${channel.category} Channel`,
    vote_average: channel.popularity / 10,
    media_type: 'tv' as const,
    genre_ids: [],
    popularity: channel.popularity,
    first_air_date: new Date().toISOString().split('T')[0],
    // Channel-specific data for modal
    channel_info: {
      id: channel.id.toString(),
      name: channel.name,
      number: channel.number,
      logo: channel.logo,
      category: channel.category,
      popularity: channel.popularity
    } as any
  });

  // Handle channel click - if in expanded mode, set as hero; otherwise open modal
  const handleChannelClick = (channel: ChannelInfo, index: number) => {
    if (sectionIsExpanded) {
      // If already the hero channel, open modal on second click
      if (index === heroChannelIndex) {
        onChannelClick(channel);
      } else {
        // First click: Set as hero channel
        setHeroChannelIndex(index);
      }
    } else {
      // When not expanded, open modal normally
      onChannelClick(channel);
    }
  };

  const renderChannelThumbnail = (channel: ChannelInfo, index: number) => {
    const searchResult = channelToSearchResult(channel);
    const brandColors = getChannelBrandColors(channel.name);
    const isHeroChannel = sectionIsExpanded && index === heroChannelIndex;
    
    // Special handling for TBS, CNN, and FOX News - use image as background to fill entire thumbnail
    if (channel.name === 'TBS' || channel.name === 'CNN' || channel.name === 'FOX News') {
      // For CNN, apply white background; for others, use the image directly
      const shouldUseWhiteBackground = channel.name === 'CNN';
      const backgroundStyle = shouldUseWhiteBackground 
        ? {
            backgroundColor: '#FFFFFF',
            backgroundImage: `url(${channel.logo})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }
        : {
            backgroundImage: `url(${channel.logo})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          };

      return (
        <div key={channel.id} className="relative group cursor-pointer p-1" onClick={() => handleChannelClick(channel, index)}>
          {/* Full Background Thumbnail */}
          <div 
            className={`relative w-32 h-48 aspect-[2/3] backdrop-blur-sm rounded-xl overflow-hidden border transition-all duration-300 group-hover:scale-[1.02] group-hover:z-10 ${
              isHeroChannel 
                ? 'border-purple-500 shadow-lg shadow-purple-500/25 scale-105' 
                : 'border-gray-700/50 hover:border-purple-500/50'
            }`}
            style={backgroundStyle}
          >
            {/* Optional overlay for better text readability if needed - skip for CNN with white background */}
            {!shouldUseWhiteBackground && (
              <div className="absolute inset-0 bg-black/10"></div>
            )}
            
            {/* Live indicator */}
            <div className="absolute top-2 left-2">
              <div className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>LIVE</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Standard rendering for all other channels
    const backgroundStyle = {
      backgroundColor: hexToRgba(brandColors.backgroundColor, 0.9)
    };
    
    return (
      <div key={channel.id} className="relative group cursor-pointer p-1" onClick={() => handleChannelClick(channel, index)}>
        {/* Channel Logo Thumbnail */}
        <div 
          className={`relative w-32 h-48 aspect-[2/3] backdrop-blur-sm rounded-xl overflow-hidden border transition-all duration-300 group-hover:scale-[1.02] group-hover:z-10 ${
            isHeroChannel 
              ? 'border-purple-500 shadow-lg shadow-purple-500/25 scale-105' 
              : 'border-gray-700/50 hover:border-purple-500/50'
          }`}
          style={backgroundStyle}
        >
          <img
            src={channel.logo}
            alt={channel.name}
            className="w-full h-full object-contain p-6"
            onError={(e) => {
              // Fallback to channel name if logo fails to load
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          {/* Fallback display */}
          <div 
            className="hidden absolute inset-0 items-center justify-center"
            style={backgroundStyle}
          >
            <span 
              className="font-medium text-sm text-center px-2"
              style={{ color: brandColors.textColor }}
            >
              {channel.name}
            </span>
          </div>
          
          {/* Live indicator */}
          <div className="absolute top-2 left-2">
            <div className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render hero section for expanded mode
  const renderHeroSection = (channel: ChannelInfo) => {
    const brandColors = getChannelBrandColors(channel.name);
    
    return (
      <div className="relative w-full h-80 mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/20 to-black">
        {/* Background */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundColor: hexToRgba(brandColors.backgroundColor, 0.3),
            backgroundImage: `url(${channel.logo})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        {/* Content */}
        <div className="relative h-full flex items-center justify-between p-8">
          {/* Left side - Show info */}
          <div className="flex-1 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>LIVE NOW</span>
              </div>
              <span className="text-gray-300 text-sm">Channel {channel.number}</span>
            </div>
            
            <h2 className="text-4xl font-bold mb-2">{channel.currentShow?.title || 'Live Programming'}</h2>
            <p className="text-gray-300 text-lg mb-4 max-w-2xl">
              {channel.currentShow?.description || `Live programming on ${channel.name}`}
            </p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-400 mb-6">
              <span>{channel.currentShow?.startTime} - {channel.currentShow?.endTime}</span>
              <span>•</span>
              <span>{channel.category}</span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <button
                className="flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                onClick={(e) => {
                  e.stopPropagation();
                  onChannelClick(channel);
                }}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Watch Now</span>
              </button>
              
              <button
                className="flex items-center space-x-2 bg-black/50 text-white px-6 py-3 rounded-xl font-semibold hover:bg-black/70 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 border border-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  // Could open channel info modal or guide
                  console.log('More info for channel:', channel.name);
                }}
              >
                <Info className="w-5 h-5" />
                <span>More Info</span>
              </button>
              
              <button
                className="flex items-center justify-center w-12 h-12 bg-black/50 text-white rounded-xl hover:bg-black/70 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 border border-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  // Could add to favorites
                  console.log('Add to favorites:', channel.name);
                }}
              >
                <Star className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Right side - Channel logo */}
          <div className="flex-shrink-0 ml-8">
            <div 
              className="w-32 h-32 rounded-2xl flex items-center justify-center border border-gray-700/50"
              style={{ backgroundColor: hexToRgba(brandColors.backgroundColor, 0.9) }}
            >
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-full h-full object-contain p-4"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const channels = getChannelsForUser();
  const filteredChannels = applyChannelFilter(channels);
  const heroChannel = filteredChannels[heroChannelIndex];

  return (
    <StandardizedSectionContainer
      sectionId="on-now"
      title="On Now"
      items={filteredChannels.map(channelToSearchResult)}
      variant="live"
      expandable={true}
      enableHeroMode={true}
      currentSlide={heroChannelIndex}
      onSlideChange={(index) => {
        console.log('Setting hero channel index to:', index);
        setHeroChannelIndex(index);
      }}
      showSeeMore={filteredChannels.length > 6}
      onSeeMoreClick={() => {
        // Handle see more click - could navigate to dedicated channels page
        console.log('See more channels clicked');
      }}
      sectionType="live-tv"
      showNavigationDots={false}
      heroContent={sectionIsExpanded && heroChannel ? renderHeroSection(heroChannel) : undefined}
      onItemClick={(item) => {
        // Find the channel by item id and call onChannelClick
        const channel = filteredChannels.find(c => c.id === item.id);
        if (channel) {
          onChannelClick(channel);
        }
      }}
      renderItem={(item, index) => {
        const channelIndex = filteredChannels.findIndex(c => c.id === item.id);
        return channelIndex >= 0 ? renderChannelThumbnail(filteredChannels[channelIndex], channelIndex) : null;
      }}
      emptyContent={
        <div className="text-center py-8">
          <p className="text-gray-400 mb-2">No channels available</p>
          <p className="text-gray-500 text-sm">
            Configure your TV provider in Settings to see available channels
          </p>
        </div>
      }
    />
  );
};

export default LiveChannelsSection; 