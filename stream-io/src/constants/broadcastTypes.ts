export interface BroadcastType {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export const BROADCAST_TYPES: BroadcastType[] = [
  { id: 'sports', name: 'Sports', emoji: '🏆', description: 'Live sports events and games' },
  { id: 'news', name: 'News & Politics', emoji: '📰', description: 'Breaking news and current events' },
  { id: 'awards', name: 'Awards Shows', emoji: '🏆', description: 'Award ceremonies and galas' },
  { id: 'reality', name: 'Reality TV', emoji: '📺', description: 'Reality shows and competitions' },
  { id: 'competition', name: 'Competition Shows', emoji: '🎯', description: 'Competition and contest shows' },
  { id: 'gameshow', name: 'Game Shows', emoji: '🎮', description: 'Game shows and trivia' },
  { id: 'music', name: 'Music Events', emoji: '🎵', description: 'Concerts and music events' },
  { id: 'talkshow', name: 'Talk Shows', emoji: '🎙️', description: 'Talk shows and interviews' },
  { id: 'weather', name: 'Weather', emoji: '🌤️', description: 'Weather reports and forecasts' },
  { id: 'religious', name: 'Religious', emoji: '⛪', description: 'Religious programming' },
  { id: 'ceremony', name: 'Ceremonies', emoji: '🎉', description: 'Special ceremonies and events' }
]; 