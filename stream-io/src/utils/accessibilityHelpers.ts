/**
 * Accessibility Helper Utilities
 * 
 * Provides utility functions and constants to improve accessibility throughout the application.
 * Includes ARIA helpers, keyboard navigation, focus management, and screen reader support.
 */

// ARIA Labels and Descriptions
export const ARIA_LABELS = {
  // Navigation
  MAIN_NAV: 'Main navigation',
  BREADCRUMB: 'Breadcrumb navigation',
  PAGINATION: 'Pagination navigation',
  
  // Content
  SEARCH: 'Search movies and shows',
  FILTER: 'Filter content',
  SORT: 'Sort content',
  VIEW_MODE: 'Change view mode',
  
  // Media Controls
  PLAY: 'Play video',
  PAUSE: 'Pause video',
  MUTE: 'Mute audio',
  UNMUTE: 'Unmute audio',
  VOLUME: 'Volume control',
  FULLSCREEN: 'Enter fullscreen',
  
  // Actions
  ADD_TO_FAVORITES: 'Add to favorites',
  REMOVE_FROM_FAVORITES: 'Remove from favorites',
  ADD_TO_WATCHLIST: 'Add to watchlist',
  REMOVE_FROM_WATCHLIST: 'Remove from watchlist',
  SHARE: 'Share content',
  
  // Modal/Dialog
  CLOSE_DIALOG: 'Close dialog',
  OPEN_SETTINGS: 'Open settings',
  CLOSE_SETTINGS: 'Close settings',
  
  // Loading States
  LOADING: 'Loading content',
  LOADING_MORE: 'Loading more content',
  
  // Status
  ERROR: 'Error occurred',
  SUCCESS: 'Action completed successfully',
  WARNING: 'Warning message'
} as const;

// Screen Reader Announcements
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
};

// Focus Management
export class FocusManager {
  private static focusStack: HTMLElement[] = [];
  
  static saveFocus() {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      this.focusStack.push(activeElement);
    }
  }
  
  static restoreFocus() {
    const previousElement = this.focusStack.pop();
    if (previousElement && previousElement.focus) {
      previousElement.focus();
    }
  }
  
  static trapFocus(container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
      
      if (e.key === 'Escape') {
        // Allow escape to close modal/dialog
        const closeButton = container.querySelector('[aria-label*="close" i], [aria-label*="Close" i]') as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }
}

// Keyboard Navigation Helpers
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  TAB: 'Tab'
} as const;

export const handleKeyboardNavigation = (
  event: KeyboardEvent,
  handlers: Partial<Record<keyof typeof KEYBOARD_KEYS, () => void>>
) => {
  const key = event.key;
  const handler = Object.entries(KEYBOARD_KEYS).find(([, value]) => value === key)?.[0] as keyof typeof KEYBOARD_KEYS;
  
  if (handler && handlers[handler]) {
    event.preventDefault();
    handlers[handler]!();
  }
};

// Grid Navigation (for movie/show grids)
export class GridNavigator {
  private container: HTMLElement;
  private items: HTMLElement[] = [];
  private columns: number;
  private currentIndex: number = 0;
  
  constructor(container: HTMLElement, columns: number) {
    this.container = container;
    this.columns = columns;
    this.updateItems();
    this.attachListeners();
  }
  
  private updateItems() {
    this.items = Array.from(
      this.container.querySelectorAll('[role="button"], button, a[href]')
    ) as HTMLElement[];
  }
  
  private attachListeners() {
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.container.addEventListener('focusin', this.handleFocusIn.bind(this));
  }
  
  private handleKeyDown(event: KeyboardEvent) {
    const { key } = event;
    
    switch (key) {
      case KEYBOARD_KEYS.ARROW_RIGHT:
        event.preventDefault();
        this.moveRight();
        break;
      case KEYBOARD_KEYS.ARROW_LEFT:
        event.preventDefault();
        this.moveLeft();
        break;
      case KEYBOARD_KEYS.ARROW_DOWN:
        event.preventDefault();
        this.moveDown();
        break;
      case KEYBOARD_KEYS.ARROW_UP:
        event.preventDefault();
        this.moveUp();
        break;
      case KEYBOARD_KEYS.HOME:
        event.preventDefault();
        this.moveToFirst();
        break;
      case KEYBOARD_KEYS.END:
        event.preventDefault();
        this.moveToLast();
        break;
    }
  }
  
  private handleFocusIn(event: FocusEvent) {
    const target = event.target as HTMLElement;
    const index = this.items.indexOf(target);
    if (index !== -1) {
      this.currentIndex = index;
    }
  }
  
  private moveRight() {
    const nextIndex = Math.min(this.currentIndex + 1, this.items.length - 1);
    this.focusItem(nextIndex);
  }
  
  private moveLeft() {
    const prevIndex = Math.max(this.currentIndex - 1, 0);
    this.focusItem(prevIndex);
  }
  
  private moveDown() {
    const nextRowIndex = this.currentIndex + this.columns;
    if (nextRowIndex < this.items.length) {
      this.focusItem(nextRowIndex);
    }
  }
  
  private moveUp() {
    const prevRowIndex = this.currentIndex - this.columns;
    if (prevRowIndex >= 0) {
      this.focusItem(prevRowIndex);
    }
  }
  
  private moveToFirst() {
    this.focusItem(0);
  }
  
  private moveToLast() {
    this.focusItem(this.items.length - 1);
  }
  
  private focusItem(index: number) {
    if (this.items[index]) {
      this.currentIndex = index;
      this.items[index].focus();
    }
  }
  
  public updateColumns(columns: number) {
    this.columns = columns;
  }
  
  public refresh() {
    this.updateItems();
  }
  
  public destroy() {
    this.container.removeEventListener('keydown', this.handleKeyDown.bind(this));
    this.container.removeEventListener('focusin', this.handleFocusIn.bind(this));
  }
}

// Reduced Motion Detection
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// High Contrast Detection
export const prefersHighContrast = () => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

// Color Scheme Detection
export const prefersDarkMode = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Skip Link Component Helper
export const createSkipLink = (targetId: string, text: string = 'Skip to main content') => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded';
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
  
  return skipLink;
};

// ARIA Live Region Helper
export class LiveRegion {
  private element: HTMLElement;
  
  constructor(priority: 'polite' | 'assertive' = 'polite') {
    this.element = document.createElement('div');
    this.element.setAttribute('aria-live', priority);
    this.element.setAttribute('aria-atomic', 'true');
    this.element.className = 'sr-only';
    document.body.appendChild(this.element);
  }
  
  announce(message: string) {
    this.element.textContent = message;
  }
  
  clear() {
    this.element.textContent = '';
  }
  
  destroy() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

// Accessibility Validation Helpers
export const validateAccessibility = {
  // Check if element has accessible name
  hasAccessibleName: (element: HTMLElement): boolean => {
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.textContent?.trim() ||
      element.getAttribute('title')
    );
  },
  
  // Check if interactive element is keyboard accessible
  isKeyboardAccessible: (element: HTMLElement): boolean => {
    const tabIndex = element.getAttribute('tabindex');
    return element.tagName === 'BUTTON' ||
           element.tagName === 'A' ||
           element.tagName === 'INPUT' ||
           element.tagName === 'SELECT' ||
           element.tagName === 'TEXTAREA' ||
           (tabIndex !== null && tabIndex !== '-1');
  },
  
  // Check if element has sufficient color contrast
  checkColorContrast: (element: HTMLElement): boolean => {
    // This is a basic check - in a real app, you'd use a proper contrast calculation
    const styles = window.getComputedStyle(element);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;
    
    // Basic implementation - should be replaced with proper contrast ratio calculation
    return backgroundColor !== color;
  }
};

// Screen Reader Only CSS Class
export const SR_ONLY_CLASS = 'sr-only';

// Ensure sr-only class is available
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    
    .sr-only:focus {
      position: static;
      width: auto;
      height: auto;
      padding: inherit;
      margin: inherit;
      overflow: visible;
      clip: auto;
      white-space: normal;
    }
  `;
  document.head.appendChild(style);
}

// Export default object with all utilities
export default {
  ARIA_LABELS,
  announceToScreenReader,
  FocusManager,
  KEYBOARD_KEYS,
  handleKeyboardNavigation,
  GridNavigator,
  prefersReducedMotion,
  prefersHighContrast,
  prefersDarkMode,
  createSkipLink,
  LiveRegion,
  validateAccessibility,
  SR_ONLY_CLASS
}; 