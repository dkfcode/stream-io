import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Check } from 'lucide-react';
import type { SearchResult } from '../types/tmdb';
import { useWatchlistStore } from '../stores/watchlistStore';
import { toast } from 'react-hot-toast';

interface ListSelectionDialogProps {
  item: SearchResult;
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: () => void;
}

const ListSelectionDialog: React.FC<ListSelectionDialogProps> = ({
  item,
  isOpen,
  onClose,
  onItemAdded
}) => {
  const [newListName, setNewListName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  const { 
    customLists, 
    addToList, 
    removeFromList, 
    createList, 
    isInList,
    getListsContainingItem 
  } = useWatchlistStore();

  if (!isOpen) return null;

  const handleListToggle = (listId: string) => {
    if (isInList(listId, item.id)) {
      removeFromList(listId, item.id);
    } else {
      addToList(listId, item);
    }
    onItemAdded();
  };

  const handleCreateNewList = () => {
    if (newListName.trim()) {
      const listId = createList(newListName.trim());
      if (listId) { // Only proceed if list was created successfully
        addToList(listId, item);
        setNewListName('');
        setIsCreatingNew(false);
        onItemAdded();
        toast.success(`Added to "${newListName.trim()}"`);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateNewList();
    } else if (e.key === 'Escape') {
      setIsCreatingNew(false);
      setNewListName('');
    }
  };

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 2147483647 }}>
      {/* Backdrop overlay with true black background */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Dialog content */}
      <div className="relative bg-black rounded-xl p-6 w-full max-w-xs border border-gray-700/50 shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Add to List</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Lists */}
        <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
          {/* Default Lists First - in specific order */}
          {customLists
            .filter(list => list.isDefault ?? false)
            .sort((a, b) => {
              // Ensure Favorite comes first, then Watch Later, then Watched Already
              if (a.id === 'favorite') return -1;
              if (b.id === 'favorite') return 1;
              if (a.id === 'watch-later') return -1;
              if (b.id === 'watch-later') return 1;
              if (a.id === 'watched-already') return -1;
              if (b.id === 'watched-already') return 1;
              return 0;
            })
            .map((list) => {
              const isItemInList = isInList(list.id, item.id);
              return (
                <button
                  key={list.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleListToggle(list.id);
                  }}
                  className={`w-full p-3 rounded-lg text-left font-medium transition-colors ${
                    isItemInList
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {list.name}
                </button>
              );
            })}
          
          {/* Custom Lists After Default Lists */}
          {customLists
            .filter(list => !(list.isDefault ?? false))
            .map((list) => {
              const isItemInList = isInList(list.id, item.id);
              return (
                <button
                  key={list.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleListToggle(list.id);
                  }}
                  className={`w-full p-3 rounded-lg text-left font-medium transition-colors ${
                    isItemInList
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {list.name}
                </button>
              );
            })}
        </div>

        {/* Create New List */}
        {isCreatingNew ? (
          <div className="space-y-3">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter list name"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateNewList();
                }}
                disabled={!newListName.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create & Add
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreatingNew(false);
                  setNewListName('');
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCreatingNew(true);
            }}
            className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-600 hover:border-purple-500 rounded-lg transition-colors text-gray-400 hover:text-purple-400"
          >
            <Plus className="w-5 h-5" />
            <span>New List</span>
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ListSelectionDialog; 