import React, { useState } from 'react';
import { X, ChevronRight, User, Settings as SettingsIcon, Bell, Shield, RotateCcw, Info, Tv, ArrowLeft } from 'lucide-react';
import { useAuth } from '../stores';

// Import individual panel components
import AccountPanel from './settings/AccountPanel';
import StreamingPanel from './settings/StreamingPanel';
import AppSettingsPanel from './settings/AppSettingsPanel';
import NotificationsPanel from './settings/NotificationsPanel';
import PrivacyPanel from './settings/PrivacyPanel';
import ResetCachePanel from './settings/ResetCachePanel';
import AboutPanel from './settings/AboutPanel';
import AuthModal from './AuthModal';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingSection = 
  | 'main' 
  | 'account' 
  | 'streaming' 
  | 'app-settings' 
  | 'notifications' 
  | 'privacy' 
  | 'reset' 
  | 'about';

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [currentSection, setCurrentSection] = useState<SettingSection>('main');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleBack = () => {
    setCurrentSection('main');
  };

  const handleAccountClick = () => {
    if (user) {
      // User is authenticated, navigate to account panel
      setCurrentSection('account');
    } else {
      // User is not authenticated, open auth modal
      setShowAuthModal(true);
    }
  };

  const renderMainMenu = () => {
    const menuItems = [
      {
        id: 'account' as SettingSection,
        icon: User,
        title: user ? 'Account Settings' : 'Sign in or Create an Account',
        description: user ? `Signed in as ${user.email}` : 'Access your personalized settings',
        showChevron: true,
        onClick: handleAccountClick
      },
      {
        id: 'streaming' as SettingSection,
        icon: Tv,
        title: 'Streaming Services',
        description: 'Manage your streaming services and preferences',
        showChevron: true
      },
      {
        id: 'app-settings' as SettingSection,
        icon: SettingsIcon,
        title: 'App Settings',
        description: 'Customize appearance, behavior, and preferences',
        showChevron: true
      },
      {
        id: 'notifications' as SettingSection,
        icon: Bell,
        title: 'Notifications',
        description: 'Configure alerts and reminder preferences',
        showChevron: true
      },
      {
        id: 'privacy' as SettingSection,
        icon: Shield,
        title: 'Privacy & Security',
        description: 'Control data sharing and privacy settings',
        showChevron: true
      },
      {
        id: 'reset' as SettingSection,
        icon: RotateCcw,
        title: 'Reset & Cache',
        description: 'Clear cache and reset application data',
        showChevron: true
      },
      {
        id: 'about' as SettingSection,
        icon: Info,
        title: 'About',
        description: 'App information, support, and legal',
        showChevron: true
      }
    ];

    return (
      <div className="space-y-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => item.onClick ? item.onClick() : setCurrentSection(item.id)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/70 transition-all duration-200 group border border-gray-700/30 hover:border-gray-600/50"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all duration-200">
                  <IconComponent className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold text-base group-hover:text-gray-100 transition-colors">{item.title}</h3>
                  <p className="text-gray-400 text-xs group-hover:text-gray-300 transition-colors">{item.description}</p>
                </div>
              </div>
              {item.showChevron && (
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-all duration-200 group-hover:translate-x-1" />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'account':
        return <AccountPanel onBack={handleBack} />;
      case 'streaming':
        return <StreamingPanel onBack={handleBack} />;
      case 'app-settings':
        return <AppSettingsPanel onBack={handleBack} />;
      case 'notifications':
        return <NotificationsPanel onBack={handleBack} />;
      case 'privacy':
        return <PrivacyPanel onBack={handleBack} />;
      case 'reset':
        return <ResetCachePanel onBack={handleBack} />;
      case 'about':
        return <AboutPanel onClose={handleBack} />;
      default:
        return renderMainMenu();
    }
  };

  const getSectionTitle = () => {
    switch (currentSection) {
      case 'account':
        return 'Account';
      case 'streaming':
        return 'Streaming';
      case 'app-settings':
        return 'App Settings';
      case 'notifications':
        return 'Notifications';
      case 'privacy':
        return 'Privacy';
      case 'reset':
        return 'Reset';
      case 'about':
        return 'About';
      default:
        return 'Settings';
    }
  };

  return (
    <div className="fixed inset-0 z-[110]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Settings Panel - extends over bottom navigation */}
      <div className={`
        fixed top-0 left-0 bottom-0 w-full max-w-md shadow-2xl border-r border-gray-700/50
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{
        background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.15) 0%, rgba(59, 7, 100, 0.08) 30%, #000000 60%)'
      }}>
        {/* Header - Match toolbar height */}
        <div className="flex items-center justify-between toolbar-height toolbar-padding border-b border-purple-500/20 bg-black/20 backdrop-blur-sm">
          <div className="flex justify-start pl-6 pt-1" style={{ width: '64px' }}>
            {currentSection !== 'main' && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-[#1a1d24] rounded-xl transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-6 h-6 text-gray-300 hover:text-white transition-all duration-200 drop-shadow-[0_0_3px_rgba(255,255,255,0.3)] hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
              </button>
            )}
          </div>
          
          <div className="flex justify-center flex-1 pt-1">
            <h2 className="text-xl font-semibold">
              {currentSection === 'main' ? 'Settings' : getSectionTitle()}
            </h2>
          </div>
          
          <div className="flex justify-end pr-6 pt-1" style={{ width: '64px' }}>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#1a1d24] rounded-xl transition-colors"
              aria-label="Close settings"
            >
              <X className="w-6 h-6 text-gray-300 hover:text-white transition-all duration-200 drop-shadow-[0_0_3px_rgba(255,255,255,0.3)] hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
            </button>
          </div>
        </div>

        {/* Content - Full height minus header */}
        <div className="overflow-y-auto" style={{ height: 'calc(100vh - 60px)' }}>
          {currentSection === 'main' ? (
            <div className="p-4">
              {renderCurrentSection()}
            </div>
          ) : (
            renderCurrentSection()
          )}
        </div>
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        initialMode="signin"
      />
    </div>
  );
};

export default SettingsPanel;