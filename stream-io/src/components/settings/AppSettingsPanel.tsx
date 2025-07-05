import React, { useState, useEffect } from 'react';
import { ArrowLeft, LayoutGrid, Play, Monitor, Globe, Volume2, MapPin, ChevronDown, Subtitles, AudioWaveform, Languages } from 'lucide-react';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { useI18n } from '../../constants/i18n';

interface AppSettingsPanelProps {
  onBack: () => void;
}

const AppSettingsPanel: React.FC<AppSettingsPanelProps> = ({ onBack }) => {
  const { preferences, updateThemeSetting } = usePreferencesStore();
  const { t } = useI18n();
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [audioLanguageDropdownOpen, setAudioLanguageDropdownOpen] = useState(false);
  const [subtitleDropdownOpen, setSubtitleDropdownOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'it', label: 'Italiano' },
    { code: 'pt', label: 'Português' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'zh', label: '中文' }
  ];

  const regions = [
    { code: 'US', label: 'United States' },
    { code: 'CA', label: 'Canada' },
    { code: 'GB', label: 'United Kingdom' },
    { code: 'AU', label: 'Australia' },
    { code: 'DE', label: 'Germany' },
    { code: 'FR', label: 'France' },
    { code: 'ES', label: 'Spain' },
    { code: 'IT', label: 'Italy' },
    { code: 'JP', label: 'Japan' },
    { code: 'KR', label: 'South Korea' },
    { code: 'CN', label: 'China' },
    { code: 'BR', label: 'Brazil' },
    { code: 'MX', label: 'Mexico' },
    { code: 'IN', label: 'India' }
  ];

  const subtitleOptions = [
    { code: 'off', label: 'Off' },
    { code: 'en', label: 'English' },
    ...languages.filter(lang => lang.code !== 'en')
  ];

  const currentLanguage = languages.find(lang => lang.code === preferences.language);
  const currentRegion = regions.find(region => region.code === preferences.region);
  const currentAudioLanguage = languages.find(lang => lang.code === preferences.preferredAudioLanguage);
  const currentSubtitle = subtitleOptions.find(sub => sub.code === preferences.preferredSubtitles);

  // Debug logging to help identify issues
  console.log('🔧 AppSettings Debug:', {
    preferences,
    currentLanguage,
    currentRegion,
    currentAudioLanguage,
    currentSubtitle
  });

  const handleSettingChange = (key: keyof typeof preferences, value: any) => {
    console.log('🔧 Setting change:', { key, value });
    updateThemeSetting(key, value);
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // ... existing code ...
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // ... existing code ...
  };

  const handleRangeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // ... existing code ...
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {/* Layout */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Monitor className="w-5 h-5 text-purple-400" />
              {t('app_settings.layout')}
            </h3>
            
            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
              <div className="flex items-center space-x-3 mb-3">
                <LayoutGrid className="w-5 h-5 text-purple-500" />
                <div className="text-left">
                  <p className="text-white font-medium">{t('app_settings.interface_density')}</p>
                  <p className="text-sm text-gray-400">{t('app_settings.interface_density_description')}</p>
                </div>
              </div>
              
              {/* Inline Density Picker */}
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    console.log('🔧 Clicked compact');
                    updateThemeSetting('interfaceDensity', 'compact');
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    preferences.interfaceDensity === 'compact'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {t('app_settings.compact')}
                </button>
                <button
                  onClick={() => {
                    console.log('🔧 Clicked standard');
                    updateThemeSetting('interfaceDensity', 'standard');
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    preferences.interfaceDensity === 'standard'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {t('app_settings.standard')}
                </button>
                <button
                  onClick={() => {
                    console.log('🔧 Clicked spacious');
                    updateThemeSetting('interfaceDensity', 'spacious');
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    preferences.interfaceDensity === 'spacious'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {t('app_settings.spacious')}
                </button>
              </div>
            </div>
          </div>

          {/* Playback */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-purple-400" />
              {t('app_settings.playback')}
            </h3>
            
            {/* Auto-play Videos */}
            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-5 h-5 text-purple-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">{t('app_settings.autoplay_videos')}</p>
                    <p className="text-sm text-gray-400">{t('app_settings.autoplay_videos_description')}</p>
                  </div>
                </div>
                
                {/* Inline Toggle */}
                <button
                  onClick={() => {
                    console.log('🔧 Clicked autoplay toggle, current value:', preferences.autoplayVideos);
                    updateThemeSetting('autoplayVideos', !preferences.autoplayVideos);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                    preferences.autoplayVideos ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.autoplayVideos ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Preferred Audio Language */}
            <div className="relative">
              <button 
                onClick={() => {
                  setAudioLanguageDropdownOpen(!audioLanguageDropdownOpen);
                  setSubtitleDropdownOpen(false);
                }}
                className="w-full p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center justify-between hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <AudioWaveform className="w-5 h-5 text-purple-500" />
                  <div className="text-left flex-1">
                    <p className="text-white font-medium">{t('app_settings.audio_language')}</p>
                    <p className="text-sm text-gray-400">{t('app_settings.audio_language_description')}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm underline decoration-purple-500">{currentAudioLanguage?.label || 'English'}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${audioLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </button>

              {audioLanguageDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        updateThemeSetting('preferredAudioLanguage', lang.code as any);
                        setAudioLanguageDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        preferences.preferredAudioLanguage === lang.code
                          ? 'bg-purple-600/20 text-purple-300'
                          : 'text-gray-300'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subtitles */}
            <div className="relative">
              <button 
                onClick={() => {
                  setSubtitleDropdownOpen(!subtitleDropdownOpen);
                  setAudioLanguageDropdownOpen(false);
                }}
                className="w-full p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center justify-between hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <Subtitles className="w-5 h-5 text-purple-500" />
                  <div className="text-left flex-1">
                    <p className="text-white font-medium">{t('app_settings.subtitles')}</p>
                    <p className="text-sm text-gray-400">{t('app_settings.subtitles_description')}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm underline decoration-purple-500">{currentSubtitle?.label || 'Off'}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${subtitleDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </button>

              {subtitleDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                  {subtitleOptions.map((option) => (
                    <button
                      key={option.code}
                      onClick={() => {
                        updateThemeSetting('preferredSubtitles', option.code as any);
                        setSubtitleDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        preferences.preferredSubtitles === option.code
                          ? 'bg-purple-600/20 text-purple-300'
                          : 'text-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Localization */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-400" />
              {t('app_settings.localization')}
            </h3>
            
            {/* Language Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setLanguageDropdownOpen(!languageDropdownOpen);
                  setRegionDropdownOpen(false);
                }}
                className="w-full p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center justify-between hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <Languages className="w-5 h-5 text-purple-500" />
                  <div className="text-left flex-1">
                    <p className="text-white font-medium">{t('app_settings.language')}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm underline decoration-purple-500">{currentLanguage?.label || 'English'}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${languageDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </button>

              {languageDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        updateThemeSetting('language', lang.code as any);
                        setLanguageDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        preferences.language === lang.code
                          ? 'bg-purple-600/20 text-purple-300'
                          : 'text-gray-300'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Region Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setRegionDropdownOpen(!regionDropdownOpen);
                  setLanguageDropdownOpen(false);
                }}
                className="w-full p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center justify-between hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <MapPin className="w-5 h-5 text-purple-500" />
                  <div className="text-left flex-1">
                    <p className="text-white font-medium">{t('app_settings.region')}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm underline decoration-purple-500">{currentRegion?.label || 'United States'}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${regionDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </button>

              {regionDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                  {regions.map((region) => (
                    <button
                      key={region.code}
                      onClick={() => {
                        updateThemeSetting('region', region.code as any);
                        setRegionDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        preferences.region === region.code
                          ? 'bg-purple-600/20 text-purple-300'
                          : 'text-gray-300'
                      }`}
                    >
                      {region.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppSettingsPanel;