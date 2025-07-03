import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Loader } from 'lucide-react';
import { useTheme } from '../stores/uiStore';

interface VideoPlayerProps {
  videoKey: string;
  title: string;
  posterPath: string;
  autoplayDelay?: number;
  disableAutoplay?: boolean; // Allow manual override of autoplay setting
  componentId?: string; // For identification purposes
  contentId?: number; // For identification purposes
}

// Declare YouTube API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoKey, 
  title, 
  posterPath,
  autoplayDelay = 5000,
  disableAutoplay = false,
  componentId = 'default',
  contentId = 0
}) => {
  const { themeSettings } = useTheme();
  const [showVideo, setShowVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if autoplay should be enabled
  const shouldAutoplay = themeSettings.autoplayVideos && !disableAutoplay;

  // Load YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Handle player state changes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onPlayerStateChange = useCallback((event: any) => {
    const playerState = event.data;
    const isCurrentlyPlaying = playerState === window.YT?.PlayerState?.PLAYING;
    setIsPlaying(isCurrentlyPlaying);
  }, []);

  // Initialize YouTube player when iframe loads
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setIframeLoaded(true);
    
    if (window.YT && window.YT.Player) {
      playerRef.current = new window.YT.Player(`youtube-player-${componentId}-${contentId}`, {
        events: {
          onStateChange: onPlayerStateChange,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onReady: () => {
            console.log('YouTube player ready', { componentId, contentId });
          }
        }
      });
    }
  }, [componentId, contentId, onPlayerStateChange]);

  useEffect(() => {
    // Only auto-play if the setting is enabled
    if (!shouldAutoplay) return;

    const timer = setTimeout(() => {
      setIsLoading(true);
      setFadeOut(true);
      setTimeout(() => {
        setShowVideo(true);
      }, 1000);
    }, autoplayDelay);

    return () => clearTimeout(timer);
  }, [autoplayDelay, shouldAutoplay]);

  const handlePlayClick = () => {
    setIsLoading(true);
    setFadeOut(true);
    setTimeout(() => {
      setShowVideo(true);
    }, 1000);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden transition-transform duration-700 ease-in-out"
    >
      <div 
        className={`absolute inset-0 z-10 transition-opacity duration-1000 ${
          fadeOut && iframeLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <img
          src={`https://image.tmdb.org/t/p/w780${posterPath}`}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={handlePlayClick}
            className="p-4 bg-black/75 rounded-full hover:bg-black transition-colors group"
            aria-label={`Play ${title} trailer`}
          >
            <Play className="w-8 h-8 text-white fill-white" />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className={`absolute inset-0 z-20 flex items-center justify-center bg-black/50 ${
          iframeLoaded ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-500`}>
          <Loader className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      )}

      {showVideo && (
        <div className={`absolute inset-0 z-30 transition-opacity duration-500 ${
          iframeLoaded ? 'opacity-100' : 'opacity-0'
        }`}>
          <iframe
            id={`youtube-player-${componentId}-${contentId}`}
            src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&enablejsapi=1&version=3&playerapiid=ytplayer&rel=0`}
            title={`${title} trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            onLoad={handleIframeLoad}
          />
        </div>
      )}

      {/* Playing indicator when video is active */}
      {showVideo && isPlaying && (
        <div className="absolute inset-0 z-40 pointer-events-none">
          <div className="absolute top-4 right-4 bg-red-600/90 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            LIVE
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;