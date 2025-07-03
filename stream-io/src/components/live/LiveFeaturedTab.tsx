import React, { useState } from 'react';
import { Target, Newspaper, Camera, Mic, Music, Gamepad2, Heart, Cloud, Car, Church, Calendar as CalendarIcon } from 'lucide-react';
import StandardizedSectionContainer from '../shared/StandardizedSectionContainer';
import { useI18n } from '../../constants/i18n';
import type { SearchResult } from '../../types/tmdb';

interface LiveFeaturedTabProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  showFilterDropdown: boolean;
  onShowFilterDropdown: (show: boolean) => void;
}

// Channel data for "On Now" section
const LIVE_CHANNELS = [
  { id: 1, name: 'ABC', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/ABC_2021_logo_White.png/1200px-ABC_2021_logo_White.png' },
  { id: 2, name: 'CBS', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/CBS_logo.svg/512px-CBS_logo.svg.png' },
  { id: 3, name: 'CNN', logo: 'https://download.logo.wine/logo/CNN/CNN-Logo.wine.png' },
  { id: 4, name: 'Disney Channel', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Disney_Channel_2014_Gradient.png/960px-Disney_Channel_2014_Gradient.png' },
  { id: 5, name: 'ESPN', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/512px-ESPN_wordmark.svg.png' },
  { id: 6, name: 'Food Network', logo: 'https://comcastadvertising.com/wp-content/uploads/2021/10/Food-White-Small.webp' },
  { id: 7, name: 'FOX', logo: 'https://wp-cdn.milocloud.com/cap-equity-wp/wp-content/uploads/2020/04/08180526/ox-logo-fox-tv-logo-png.png' },
  { id: 8, name: 'Fox News', logo: 'https://cdn.shopify.com/s/files/1/0558/6413/1764/files/Fox_News_Logo_Design_History_Evolution_0_1024x1024.jpg?v=1694099298' },
];

// Category buttons configuration
const CATEGORY_BUTTONS = [
  { id: 'sports', name: 'Sports', icon: Target, color: 'purple' },
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
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-black/40 text-gray-300 hover:bg-black/60 hover:text-white border border-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{category.name}</span>
              </button>
            );
          })}
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
        renderItem={(item, index) => <div key={item.id}>{item.title || item.name}</div>}
      />
    );
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