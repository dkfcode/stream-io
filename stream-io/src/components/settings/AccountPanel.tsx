import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Key, Shield, History, LogOut, Smartphone, AlertCircle, Trash2, Save } from 'lucide-react';
import { useAuth } from '../../stores';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import AuthModal from '../AuthModal';
import { smartToast } from '../../utils/toastUtils';

interface AccountPanelProps {
  onBack: () => void;
}

const AccountPanel: React.FC<AccountPanelProps> = ({ onBack }) => {
  const { user, signOut, updatePassword } = useAuth();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      smartToast.error('New passwords do not match');
      return;
    }
    try {
      await updatePassword(newPassword);
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      smartToast.success('Password updated successfully');
    } catch (error) {
      smartToast.error('Failed to update password');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      smartToast.success('Signed out successfully');
    } catch (error) {
      smartToast.error('Failed to sign out');
    }
  };

  // Format the member since date, using current date as fallback if created_at is invalid
  const memberSinceDate = user?.created_at 
    ? format(new Date(user.created_at), 'MMMM yyyy')
    : format(new Date(), 'MMMM yyyy');

  if (!user) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="space-y-4">
              <div className="w-24 h-24 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto border border-purple-500/30">
                <User className="w-12 h-12 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Sign In Required</h3>
                <p className="text-sm text-gray-400 mb-6">Please sign in to access your account settings and personalized features</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200"
                >
                  Sign In or Create Account
                </button>
                <p className="text-xs text-gray-500">
                  Access your watchlist, preferences, and sync across devices
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          initialMode="signin"
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* Profile Section */}
          <div className="flex items-center space-x-4 bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">{user?.email}</h3>
              <p className="text-sm text-gray-400">Member since {memberSinceDate}</p>
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Account Details</h3>
            <div className="space-y-2">
              <button className="w-full p-4 bg-gray-800 rounded-lg flex items-center justify-between hover:bg-gray-700 transition-colors group">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-purple-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">Email Address</p>
                    <p className="text-sm text-gray-400">{user?.email}</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setShowPasswordChange(true)}
                className="w-full p-4 bg-gray-800 rounded-lg flex items-center justify-between hover:bg-gray-700 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Key className="w-5 h-5 text-purple-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">Password</p>
                    <p className="text-sm text-gray-400">Change your password</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Security */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Security</h3>
            <div className="space-y-2">
              <button className="w-full p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center justify-between hover:bg-gray-800/70 transition-colors group">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-purple-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-400">Add an extra layer of security</p>
                  </div>
                </div>
              </button>

              <button className="w-full p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center justify-between hover:bg-gray-800/70 transition-colors group">
                <div className="flex items-center space-x-3">
                  <History className="w-5 h-5 text-purple-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">Login History</p>
                    <p className="text-sm text-gray-400">View your recent login activity</p>
                  </div>
                </div>
              </button>

              <button className="w-full p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center justify-between hover:bg-gray-800/70 transition-colors group">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-purple-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">Connected Devices</p>
                    <p className="text-sm text-gray-400">Manage your active sessions</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Account Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Account Actions</h3>
            <div className="space-y-2">
              <button className="w-full p-4 bg-gray-800 rounded-lg flex items-center justify-between hover:bg-gray-700 transition-colors group">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">Delete Account</p>
                    <p className="text-sm text-gray-400">Permanently delete your account</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleSignOut}
                className="w-full p-4 bg-gray-800 rounded-lg flex items-center justify-between hover:bg-gray-700 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <LogOut className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">Sign Out</p>
                    <p className="text-sm text-gray-400">Sign out from your account</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[200] p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPanel;