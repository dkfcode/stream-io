import React from 'react';
import { MessageCircle, FileText, Mail, Phone } from 'lucide-react';

const HelpPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <button className="w-full p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center space-x-3 hover:bg-gray-800/70 transition-colors">
            <MessageCircle className="w-5 h-5 text-purple-500" />
            <div className="flex-1 text-left">
              <p className="text-white font-medium">Chat Support</p>
              <p className="text-sm text-gray-400">Talk to our support team</p>
            </div>
          </button>

          <button className="w-full p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center space-x-3 hover:bg-gray-800/70 transition-colors">
            <FileText className="w-5 h-5 text-purple-500" />
            <div className="flex-1 text-left">
              <p className="text-white font-medium">Documentation</p>
              <p className="text-sm text-gray-400">Browse our help articles</p>
            </div>
          </button>

          <button className="w-full p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center space-x-3 hover:bg-gray-800/70 transition-colors">
            <Mail className="w-5 h-5 text-purple-500" />
            <div className="flex-1 text-left">
              <p className="text-white font-medium">Email Support</p>
              <p className="text-sm text-gray-400">Send us an email</p>
            </div>
          </button>

          <button className="w-full p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center space-x-3 hover:bg-gray-800/70 transition-colors">
            <Phone className="w-5 h-5 text-purple-500" />
            <div className="flex-1 text-left">
              <p className="text-white font-medium">Phone Support</p>
              <p className="text-sm text-gray-400">Call our support line</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default HelpPanel;