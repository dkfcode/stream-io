import React, { useState } from 'react';
import { useAuth } from '../stores';
import { toast } from 'react-hot-toast';
import { Mail, Lock, Loader } from 'lucide-react';
import EmailVerification from './EmailVerification';

const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const { signIn, signUp, user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        if (user) {
          setTempUserId(user.id);
          setShowVerification(true);
          toast.success('Please verify your email address');
        }
      } else {
        await signIn(email, password);
        toast.success('Welcome back!');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationComplete = () => {
    setShowVerification(false);
    setTempUserId(null);
    setEmail('');
    setPassword('');
    setIsSignUp(false);
  };

  if (showVerification && tempUserId) {
    return (
      <EmailVerification
        email={email}
        userId={tempUserId}
        onVerificationComplete={handleVerificationComplete}
      />
    );
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-lg border border-gray-700/30 bg-gray-800/50 p-6 backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-white mb-4">
        {isSignUp ? 'Create an Account' : 'Sign In'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-0.5">
            Email
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all duration-200">
              <Mail className="text-purple-400 group-hover:text-purple-300 transition-colors h-3.5 w-3.5" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700/50 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600/50 hover:border-gray-500/50 transition-colors"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
            Password
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all duration-200">
              <Lock className="text-purple-400 group-hover:text-purple-300 transition-colors h-3.5 w-3.5" />
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700/50 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600/50 hover:border-gray-500/50 transition-colors"
              placeholder="Enter your password"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 text-purple-300 hover:text-purple-200 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 border border-purple-500/20 hover:border-purple-400/30"
        >
          {loading ? (
            <>
              <Loader className="animate-spin h-5 w-5" />
              <span>Processing...</span>
            </>
          ) : (
            <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
          )}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;