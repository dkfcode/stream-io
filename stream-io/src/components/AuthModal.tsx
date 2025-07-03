import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, Loader, Eye, EyeOff } from 'lucide-react';
import { useAuth, useUI } from '../stores';
import { smartToast } from '../utils/toastUtils';
import EmailVerification from './EmailVerification';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'apple' | 'google' | 'microsoft' | 'facebook' | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  
  const { signIn, signUp, user, signInWithGoogle, signInWithApple, signInWithFacebook, signInWithMicrosoft } = useAuth();
  const { openModal, closeModal } = useUI();

  // Close modal if user becomes authenticated
  useEffect(() => {
    if (user) {
      onClose();
    }
  }, [user, onClose]);

  // Track previous isOpen state to only reset form when modal first opens
  const prevIsOpen = useRef(isOpen);

  // Register/unregister modal and reset form only when modal transitions to open
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      // Modal just opened - reset form
      setMode(initialMode);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setLoading(false);
      setSocialLoading(null);
      setShowVerification(false);
      setTempUserId(null);
    }

    // Register/unregister with modal context
    if (isOpen) {
      openModal('auth-modal');
    } else {
      closeModal();
    }

    // Update previous state
    prevIsOpen.current = isOpen;
  }, [isOpen, initialMode, openModal, closeModal]);

  const validatePasswords = () => {
    if (mode === 'signup' && password !== confirmPassword) {
      smartToast.error('Passwords do not match');
      return false;
    }
    if (password.length < 6) {
      smartToast.error('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) return;

    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUp(email, password);
        // After successful signup, user is set in store state
        if (user) {
          setTempUserId(user.id);
          setShowVerification(true);
        }
      } else {
        await signIn(email, password);
        onClose();
      }
    } catch (error) {
      console.error('Auth error:', error);
      // Handle specific error types more gracefully
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('configuration')) {
          smartToast.error('Service configuration error. Please check the setup guide and ensure environment variables are configured.');
        } else if (error.message.includes('Invalid login credentials')) {
          smartToast.error('Invalid email or password. Please check your credentials.');
        } else if (error.message.includes('Email not confirmed')) {
          smartToast.error('Please verify your email address before signing in.');
        } else {
          smartToast.error(error.message);
        }
      } else {
        smartToast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'apple' | 'google' | 'microsoft' | 'facebook') => {
    setSocialLoading(provider);
    try {
      switch (provider) {
        case 'apple':
          await signInWithApple();
          break;
        case 'google':
          await signInWithGoogle();
          break;
        case 'microsoft':
          await signInWithMicrosoft();
          break;
        case 'facebook':
          await signInWithFacebook();
          break;
      }
      // The redirect will handle the rest
    } catch {
      smartToast.error(`Failed to sign in with ${provider}`);
      setSocialLoading(null);
    }
  };

  const handleVerificationComplete = () => {
    setShowVerification(false);
    setTempUserId(null);
    smartToast.success('Email verified successfully!');
    onClose();
  };

  if (!isOpen) return null;

  if (showVerification && tempUserId) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md">
          <EmailVerification
            email={email}
            userId={tempUserId}
            onVerificationComplete={handleVerificationComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal - Optimized for no scrolling */}
      <div className="relative w-full max-w-sm bg-black backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl">
        {/* Header - Compact */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <h2 className="text-lg font-bold text-white">
            {mode === 'signup' ? 'Create Account' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Content - Compact spacing */}
        <div className="p-4 space-y-3">
          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-2.5">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                  <Mail className="text-purple-400 h-2.5 w-2.5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800/50 text-white rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600/50 hover:border-gray-500/50 transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                  <Lock className="text-purple-400 h-2.5 w-2.5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-800/50 text-white rounded-lg pl-8 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600/50 hover:border-gray-500/50 transition-colors"
                  placeholder="Enter your password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Password Confirmation Field - Only for sign up */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                    <Lock className="text-purple-400 h-2.5 w-2.5" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-800/50 text-white rounded-lg pl-8 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600/50 hover:border-gray-500/50 transition-colors"
                    placeholder="Confirm your password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {mode === 'signup' && password && confirmPassword && password !== confirmPassword && (
                  <p className="text-red-400 text-xs mt-0.5">Passwords do not match</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-4 w-4" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          {/* Switch Mode - Moved here */}
          <div className="text-center">
            <button
              onClick={() => {
                const newMode = mode === 'signin' ? 'signup' : 'signin';
                setMode(newMode);
                // Only clear confirm password when switching modes, preserve email/password
                if (newMode === 'signin') {
                  setConfirmPassword('');
                }
              }}
              className="text-purple-400 hover:text-purple-300 text-xs transition-colors"
            >
              {mode === 'signin' 
                ? "Don't have an account? Create one" 
                : 'Already have an account? Sign in'
              }
            </button>
          </div>

          {/* Simple Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/50" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 text-gray-400 bg-black">or</span>
            </div>
          </div>

          {/* Social Login Buttons - Compact */}
          <div className="space-y-2">
            {/* Apple */}
            <button
              onClick={() => handleSocialAuth('apple')}
              disabled={socialLoading !== null}
              className="w-full flex items-center justify-center space-x-2 p-2 bg-black hover:bg-gray-900 text-white rounded-lg font-medium text-xs transition-all duration-200 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === 'apple' ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                </svg>
              )}
              <span>Continue with Apple</span>
            </button>

            {/* Google */}
            <button
              onClick={() => handleSocialAuth('google')}
              disabled={socialLoading !== null}
              className="w-full flex items-center justify-center space-x-2 p-2 bg-white hover:bg-gray-50 text-gray-900 rounded-lg font-medium text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === 'google' ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* Microsoft */}
            <button
              onClick={() => handleSocialAuth('microsoft')}
              disabled={socialLoading !== null}
              className="w-full flex items-center justify-center space-x-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === 'microsoft' ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                </svg>
              )}
              <span>Continue with Microsoft</span>
            </button>

            {/* Facebook */}
            <button
              onClick={() => handleSocialAuth('facebook')}
              disabled={socialLoading !== null}
              className="w-full flex items-center justify-center space-x-2 p-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === 'facebook' ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              )}
              <span>Continue with Facebook</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 