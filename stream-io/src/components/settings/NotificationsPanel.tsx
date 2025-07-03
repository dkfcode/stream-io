import React from 'react';
import { ArrowLeft, Bell } from 'lucide-react';

interface NotificationsPanelProps {
  onBack: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ onBack }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Coming Soon</h3>
              <p className="text-gray-400">Notification settings will be available in a future update.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationsPanel;