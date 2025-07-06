import React, { useState } from 'react';
import { 
  Trophy, 
  Newspaper, 
  Camera, 
  Mic, 
  Music, 
  Gamepad2, 
  Heart, 
  Cloud, 
  Car, 
  Church, 
  Calendar as CalendarIcon 
} from 'lucide-react';
import StandardizedSectionContainer from '../shared/StandardizedSectionContainer';
import StandardizedThumbnail from '../shared/StandardizedThumbnail';
import { useI18n } from '../../constants/i18n';
import type { SearchResult } from '../../types/tmdb';

interface LiveFeaturedTabProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  showFilterDropdown: boolean;
  onShowFilterDropdown: (show: boolean) => void;
}

// Channel data for "On Now" section - Complete channel lineup (using local logos where available)
const LIVE_CHANNELS = [
  { id: 1, name: 'ABC', logo: '/images/logos/abc/logo.png' }, // Local logo
  { id: 2, name: 'CBS', logo: '/images/logos/cbs/logo.png' }, // Local logo
  { id: 3, name: 'CNN', logo: '/images/logos/cnn/logo.png' }, // Local logo
  { id: 4, name: 'Disney Channel', logo: '/images/logos/disney-channel/logo.png' }, // Local logo
  { id: 5, name: 'ESPN', logo: '/images/logos/espn/logo.png' }, // Local logo
  { id: 6, name: 'Food Network', logo: '/images/logos/food-network/logo.png' }, // Local logo
  { id: 7, name: 'FOX', logo: '/images/logos/fox/logo.png' }, // Local logo
  { id: 8, name: 'Fox News', logo: '/images/logos/fox-news/logo.jpg' }, // Local logo
  { id: 9, name: 'Hallmark Channel', logo: '/images/logos/hallmark-channel/logo.png' }, // Local logo
  { id: 10, name: 'ION Television', logo: '/images/logos/ion-television/logo.png' }, // Local logo
  { id: 11, name: 'Lifetime', logo: '/images/logos/lifetime/logo.png' }, // Local logo
  { id: 12, name: 'NBC', logo: '/images/logos/nbc/logo.png' }, // Local logo
  { id: 13, name: 'Nickelodeon', logo: '/images/logos/nickelodeon/logo.png' }, // Local logo
  { id: 14, name: 'TBS', logo: '/images/logos/tbs/logo.jpg' }, // Local logo
  { id: 15, name: 'TNT', logo: '/images/logos/tnt/logo.jpg' }, // Local logo
];

// Category buttons configuration
const CATEGORY_BUTTONS = [
  { id: 'sports', name: 'Sports', icon: Trophy, color: 'purple' },
  { id: 'news', name: 'News', icon: Newspaper, color: 'blue' },
  { id: 'reality', name: 'Reality', icon: Camera, color: 'pink' },
  { id: 'talk-shows', name: 'Talk Shows', icon: Mic, color: 'green' },
  { id: 'music', name: 'Music', icon: Music, color: 'red' },
  { id: 'gaming', name: 'Gaming', icon: Gamepad2, color: 'indigo' },
  { id: 'lifestyle', name: 'Lifestyle', icon: Heart, color: 'rose' },
  { id: 'weather', name: 'Weather', icon: Cloud, color: 'sky' },
  { id: 'automotive', name: 'Automotive', icon: Car, color: 'orange' },
  { id: 'religious', name: 'Religious', icon: Church, color: 'amber' },
  { id: 'live-events', name: 'Live Events', icon: CalendarIcon, color: 'violet' },
];

// Generate sports content for subcategories
function generateSportsContent(sport: string): SearchResult[] {
  const teams = {
    Basketball: ['Lakers vs Warriors', 'Celtics vs Heat', 'Nuggets vs Suns', 'Bucks vs 76ers'],
    Football: ['Chiefs vs Bills', 'Cowboys vs Giants', 'Packers vs Bears', 'Rams vs 49ers'],
    Baseball: ['Yankees vs Red Sox', 'Dodgers vs Giants', 'Astros vs Rangers', 'Braves vs Mets'],
    Soccer: ['Manchester United vs Liverpool', 'Real Madrid vs Barcelona', 'Arsenal vs Chelsea', 'Bayern vs Dortmund'],
    Hockey: ['Rangers vs Bruins', 'Lightning vs Panthers', 'Oilers vs Flames', 'Kings vs Sharks'],
    Tennis: ['Wimbledon Finals', 'US Open', 'French Open', 'Australian Open'],
    Golf: ['Masters Tournament', 'PGA Championship', 'US Open Golf', 'The Open Championship'],
    MMA: ['UFC 300', 'UFC Fight Night', 'Bellator Championship', 'ONE Championship']
  };

  return (teams[sport as keyof typeof teams] || []).map((title, index) => ({
    id: Math.random() * 1000000,
    title,
    name: title,
    poster_path: `https://image.tmdb.org/t/p/w500/sample${index + 1}.jpg`,
    backdrop_path: `https://image.tmdb.org/t/p/w1280/sample${index + 1}.jpg`,
    media_type: 'tv' as const,
    overview: `Live ${sport} match: ${title}`,
    description: `Watch live ${sport} action`,
    release_date: new Date().toISOString(),
    first_air_date: new Date().toISOString(),
    vote_average: 8.0 + Math.random() * 2,
    popularity: 70 + Math.random() * 30,
  }));
}

// Sports subcategories
const SPORTS_SUBCATEGORIES = [
  { id: 'basketball', name: 'Basketball', content: generateSportsContent('Basketball') },
  { id: 'football', name: 'Football', content: generateSportsContent('Football') },
  { id: 'baseball', name: 'Baseball', content: generateSportsContent('Baseball') },
  { id: 'soccer', name: 'Soccer', content: generateSportsContent('Soccer') },
  { id: 'hockey', name: 'Hockey', content: generateSportsContent('Hockey') },
  { id: 'tennis', name: 'Tennis', content: generateSportsContent('Tennis') },
  { id: 'golf', name: 'Golf', content: generateSportsContent('Golf') },
  { id: 'mma', name: 'MMA', content: generateSportsContent('MMA') },
];

// Generate upcoming content
function generateUpcomingContent(): SearchResult[] {
  const upcomingShows = [
    'Interstellar', 'Fight Club', 'The Shawshank Redemption', 'Harry Potter', 'Titanic', 
    'Star Wars', 'Jurassic World', 'Jurassic Park', 'Blade Runner 2049', 'The Matrix'
  ];

  return upcomingShows.map((title, index) => ({
    id: 2000000 + index,
    title,
    name: title,
    poster_path: `https://image.tmdb.org/t/p/w500/sample${index + 1}.jpg`,
    backdrop_path: `https://image.tmdb.org/t/p/w1280/sample${index + 1}.jpg`,
    media_type: 'movie' as const,
    overview: `Coming up: ${title}`,
    description: `Don't miss ${title} coming up next`,
    release_date: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    first_air_date: new Date(Date.now() + 3600000).toISOString(),
    vote_average: 7.5 + Math.random() * 2.5,
    popularity: 60 + Math.random() * 40,
  }));
}

// Convert channel to SearchResult for compatibility
function channelToSearchResult(channel: any): SearchResult {
  return {
    id: channel.id,
    title: channel.name,
    name: channel.name,
    poster_path: channel.logo,
    backdrop_path: channel.logo,
    media_type: 'tv' as const,
    overview: `Watch ${channel.name} live`,
    description: `Live broadcast from ${channel.name}`,
    release_date: new Date().toISOString(),
    first_air_date: new Date().toISOString(),
    vote_average: 8.0,
    popularity: 90,
  };
}

const LiveFeaturedTab: React.FC<LiveFeaturedTabProps> = ({
  selectedFilter
}) => {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sectionHeroIndexes, setSectionHeroIndexes] = useState<Record<string, number>>({});

  // Convert channels to SearchResult format
  const onNowContent = LIVE_CHANNELS.map(channelToSearchResult);
  const comingUpContent = generateUpcomingContent();

  const renderCategoryButtons = () => {
    return (
      <div className="mb-8">
        <div className="flex overflow-x-auto gap-3 px-4 pb-4 scrollbar-hide">
          {CATEGORY_BUTTONS.map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                className={`flex flex-col items-center space-y-2 px-4 py-3 rounded-2xl font-medium transition-all duration-200 whitespace-nowrap min-w-[80px] ${
                  selectedCategory === category.id
                    ? 'bg-purple-500/20 text-purple-400 shadow-lg border border-purple-500/30'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80 hover:text-white border border-gray-600/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedCategory === category.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-700/60 text-gray-300'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Custom render function for channel thumbnails to match home tab styling
  const renderChannelThumbnail = (item: SearchResult, index: number) => {
    const channel = LIVE_CHANNELS.find(ch => ch.id === item.id);
    if (!channel) {
      return (
        <StandardizedThumbnail
          key={item.id}
          item={item}
          size="md"
          onClick={() => {}}
          showRating={false}
          showMediaType={false}
          showPlatformBadge={false}
        />
      );
    }

    // Special handling for TBS - use entire image as thumbnail
    if (channel.name === 'TBS') {
      return (
        <div key={item.id} className="relative group w-32 h-48 flex-shrink-0">
          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105">
            {/* Live indicator */}
            <div className="absolute top-2 left-2 flex items-center space-x-1 bg-red-500 px-2 py-1 rounded-full text-white text-xs font-medium z-10">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
            
            {/* TBS image as full thumbnail */}
            <img 
              src={channel.logo} 
              alt={channel.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallbackDiv = document.createElement('div');
                fallbackDiv.className = 'w-full h-full bg-gray-800 flex items-center justify-center text-white font-bold text-center text-sm';
                fallbackDiv.textContent = channel.name;
                target.parentNode?.appendChild(fallbackDiv);
              }}
            />
          </div>
        </div>
      );
    }

    // Special handling for Fox News - use entire image as thumbnail
    if (channel.name === 'Fox News') {
      return (
        <div key={item.id} className="relative group w-32 h-48 flex-shrink-0">
          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105">
            {/* Live indicator */}
            <div className="absolute top-2 left-2 flex items-center space-x-1 bg-red-500 px-2 py-1 rounded-full text-white text-xs font-medium z-10">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
            
            {/* Fox News image as full thumbnail */}
            <img 
              src={channel.logo} 
              alt={channel.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallbackDiv = document.createElement('div');
                fallbackDiv.className = 'w-full h-full bg-gray-800 flex items-center justify-center text-white font-bold text-center text-sm';
                fallbackDiv.textContent = channel.name;
                target.parentNode?.appendChild(fallbackDiv);
              }}
            />
          </div>
        </div>
      );
    }

    // Special handling for TNT - use entire image as thumbnail
    if (channel.name === 'TNT') {
      return (
        <div key={item.id} className="relative group w-32 h-48 flex-shrink-0">
          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105">
            {/* Live indicator */}
            <div className="absolute top-2 left-2 flex items-center space-x-1 bg-red-500 px-2 py-1 rounded-full text-white text-xs font-medium z-10">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
            
            {/* TNT image as full thumbnail */}
            <img 
              src={channel.logo} 
              alt={channel.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallbackDiv = document.createElement('div');
                fallbackDiv.className = 'w-full h-full bg-gray-800 flex items-center justify-center text-white font-bold text-center text-sm';
                fallbackDiv.textContent = channel.name;
                target.parentNode?.appendChild(fallbackDiv);
              }}
            />
          </div>
        </div>
      );
    }

    // Special handling for Food Network - crop out transparent padding completely
    if (channel.name === 'Food Network') {
      return (
        <div key={item.id} className="relative group w-32 h-48 flex-shrink-0">
          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105 bg-red-600">
            {/* Live indicator */}
            <div className="absolute top-2 left-2 flex items-center space-x-1 bg-red-500 px-2 py-1 rounded-full text-white text-xs font-medium z-10">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
            
            {/* Food Network image - centered without cropping */}
            <div className="absolute inset-0 flex items-center justify-center p-2">
              <img 
                src={channel.logo} 
                alt={channel.name}
                className="max-w-full max-h-full object-contain filter drop-shadow-lg"
                style={{ maxWidth: '85%', maxHeight: '75%' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallbackDiv = document.createElement('div');
                  fallbackDiv.className = 'w-full h-full bg-red-600 flex items-center justify-center text-white font-bold text-center text-sm';
                  fallbackDiv.textContent = channel.name;
                  target.parentNode?.appendChild(fallbackDiv);
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={item.id} className="relative group w-32 h-48 flex-shrink-0">
        <div className={`relative w-full h-full rounded-xl overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105 ${getChannelBackgroundClass(channel.name)}`}>
          {/* Live indicator */}
          <div className="absolute top-2 left-2 flex items-center space-x-1 bg-red-500 px-2 py-1 rounded-full text-white text-xs font-medium z-10">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>LIVE</span>
          </div>
          
          {/* Channel logo */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <img 
              src={channel.logo} 
              alt={channel.name}
              className="max-w-full max-h-full object-contain filter drop-shadow-lg"
              style={{ maxWidth: '80%', maxHeight: '60%' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallbackDiv = document.createElement('div');
                fallbackDiv.className = 'text-white font-bold text-center text-sm';
                fallbackDiv.textContent = channel.name;
                target.parentNode?.appendChild(fallbackDiv);
              }}
            />
          </div>
        </div>
      </div>
    );
  };

    const renderSection = (
    title: string,
    items: SearchResult[],
    sectionId: string,
    showSeeMore: boolean = true
  ) => {
    if (items.length === 0) return null;

    // Special handling for "On Now" section with channel thumbnails
    const renderItem = sectionId === 'on-now' 
      ? renderChannelThumbnail
      : (item: SearchResult, index: number) => (
          <StandardizedThumbnail
            key={item.id}
            item={item}
            size="md"
            onClick={() => {}}
          />
        );

    return (
      <StandardizedSectionContainer
        key={sectionId}
        title={title}
        items={items}
        sectionId={sectionId}
        expandable={true}
        enableHeroMode={true}
        showSeeMore={showSeeMore}
        onSeeMoreClick={() => {}}
        currentSlide={sectionHeroIndexes[sectionId] || 0}
        onSlideChange={(index: number) => {
          setSectionHeroIndexes(prev => ({ ...prev, [sectionId]: index }));
        }}
        className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-purple-500/20 shadow-2xl transition-all duration-500"
        renderItem={renderItem}
      />
    );
  };

  // Helper function to get channel background colors
  const getChannelBackgroundClass = (channelName: string) => {
    const backgrounds = {
      'ABC': 'bg-black',
      'CBS': 'bg-blue-700',
      'CNN': 'bg-white',
      'Disney Channel': 'bg-blue-600',
      'ESPN': 'bg-white',
      'Food Network': 'bg-red-600',
      'FOX': 'bg-black',
      'Fox News': 'bg-blue-800',
      'Hallmark Channel': 'bg-purple-600',
      'ION Television': 'bg-blue-600',
      'Lifetime': 'bg-red-600',
      'NBC': 'bg-blue-500',
      'Nickelodeon': 'bg-orange-500',
      'TBS': 'bg-blue-800',
      'TNT': 'bg-black'
    };
    return backgrounds[channelName as keyof typeof backgrounds] || 'bg-gray-700';
  };

  const renderSportsSubcategories = () => {
    if (selectedCategory !== 'sports') return null;

    return SPORTS_SUBCATEGORIES.map(subcategory => 
      renderSection(subcategory.name, subcategory.content, `sports-${subcategory.id}`, true)
    );
  };

  return (
    <div className="w-full px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="space-y-8">
        {/* Main sections - always show */}
        {renderSection("On Now", onNowContent, "on-now", true)}
        {renderSection("Coming Up", comingUpContent, "coming-up", true)}
        
        {/* Category filter buttons */}
        {renderCategoryButtons()}
        
        {/* Sports subcategories when sports is selected */}
        {renderSportsSubcategories()}
      </div>
    </div>
  );
};

export default LiveFeaturedTab; 