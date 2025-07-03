import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, RotateCcw } from 'lucide-react';
import { usePreferences, useWatchlist, useAuth, resetUserStores } from '../../stores';

interface ResetCachePanelProps {
  onBack: () => void;
}

const ResetCachePanel: React.FC<ResetCachePanelProps> = ({ onBack }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const { watchlists } = useWatchlist();
  const { signOut } = useAuth();

  const handleResetCache = async () => {
    setIsResetting(true);
    
    try {
      // Sign out user first if authenticated
      await signOut();
      
      // Reset all user-specific Zustand stores
      resetUserStores();
      
      // Clear all localStorage items except critical ones
      const allKeys = Object.keys(localStorage);
      const appKeys = allKeys.filter(key => {
        // Clear app-specific keys but preserve critical browser data
        return !key.includes('sb-') && // Don't clear any auth-related tokens
               !key.includes('devtools') && // Don't clear dev tools
               !key.includes('__') && // Don't clear browser internals
               (key.includes('auth-storage') ||
                key.includes('ui-storage') ||
                key.includes('settings-storage') ||
                key.includes('preferences-storage') ||
                key.includes('watchlist-storage') ||
                key.includes('selected') || 
                key.includes('has') || 
                key.includes('watchlist') || 
                key.includes('search') ||
                key.includes('Lists') ||
                key.includes('provider') ||
                key.includes('broadcast') ||
                key.includes('genre') ||
                key.includes('service') ||
                key.includes('onboarding'));
      });
      
      appKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear session storage as well
      sessionStorage.clear();
      
      // Wait a moment for state updates to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate back to welcome screen by reloading the page
      // The app will detect no stored state and initialize fresh
      window.location.reload();
      
    } catch (error) {
      console.error('Error resetting app:', error);
      setIsResetting(false);
    }
  };

  const getTotalWatchlistItems = () => {
    return watchlists.reduce((total, list) => total + (list.items?.length || 0), 0);
  };

  if (showConfirmation) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center p-4 border-b border-gray-800">
          <button
            onClick={() => setShowConfirmation(false)}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors mr-2"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h2 className="text-xl font-bold text-white">Confirm Reset</h2>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <div className="bg-red-500/10 border border-red-500/20 rounded-full p-4 mb-6">
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-4">
            Reset All App Data?
          </h3>
          
          <p className="text-gray-300 mb-6 max-w-md">
            This will permanently delete all your preferences, watchlists, custom lists, and recent searches. 
            The app will restart from the welcome screen and you'll need to go through the setup process again.
          </p>
          
          <div className="space-y-3 w-full max-w-xs">
            <button
              onClick={handleResetCache}
              disabled={isResetting}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
            >
              {isResetting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Everything</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => setShowConfirmation(false)}
              disabled={isResetting}
              className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-yellow-400 font-medium mb-1">Warning</h3>
                <p className="text-gray-300 text-sm">
                  This action will permanently delete all your app data and preferences. The app will restart from the welcome screen. This cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">What will be reset:</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-300">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>All streaming service preferences</span>
              </div>
              
              <div className="flex items-center space-x-3 text-gray-300">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>Selected genres and live broadcast preferences</span>
              </div>
              
              <div className="flex items-center space-x-3 text-gray-300">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>Watchlist items ({getTotalWatchlistItems()} items)</span>
              </div>
              
              <div className="flex items-center space-x-3 text-gray-300">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>Custom watchlist collections ({watchlists.length} lists)</span>
              </div>
              
              <div className="flex items-center space-x-3 text-gray-300">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>Recent search history</span>
              </div>
              
              <div className="flex items-center space-x-3 text-gray-300">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>App will restart with initial welcome screen</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => setShowConfirmation(true)}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset App</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetCachePanel; 