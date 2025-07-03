import { handleError, handleAsyncError } from './errorHandler';

// Default section order for the HomePage
export const DEFAULT_SECTION_ORDER = [
  'hero',
  'trending-near-you',
  'curated-for-you',
  'newly-added', 
  'leaving-soon',
  'bingeworthy',
  'genre-content', // Because You Like <genres>
  'top-searches',
  'top-movies',
  'top-shows',
  'random-picks',
  'hidden-gems',
  'personalized-content'
];

class SectionOrderService {
  private currentOrder: string[] = [...DEFAULT_SECTION_ORDER];
  private listeners: Array<(order: string[]) => void> = [];

  /**
   * Initialize section order from localStorage
   */
  initialize() {
    // Load from localStorage 
    const localOrder = this.loadLocalOrder();
    if (localOrder.length > 0) {
      this.currentOrder = localOrder;
    }

    // Note: Cloud sync will be implemented when user authentication is fully working
    // For now, using localStorage for persistence
  }

  /**
   * Get current section order
   */
  getSectionOrder(): string[] {
    return [...this.currentOrder];
  }

  /**
   * Update section order
   */
  setSectionOrder(newOrder: string[]): void {
    this.currentOrder = [...newOrder];
    this.saveLocalOrder(newOrder);
    
    // Note: Cloud sync will be implemented when user authentication is fully working
    // For now, changes are saved to localStorage only

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Reset to default order
   */
  resetToDefault(): void {
    this.setSectionOrder([...DEFAULT_SECTION_ORDER]);
  }

  /**
   * Subscribe to order changes
   */
  subscribe(listener: (order: string[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Apply section order from cloud settings
   */
  private applySectionOrder(orderMap: Record<string, number>): void {
    // Sort sections based on cloud order
    const orderedSections = Object.entries(orderMap)
      .sort(([, a], [, b]) => a - b)
      .map(([sectionId]) => sectionId);
    
    // Add any new sections that weren't in the cloud order
    const missingSection = DEFAULT_SECTION_ORDER.filter(
      sectionId => !orderedSections.includes(sectionId)
    );
    
    this.currentOrder = [...orderedSections, ...missingSection];
    this.saveLocalOrder(this.currentOrder);
    this.notifyListeners();
  }

  /**
   * Load section order from localStorage
   */
  private loadLocalOrder(): string[] {
    try {
      const saved = localStorage.getItem('section-order');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate that it's an array of strings
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
          return parsed;
        }
      }
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'loadSectionOrderFromLocalStorage'
      });
    }
    return [];
  }

  /**
   * Save section order to localStorage
   */
  private saveLocalOrder(order: string[]): void {
    try {
      localStorage.setItem('section-order', JSON.stringify(order));
    } catch {
      // If saving to backend fails, still return the local order
      console.warn('Failed to save section order to backend');
    }
  }

  /**
   * Notify all listeners of order changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getSectionOrder());
      } catch (error) {
        handleError('Error in section order listener', {
          context: { listenersCount: this.listeners.length }
        });
      }
    });
  }
}

// Export singleton instance
export const sectionOrderService = new SectionOrderService(); 