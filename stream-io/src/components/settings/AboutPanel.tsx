import React from 'react';
import { Github, Twitter, Globe, Heart } from 'lucide-react';
import { useI18n } from '../../constants/i18n';

interface AboutPanelProps {
  onClose?: () => void;
}

const AboutPanel: React.FC<AboutPanelProps> = () => {
  const { t } = useI18n();
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-2">StreamGuide</h3>
            <p className="text-gray-400">{t('about.version')}</p>
          </div>

          <div className="space-y-4">
            <button className="w-full p-4 bg-gray-800 rounded-lg flex items-center space-x-3 hover:bg-gray-700 transition-colors">
              <Github className="w-5 h-5 text-purple-500" />
              <div className="flex-1 text-left">
                <p className="text-white font-medium">{t('about.github')}</p>
                <p className="text-sm text-gray-400">{t('about.github_description')}</p>
              </div>
            </button>

            <button className="w-full p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center space-x-3 hover:bg-gray-800/70 transition-colors">
              <Twitter className="w-5 h-5 text-purple-500" />
              <div className="flex-1 text-left">
                <p className="text-white font-medium">{t('about.follow_us')}</p>
                <p className="text-sm text-gray-400">@streamguide</p>
              </div>
            </button>

            <button className="w-full p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center space-x-3 hover:bg-gray-800/70 transition-colors">
              <Globe className="w-5 h-5 text-purple-500" />
              <div className="flex-1 text-left">
                <p className="text-white font-medium">{t('about.visit_website')}</p>
                <p className="text-sm text-gray-400">streamguide.app</p>
              </div>
            </button>

            <button className="w-full p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center space-x-3 hover:bg-gray-800/70 transition-colors">
              <Heart className="w-5 h-5 text-purple-500" />
              <div className="flex-1 text-left">
                <p className="text-white font-medium">{t('about.support_us')}</p>
                <p className="text-sm text-gray-400">{t('about.support_description')}</p>
              </div>
            </button>
          </div>

          <div className="text-center text-gray-400 text-sm">
            <p>{t('about.made_with_love')}</p>
            <p className="mt-2">{t('about.copyright')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPanel;