export interface Genre {
  id: string;
  name: string;
  emoji: string;
  tmdbId: number;
}

export const GENRES: Genre[] = [
  { id: 'action', name: 'Action', emoji: '💥', tmdbId: 28 },
  { id: 'adventure', name: 'Adventure', emoji: '🗺️', tmdbId: 12 },
  { id: 'animation', name: 'Animation', emoji: '🎬', tmdbId: 16 },
  { id: 'comedy', name: 'Comedy', emoji: '😂', tmdbId: 35 },
  { id: 'crime', name: 'Crime', emoji: '🔍', tmdbId: 80 },
  { id: 'documentary', name: 'Documentary', emoji: '📹', tmdbId: 99 },
  { id: 'drama', name: 'Drama', emoji: '🎭', tmdbId: 18 },
  { id: 'family', name: 'Family', emoji: '👨‍👩‍👧‍👦', tmdbId: 10751 },
  { id: 'fantasy', name: 'Fantasy', emoji: '✨', tmdbId: 14 },
  { id: 'history', name: 'History', emoji: '🏛️', tmdbId: 36 },
  { id: 'horror', name: 'Horror', emoji: '😱', tmdbId: 27 },
  { id: 'mystery', name: 'Mystery', emoji: '🔍', tmdbId: 9648 },
  { id: 'romance', name: 'Romance', emoji: '💕', tmdbId: 10749 },
  { id: 'thriller', name: 'Thriller', emoji: '😰', tmdbId: 53 },
  { id: 'western', name: 'Western', emoji: '🤠', tmdbId: 37 },
  // TV-specific genres
  { id: 'action-adventure', name: 'Action & Adventure', emoji: '🎬', tmdbId: 10759 },
  { id: 'kids', name: 'Kids', emoji: '👶', tmdbId: 10762 },
  { id: 'news', name: 'News', emoji: '📰', tmdbId: 10763 },
  { id: 'reality', name: 'Reality', emoji: '📺', tmdbId: 10764 },
  { id: 'sci-fi-fantasy', name: 'Sci-Fi & Fantasy', emoji: '🔮', tmdbId: 10765 }
]; 