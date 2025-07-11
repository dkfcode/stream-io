import React from 'react';
import { Home, Radio, Tv, Bookmark } from 'lucide-react';
import { useI18n } from '../constants/i18n';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { t } = useI18n();
  
  return (
    <nav className="w-full bg-toolbar border-t border-black/20 z-50">
      <div className="container mx-auto px-4 sm:px-6 h-full">
        <div className="flex justify-around items-center" style={{ height: '60px' }}>
          <button 
            onClick={() => onTabChange('home')}
            className={`nav-button flex flex-col items-center justify-center space-y-1 px-3 py-2 transition-all duration-200 min-h-[44px] min-w-[44px] ${
              activeTab === 'home' 
                ? 'text-purple-400' 
                : 'text-gray-400 hover:text-purple-400'
            }`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium">{t('navigation.home')}</span>
          </button>
          <button 
            onClick={() => onTabChange('live')}
            className={`nav-button flex flex-col items-center justify-center space-y-1 px-3 py-2 transition-all duration-200 min-h-[44px] min-w-[44px] ${
              activeTab === 'live' 
                ? 'text-purple-400' 
                : 'text-gray-400 hover:text-purple-400'
            }`}
          >
            <Radio className="h-6 w-6" />
            <span className="text-xs font-medium">{t('navigation.live')}</span>
          </button>
          <button 
            onClick={() => onTabChange('watchlist')}
            className={`nav-button flex flex-col items-center justify-center space-y-1 px-3 py-2 transition-all duration-200 min-h-[44px] min-w-[44px] ${
              activeTab === 'watchlist' 
                ? 'text-purple-400' 
                : 'text-gray-400 hover:text-purple-400'
            }`}
          >
            <Bookmark className="h-6 w-6" />
            <span className="text-xs font-medium">{t('navigation.list')}</span>
          </button>
          <button 
            onClick={() => onTabChange('remote')}
            className={`nav-button flex flex-col items-center justify-center space-y-1 px-3 py-2 transition-all duration-200 min-h-[44px] min-w-[44px] ${
              activeTab === 'remote' 
                ? 'text-purple-400' 
                : 'text-gray-400 hover:text-purple-400'
            }`}
          >
            <Tv className="h-6 w-6" />
            <span className="text-xs font-medium">{t('navigation.remote')}</span>
          </button>
        </div>
      </div>
      {/* iOS Safe Area Bottom Padding */}
      <div className="safe-area-inset-bottom"></div>
    </nav>
  );
};

export default Navigation;