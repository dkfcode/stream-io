import React, { useEffect } from 'react';
import { useAuth } from '../stores';
import { smartToast } from '../utils/toastUtils';

const AuthCallback: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check URL parameters for OAuth callback data
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const code = urlParams.get('code');
        
        if (error) {
          console.error('OAuth error:', error);
          smartToast.error('Authentication failed. Please try again.');
          // Redirect to home page after a delay
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
          return;
        }

        if (code) {
          // OAuth code received - this would normally be handled by the backend
          smartToast.show('Processing authentication...');
          // TODO: Handle OAuth callback when backend OAuth is implemented
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
          return;
        }

        // Check if user is already authenticated
        if (isAuthenticated && user) {
          smartToast.success('Successfully signed in!');
          // Redirect to home page
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        } else {
          // No authentication data found, redirect to home
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        smartToast.error('Authentication failed. Please try again.');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [user, isAuthenticated]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Completing Sign In...</h2>
          <p className="text-gray-400">Please wait while we finish setting up your account.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback; 