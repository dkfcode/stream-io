/**
 * StreamGuide State Management Guidelines
 * 
 * This file provides clear guidelines for when to use different state management approaches
 * to ensure consistent architecture and prevent anti-patterns.
 */

// State Management Decision Tree
export const STATE_MANAGEMENT_PATTERNS = {
  // For simple UI state that doesn't need to be shared
  LOCAL_STATE: {
    use_when: [
      'Component-specific UI state (modals, form inputs)',
      'Temporary state that resets on unmount',
      'State that only affects a single component',
      'Simple toggles, counters, or flags'
    ],
    tools: ['useState', 'useReducer'],
    examples: ['isOpen', 'inputValue', 'isLoading', 'currentSlide']
  },

  // For complex component state that can be extracted
  CUSTOM_HOOKS: {
    use_when: [
      'Complex state logic that can be reused',
      'Multiple related useState calls (3+)',
      'State with complex update patterns',
      'Logic that includes side effects'
    ],
    tools: ['Custom hooks from hooks/ directory'],
    examples: ['useUIInteractions', 'useHeroState', 'useRemoteControlState']
  },

  // For global application state
  CONTEXT_API: {
    use_when: [
      'Authentication state',
      'Theme/settings that affect multiple components',
      'User preferences and configuration',
      'Application-wide modal management'
    ],
    tools: ['React Context + useContext'],
    examples: ['AuthContext', 'ThemeContext', 'SettingsContext']
  },

  // For client-side data management and caching
  ZUSTAND_STORE: {
    use_when: [
      'User-generated data (watchlists, favorites)',
      'Local storage persistence needed',
      'State that survives component unmounts',
      'Cross-component data sharing'
    ],
    tools: ['Zustand store'],
    examples: ['watchlistStore', 'userPreferencesStore']
  },

  // For server state and API data
  REACT_QUERY: {
    use_when: [
      'API data fetching and caching',
      'Server state synchronization',
      'Background updates needed',
      'Optimistic updates'
    ],
    tools: ['TanStack Query (React Query)'],
    examples: ['useContentService hooks', 'API queries and mutations']
  }
};

// Anti-patterns to avoid
export const ANTI_PATTERNS = {
  TOO_MANY_USE_STATE: {
    problem: 'Components with 10+ useState hooks',
    solution: 'Extract to custom hooks or use useReducer',
    example_fix: 'Use useRemoteControlState instead of 30+ individual useState'
  },

  PROP_DRILLING: {
    problem: 'Passing props through many component levels',
    solution: 'Use Context API or compound components',
    example_fix: 'Use Section compound component instead of passing all props'
  },

  MIXING_CONCERNS: {
    problem: 'Business logic mixed with UI components',
    solution: 'Extract to service layer hooks',
    example_fix: 'Use useContentService instead of direct API calls in components'
  },

  INCONSISTENT_PATTERNS: {
    problem: 'Using different patterns for similar use cases',
    solution: 'Follow the decision tree consistently',
    example_fix: 'All API calls should use React Query, not mix with useState'
  }
};

// Implementation checklist
export const IMPLEMENTATION_CHECKLIST = {
  BEFORE_ADDING_STATE: [
    '□ Does this state need to be shared between components?',
    '□ Is this server data or client data?',
    '□ Does this state need to persist across navigation?',
    '□ How complex is the state update logic?',
    '□ Are there similar patterns already implemented?'
  ],

  COMPONENT_REVIEW: [
    '□ Does component have 5+ useState hooks? → Extract to custom hook',
    '□ Is component receiving 10+ props? → Consider compound component',
    '□ Does component make direct API calls? → Use service layer hook',
    '□ Is business logic mixed with JSX? → Extract to custom hooks'
  ],

  ARCHITECTURE_HEALTH: [
    '□ All server data uses React Query',
    '□ Complex UI state uses custom hooks',
    '□ Global state uses appropriate Context',
    '□ No prop drilling beyond 2-3 levels',
    '□ Service layer abstracts API complexity'
  ]
};

// Helper function to determine state management approach
export const getStateManagementRecommendation = (
  isShared: boolean,
  isServerData: boolean,
  needsPersistence: boolean,
  complexity: 'simple' | 'moderate' | 'complex'
): keyof typeof STATE_MANAGEMENT_PATTERNS => {
  if (isServerData) return 'REACT_QUERY';
  if (needsPersistence) return 'ZUSTAND_STORE';
  if (isShared) return 'CONTEXT_API';
  if (complexity === 'complex') return 'CUSTOM_HOOKS';
  return 'LOCAL_STATE';
};

// Migration helper for refactoring existing components
export const getMigrationPath = (currentPatterns: string[]) => {
  const migrations = [];
  
  if (currentPatterns.includes('many_useState')) {
    migrations.push({
      priority: 'high',
      action: 'Extract to custom hooks',
      benefit: 'Reduces complexity, improves reusability'
    });
  }
  
  if (currentPatterns.includes('prop_drilling')) {
    migrations.push({
      priority: 'medium',
      action: 'Implement compound components',
      benefit: 'Cleaner API, better composition'
    });
  }
  
  if (currentPatterns.includes('direct_api_calls')) {
    migrations.push({
      priority: 'high',
      action: 'Move to service layer hooks',
      benefit: 'Better error handling, caching, consistency'
    });
  }
  
  const priorityMap = { high: 3, medium: 2, low: 1 };
  return migrations.sort((a) => priorityMap[a.priority] || 0);
}; 