import React, { useState, useEffect, useRef } from 'react';
import { usePreferences } from '../stores';
import { GENRES } from '../constants/genres';
import { STREAMING_SERVICES } from '../constants/streamingServices';
import { TV_PROVIDERS } from '../data/tvProviders';
import BoltBadge from './shared/BoltBadge';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  // Get more sample data for floating elements
  const sampleGenres = GENRES; // Use all genres
  const sampleServices = STREAMING_SERVICES; // Use all streaming services
  const sampleProviders = TV_PROVIDERS.slice(0, 6); // Use more TV providers
  


  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isManuallyControlled, setIsManuallyControlled] = useState(false);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
  const dragThreshold = 50; // Minimum distance to trigger slide change
  
  // Feature data
  const features = [
    {
      icon: '🔍',
      title: 'Universal Search',
      description: 'Discover content across all your favorite platforms'
    },
    {
      icon: '📺',
      title: 'Live & On-Demand',
      description: 'Never miss what you want to watch'
    },
    {
      icon: '🎯',
      title: 'Personalized',
      description: 'Content tailored to your taste'
    }
  ];

  // Auto-advance slides
  useEffect(() => {
    if (!isManuallyControlled) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % features.length);
      }, 3600);

      return () => clearInterval(interval);
    }
    }, [isManuallyControlled, features.length]);

  const handleManualSlideChange = (index: number) => {
    setCurrentSlide(index);
    setIsManuallyControlled(true);
    
    // Reset auto-advance after 10 seconds of inactivity
    setTimeout(() => {
      setIsManuallyControlled(false);
    }, 10000);
  };

  // Drag handlers
  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    setDragCurrent({ x: clientX, y: clientY });
    setIsManuallyControlled(true);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setDragCurrent({ x: clientX, y: clientY });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    const deltaX = dragCurrent.x - dragStart.x;
    const deltaY = Math.abs(dragCurrent.y - dragStart.y);
    
    // Only process horizontal swipes (ignore if too much vertical movement)
    if (Math.abs(deltaX) > dragThreshold && deltaY < 100) {
      if (deltaX > 0) {
        // Swipe right - go to previous slide
        setCurrentSlide((prev) => (prev - 1 + features.length) % features.length);
      } else {
        // Swipe left - go to next slide
        setCurrentSlide((prev) => (prev + 1) % features.length);
      }
    }
    
    setIsDragging(false);
    setDragStart({ x: 0, y: 0 });
    setDragCurrent({ x: 0, y: 0 });
    
    // Reset auto-advance after 10 seconds of inactivity
    setTimeout(() => {
      setIsManuallyControlled(false);
    }, 10000);
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragEnd();
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDragging) {
      handleDragEnd();
    }
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleDragEnd();
  };

  // Genre emoji mapping
  const genreEmojis: { [key: string]: string } = {
    action: '⚡',
    adventure: '🗺️',
    animation: '🎨',
    comedy: '😂',
    crime: '🔍',
    documentary: '📽️',
    drama: '🎭',
    family: '👨‍👩‍👧‍👦',
    fantasy: '✨',
    horror: '👻',
    mystery: '🕵️',
    romance: '💕',
    scifi: '🚀',
    thriller: '⚡',
    war: '⚔️',
    western: '🤠'
  };

  // Get current slide data for button area bubbles
  const getCurrentSlideData = () => {
    switch (currentSlide) {
      case 0: // Universal Search - Show streaming services
        return {
          items: sampleServices,
          type: 'services' as const
        };
      case 1: // Live & On-Demand - Show TV providers
        return {
          items: sampleProviders,
          type: 'providers' as const
        };
      case 2: // Personalized - Show genres
        return {
          items: sampleGenres,
          type: 'genres' as const
        };
      default:
        return {
          items: sampleServices,
          type: 'services' as const
        };
    }
  };

  const currentSlideData = getCurrentSlideData();

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-black via-purple-950/20 to-black overflow-hidden">
      {/* Custom CSS Animation */}
      <style>{`
        @keyframes popExpandAndFade {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          6% {
            opacity: 0.15;
            transform: scale(0.4);
          }
          12% {
            opacity: 0.35;
            transform: scale(0.5);
          }
          18% {
            opacity: 0.6;
            transform: scale(0.6);
          }
          24% {
            opacity: 0.8;
            transform: scale(0.7);
          }
          30% {
            opacity: 0.95;
            transform: scale(0.8);
          }
          36% {
            opacity: 1;
            transform: scale(0.9);
          }
          42% {
            opacity: 0.95;
            transform: scale(1.0);
          }
          48% {
            opacity: 0.85;
            transform: scale(1.1);
          }
          54% {
            opacity: 0.7;
            transform: scale(1.2);
          }
          60% {
            opacity: 0.5;
            transform: scale(1.3);
          }
          66% {
            opacity: 0.3;
            transform: scale(1.4);
          }
          72% {
            opacity: 0.1;
            transform: scale(1.5);
          }
          78% {
            opacity: 0;
            transform: scale(1.5);
          }
          100% {
            opacity: 0;
            transform: scale(1.5);
          }
        }
      `}</style>

      {/* Main Content */}
      <div className="relative z-10 h-screen flex flex-col items-center justify-between px-6 overflow-hidden">
        {/* Top Section with Title - Takes up 40% of screen height */}
        <div className="text-center w-full h-[40vh] flex flex-col justify-end pb-4">
          <h1 className="font-bold text-white mb-3" style={{ fontSize: '48px', lineHeight: '1.1' }}>
            Welcome to <span className="text-purple-400">StreamGuide</span>
          </h1>
          <p className="text-purple-200 drop-shadow-lg" style={{ fontSize: '22px', lineHeight: '1.4' }}>
            Your personalized streaming companion
          </p>
        </div>

        {/* Middle Section with Carousel - Takes up 30% of screen height */}
        <div className="w-full h-[30vh] flex items-center justify-center -mt-4 -mb-4">
          <div 
            className={`relative bg-black/20 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6 w-full max-w-2xl mx-auto flex flex-col justify-center cursor-grab select-none transition-transform duration-200 ${
              isDragging ? 'cursor-grabbing scale-[0.98]' : ''
            }`}
            style={{ height: '75%' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-white mb-2">{features[currentSlide].title}</h2>
              <p className="text-gray-300 text-sm">{features[currentSlide].description}</p>

              {/* Navigation dots */}
              <div className="flex justify-center space-x-2 mt-4">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleManualSlideChange(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-purple-400 w-6' 
                        : 'bg-purple-600/50 hover:bg-purple-500/70'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section with Button - Takes up 30% of screen height */}
        <div className="w-full h-[30vh] flex flex-col justify-start pt-4 items-center relative">
          {/* Floating Bubbles - Pop and disappear randomly around button */}
          <div className="absolute inset-0 pointer-events-none">
            {currentSlideData.items.slice(0, 8).map((item, index) => {
              // Create stable positions that don't change during animation
              const stablePositions = [
                // Top row - fixed positions for stability
                { left: 15, top: 10 },
                { left: 50, top: 5 },
                { left: 85, top: 10 },
                
                // Middle row - far sides with stable positioning
                { left: 10, top: 45 },
                { left: 90, top: 45 },
                
                // Bottom row - stable bottom positions
                { left: 20, top: 80 },
                { left: 50, top: 85 },
                { left: 80, top: 80 }
              ];
              
              // Use stable positioning without random variation
              const basePos = stablePositions[index % stablePositions.length];
              const position = {
                left: `${basePos.left}%`,
                top: `${basePos.top}%`
              };
              
              const bubbleKey = `bubble-${index}-${currentSlide}`;
              
              if (currentSlideData.type === 'genres') {
                const genre = item as any;
                return (
                  <div
                    key={bubbleKey}
                    className="absolute backdrop-blur-sm border rounded-full px-2 py-1 text-white text-xs font-medium flex items-center space-x-1 opacity-0"
                    style={{
                      left: position.left,
                      top: position.top,
                      backgroundColor: 'rgba(147, 51, 234, 0.08)',
                      borderColor: 'rgba(196, 181, 253, 0.12)',
                      animation: `popExpandAndFade ${1.8 + (index * 0.15)}s forwards`,
                      animationDelay: `${index * 0.15}s`,
                      fontSize: '11px'
                    }}
                  >
                    <span>{genreEmojis[genre.id] || '🎬'}</span>
                    <span>{genre.name}</span>
                  </div>
                );
              } else {
                const serviceOrProvider = item as any;
                return (
                  <div
                    key={bubbleKey}
                    className="absolute backdrop-blur-sm border rounded-lg p-1.5 flex items-center space-x-1 opacity-0"
                    style={{
                      left: position.left,
                      top: position.top,
                      backgroundColor: 'rgba(139, 69, 219, 0.08)',
                      borderColor: 'rgba(196, 181, 253, 0.12)',
                      animation: `popExpandAndFade ${1.8 + (index * 0.15)}s forwards`,
                      animationDelay: `${index * 0.15}s`,
                      fontSize: '11px'
                    }}
                  >
                    <img 
                      src={serviceOrProvider.logo} 
                      alt={serviceOrProvider.name}
                      className="w-3 h-3 rounded object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="text-white text-xs font-medium">{serviceOrProvider.name}</span>
                  </div>
                );
              }
            })}
          </div>

          <button
            onClick={onGetStarted}
            className="relative z-10 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Subtle gradient overlays for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/20 to-transparent pointer-events-none"></div>
      
      {/* Bolt Badge */}
      <BoltBadge />
    </div>
  );
};

export default WelcomeScreen; 