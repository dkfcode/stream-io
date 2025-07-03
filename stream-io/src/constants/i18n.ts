// Simple i18n system - can be expanded later with proper localization
export interface Translation {
  [key: string]: string;
}

export const translations: { [locale: string]: Translation } = {
  en: {
    // Navigation
    'navigation.home': 'Home',
    'navigation.live': 'Live',
    'navigation.list': 'List',
    'navigation.remote': 'Remote',
    'nav.home': 'Home',
    'nav.search': 'Search',
    'nav.watchlist': 'Watchlist',
    'nav.live': 'Live TV',
    'nav.settings': 'Settings',
    
    // Content sections
    'content.trending_near_you': 'Trending Near You',
    'content.curated_for_you': 'Curated For You',
    'content.leaving_soon': 'Leaving Soon',
    'content.newly_added': 'Newly Added',
    'content.because_you_added': 'Because you added',
    'content.top_movies': 'Top Movies',
    'content.top_shows': 'Top Shows',
    'content.new_releases': 'New Releases',
    'content.random_picks': 'Random Picks',
    'content.bingeworthy': 'Bingeworthy',
    'content.top_searches': 'Top Searches',
    'content.hidden_gems': 'Hidden Gems',
    'content.watchTrailer': 'Watch Trailer',
    'content.moreInfo': 'More Info',
    'content.addToList': 'Add to List',
    'content.rating': 'Rating',
    'content.runtime': 'Runtime',
    'content.genre': 'Genre',
    'content.releaseDate': 'Release Date',
    
    // Common UI
    'ui.loading': 'Loading...',
    'ui.error': 'Error',
    'ui.retry': 'Retry',
    'ui.cancel': 'Cancel',
    'ui.save': 'Save',
    'ui.close': 'Close',
    'ui.back': 'Back',
    
    // Search
    'search.placeholder': 'Search movies, shows, actors...',
    'search.noResults': 'No results found',
    'search.results': 'Search Results',
    
    // Watchlist
    'watchlist.addToWatchlist': 'Add to Watchlist',
    'watchlist.removeFromWatchlist': 'Remove from Watchlist',
    'watchlist.favorites': 'Favorites',
    'watchlist.watchLater': 'Watch Later',
    'watchlist.watched': 'Watched',
    
    // Live TV
    'live.guide': 'TV Guide',
    'live.channels': 'Channels',
    'live.featured': 'Featured',
    'live.schedule': 'Schedule',
    
    // Settings
    'settings.title': 'Settings',
    'settings.account': 'Account Settings',
    'settings.streaming': 'Stream Settings',
    'settings.app_settings': 'App Settings',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Privacy',
    'settings.reset': 'Reset App',
    'settings.about': 'About',
    'settings.help': 'Help & Support',
    'settings.live_services': 'Live Services',
    'settings.preferences': 'Preferences',
    
    // Welcome
    'welcome.title': 'Welcome to StreamGuide',
    'welcome.subtitle': 'Your personalized streaming companion',
    'welcome.universal_search': 'Universal Search',
    'welcome.live_on_demand': 'Live & On-Demand',
    'welcome.personalized': 'Personalized',
    'welcome.get_started': 'Get Started',
    
    // Remote
    'remote.connecting': 'Connecting...',
    'remote.connected': 'Connected',
    'remote.disconnected': 'Disconnected',
    'remote.volume_up': 'Volume Up',
    'remote.volume_down': 'Volume Down',
    'remote.back': 'Back',
    'remote.home': 'Home',
    'remote.up': 'Up',
    'remote.down': 'Down',
    'remote.left': 'Left',
    'remote.right': 'Right',
    'remote.select': 'Select',
    'remote.play_pause': 'Play/Pause',
    'remote.next': 'Next',
    'remote.previous': 'Previous',
    'remote.touchpad': 'Touchpad',
    'remote.keyboard': 'Keyboard',
    'remote.apps': 'Apps',
    'remote.touchpad_description': 'Swipe and tap with one finger to select content on your TV',
    
    // Time
    'time.now': 'Now',
    'time.next': 'Next',
    'time.later': 'Later',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.try_again': 'Try again',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.off': 'Off',
  }
};

// Simple translation function
export const t = (key: string, locale: string = 'en'): string => {
  return translations[locale]?.[key] || key;
};

// Hook for i18n (simplified version)
export const useI18n = () => {
  const currentLocale = 'en'; // For now, hardcoded to English
  
  return {
    t: (key: string) => t(key, currentLocale),
    locale: currentLocale
  };
}; 