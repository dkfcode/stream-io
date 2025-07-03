import React from 'react';
import { Eye, History, Database } from 'lucide-react';

interface PrivacyPanelProps {
  onBack: () => void;
}

const PrivacyPanel: React.FC<PrivacyPanelProps> = ({ onBack }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <button className="w-full p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center space-x-3 hover:bg-gray-800/70 transition-colors">
            <Eye className="w-5 h-5 text-purple-500" />
            <div className="flex-1 text-left">
              <p className="text-white font-medium">Visibility</p>
              <p className="text-sm text-gray-400">Control who can see your watchlist</p>
            </div>
          </button>

          <button className="w-full p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center space-x-3 hover:bg-gray-800/70 transition-colors">
            <History className="w-5 h-5 text-purple-500" />
            <div className="flex-1 text-left">
              <p className="text-white font-medium">Watch History</p>
              <p className="text-sm text-gray-400">Manage your viewing history</p>
            </div>
          </button>

          <button className="w-full p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center space-x-3 hover:bg-gray-800/70 transition-colors">
            <Database className="w-5 h-5 text-purple-500" />
            <div className="flex-1 text-left">
              <p className="text-white font-medium">Data & Storage</p>
              <p className="text-sm text-gray-400">Manage your data and storage settings</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPanel;