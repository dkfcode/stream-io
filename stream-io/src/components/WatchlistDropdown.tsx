import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import type { SearchResult } from '../types/tmdb';

interface CustomList {
  id: string;
  name: string;
  items: SearchResult[];
  section: 'future' | 'past';
}

interface WatchlistDropdownProps {
  onSelect: (listId: string) => void;
  onCreateNew: () => void;
  lists: CustomList[];
  className?: string;
}

const WatchlistDropdown: React.FC<WatchlistDropdownProps> = ({
  onSelect,
  onCreateNew,
  lists,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedLists = [...lists].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm w-full"
      >
        <Plus size={16} />
        <span className="flex-1 text-left">Select or create watchlist</span>
        <ChevronDown size={16} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-xl overflow-hidden z-50">
          <div className="max-h-48 overflow-y-auto">
            {sortedLists.map((list) => (
              <button
                key={list.id}
                onClick={() => {
                  onSelect(list.id);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <span className="flex-1">{list.name}</span>
                <span className="text-xs text-gray-400 capitalize">{list.section}</span>
              </button>
            ))}
            {sortedLists.length === 0 && (
              <p className="px-4 py-2 text-sm text-gray-400">No watchlists created</p>
            )}
          </div>
          <div className="border-t border-gray-700">
            <button
              onClick={() => {
                onCreateNew();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-purple-400 hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={14} />
              <span>Create new watchlist</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchlistDropdown;