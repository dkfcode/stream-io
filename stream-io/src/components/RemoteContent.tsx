import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Power, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Home, VolumeX, Volume1, Volume2, RotateCcw, HdmiPort as Hdmi, Asterisk, SkipBack, Play, Pause, SkipForward, RefreshCw, MousePointer, Keyboard, Grid3X3, Tv, Square, Gamepad2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import SettingsPanel from './SettingsPanel';
import { smartTVProxyService, type SmartTV } from '../services/smartTVProxyService';

interface App {
  id: string;
  name: string;
  icon: string;
  isInstalled: boolean;
}

const RemoteContent: React.FC = () => {
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [selectedTV, setSelectedTV] = useState<SmartTV | null>(null);
  const [showTVSelector, setShowTVSelector] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isPoweredOn, setIsPoweredOn] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTouchpad, setShowTouchpad] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showApps, setShowApps] = useState(false);
  const [keyboardInput, setKeyboardInput] = useState('');
  const [remoteMode, setRemoteMode] = useState('standard');
  
  // Enhanced Joystick state with physics
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [activeDirection, setActiveDirection] = useState<string | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const dPadRef = useRef<HTMLDivElement>(null);
  const dragIntervalRef = useRef<number | null>(null);
  
  // Advanced joystick physics state
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickTouchId, setJoystickTouchId] = useState<number | null>(null);
  const [joystickStartPos, setJoystickStartPos] = useState({ x: 0, y: 0 });
  const [joystickCurrentPos, setJoystickCurrentPos] = useState({ x: 0, y: 0 });
  const [joystickLimits, setJoystickLimits] = useState({ radius: 0 });
  const [activeDirections, setActiveDirections] = useState({
    up: false,
    down: false,
    left: false,
    right: false
  });

  // Animation smoothing variables for stability
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const targetPosition = useRef({ x: 0, y: 0 });
  const currentPosition = useRef({ x: 0, y: 0 });
  const smoothingFactor = 0.15; // Lower = smoother but slower response

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [lastCommandStatus, setLastCommandStatus] = useState<'success' | 'error' | 'pending' | null>(null);
  const [isShowingError, setIsShowingError] = useState(false);
  const [isHeaderContainerReady, setIsHeaderContainerReady] = useState(false);

  const [availableTVs, setAvailableTVs] = useState<SmartTV[]>([
    {
      id: 'user-smart-tv',
      name: 'My Smart TV',
      brand: 'Roku', // Default to Roku - user can change if different
      model: 'Smart TV',
      ipAddress: '10.0.0.47',
      isConnected: true,
      lastSeen: new Date().toISOString()
    },
    {
      id: 'roku-living-room',
      name: 'Roku Living Room',
      brand: 'Roku',
      model: 'Ultra 4K',
      ipAddress: '192.168.1.105',
      isConnected: false,
      lastSeen: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
    },
    {
      id: 'samsung-bedroom',
      name: 'Samsung Bedroom',
      brand: 'Samsung',
      model: 'QN65Q80A',
      ipAddress: '192.168.1.108',
      isConnected: false,
      lastSeen: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
    },
    {
      id: 'lg-kitchen',
      name: 'LG Kitchen',
      brand: 'LG',
      model: 'OLED55C1',
      ipAddress: '192.168.1.112',
      isConnected: false,
      lastSeen: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
    }
  ]);

  const [installedApps] = useState<App[]>([
    { id: 'netflix', name: 'Netflix', icon: '🎬', isInstalled: true },
    { id: 'youtube', name: 'YouTube', icon: '📺', isInstalled: true },
    { id: 'disney', name: 'Disney+', icon: '🏰', isInstalled: true },
    { id: 'hulu', name: 'Hulu', icon: '📱', isInstalled: true },
    { id: 'prime', name: 'Prime Video', icon: '📦', isInstalled: true },
    { id: 'spotify', name: 'Spotify', icon: '🎵', isInstalled: true },
    { id: 'hbo', name: 'HBO Max', icon: '🎭', isInstalled: true },
    { id: 'apple', name: 'Apple TV', icon: '🍎', isInstalled: true },
    { id: 'peacock', name: 'Peacock', icon: '🦚', isInstalled: false },
    { id: 'paramount', name: 'Paramount+', icon: '⭐', isInstalled: false },
    { id: 'discovery', name: 'Discovery+', icon: '🔍', isInstalled: false },
    { id: 'crunchyroll', name: 'Crunchyroll', icon: '🍜', isInstalled: false }
  ]);

  const testTVConnection = async (tv: SmartTV) => {
    setConnectionStatus('connecting');
    const isConnected = await smartTVProxyService.testConnection(tv);
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    return isConnected;
  };

  useEffect(() => {
    // Auto-select the first connected TV
    const connectedTV = availableTVs.find(tv => tv.isConnected);
    if (connectedTV && !selectedTV) {
      setSelectedTV(connectedTV);
      // Test connection when TV is selected
      testTVConnection(connectedTV);
    }
  }, [availableTVs, selectedTV]);

  // Check for header container availability
  useEffect(() => {
    const checkContainer = () => {
      const container = document.getElementById('remote-header-container');
      if (container) {
        setIsHeaderContainerReady(true);
      } else {
        // Retry after a short delay if container not found
        setTimeout(checkContainer, 50);
      }
    };
    
    checkContainer();
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (dragIntervalRef.current) {
        clearInterval(dragIntervalRef.current);
      }
    };
  }, []);

  const scanForTVs = async () => {
    setIsScanning(true);
    // Simulate network scan
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate finding new TVs
    const newTV: SmartTV = {
      id: 'apple-tv-den',
      name: 'Apple TV Den',
      brand: 'Apple',
      model: 'Apple TV 4K',
      ipAddress: '192.168.1.115',
      isConnected: true,
      lastSeen: new Date().toISOString()
    };
    
    setAvailableTVs(prev => {
      const exists = prev.find(tv => tv.id === newTV.id);
      return exists ? prev : [...prev, newTV];
    });
    
    setIsScanning(false);
  };

  // Render header controls in the remote header container
  const renderHeaderControls = () => {
    const headerContainer = document.getElementById('remote-header-container');
    const powerContainer = document.getElementById('remote-power-container');
    if (!headerContainer || !powerContainer || !isHeaderContainerReady) return null;

    // TV Selector content for middle container
    const tvSelectorContent = (
      <div className="relative w-full">
        <button
          onClick={() => setShowTVSelector(!showTVSelector)}
          className="w-full flex items-center justify-between bg-toolbar-hover hover:bg-gray-700 rounded-xl px-4 py-2 text-gray-200 transition-colors border border-gray-800/20"
        >
          <div className="flex items-center space-x-3">
            <Tv className="w-5 h-5" />
            <div className="text-left">
              <div className="text-sm font-medium">
                {selectedTV ? selectedTV.name : 'Select TV'}
              </div>
              {selectedTV && (
                <div className="text-xs text-gray-400">
                  {selectedTV.brand} • {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                </div>
              )}
            </div>
          </div>
          <ChevronDown className="w-4 h-4" />
        </button>
        
        {showTVSelector && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-toolbar rounded-xl shadow-xl z-50 border overflow-hidden">
            <div className="py-2">
              <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wide border-b border-gray-800">
                Available TVs
              </div>
              {availableTVs.map((tv) => (
                <button
                  key={tv.id}
                  onClick={() => {
                    setSelectedTV(tv);
                    setShowTVSelector(false);
                    testTVConnection(tv);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-toolbar-hover transition-colors ${
                    selectedTV?.id === tv.id ? 'bg-purple-500/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-200">{tv.name}</div>
                      <div className="text-xs text-gray-400">{tv.brand} • {tv.ipAddress}</div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${tv.isConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
                  </div>
                </button>
              ))}
              <div className="border-t border-gray-800 mt-2">
                <button
                  onClick={() => {
                    scanForTVs();
                    setShowTVSelector(false);
                  }}
                  disabled={isScanning}
                  className="w-full text-left px-4 py-3 text-purple-400 hover:bg-toolbar-hover transition-colors flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scanning...' : 'Scan for TVs'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );

    // Power button content for right container
    const powerButtonContent = (
      <button
        onClick={() => sendRemoteCommand('power')}
        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors border border-gray-800/20 ${
          isPoweredOn 
            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
        }`}
      >
        <Power className="w-5 h-5" />
      </button>
    );

    return (
      <>
        {createPortal(tvSelectorContent, headerContainer)}
        {createPortal(powerButtonContent, powerContainer)}
      </>
    );
  };

  // Enhanced command sending with press/release states and smart TV integration
  const sendRemoteCommand = async (command: string, value?: any, isPressed: boolean = true) => {
    // Handle joystick-specific press/release logging
    if (typeof value === 'boolean') {
      isPressed = value;
      value = undefined;
    }
    
    if (remoteMode === 'joystick') {
      if (isPressed) {
        console.log(`Remote command: ${command} PRESSED`);
      } else {
        console.log(`Remote command: ${command} RELEASED`);
        // For joystick mode, we don't need to send release commands to the TV
        return;
      }
    }
    
    if (!selectedTV) {
      console.warn('No TV selected');
      setLastCommandStatus('error');
      return;
    }
    
    console.log(`Sending command "${command}" to ${selectedTV.name}`, value);
    
    setLastCommandStatus('pending');
    setConnectionStatus('connecting');
    
    const result = await smartTVProxyService.sendCommand(selectedTV, command, value);
    
    if (result.success) {
      // Update local state for visual feedback
      updateLocalState(command, value);
      setLastCommandStatus('success');
      setConnectionStatus('connected');
      // Clear any existing error state
      setIsShowingError(false);
    } else {
      setLastCommandStatus('error');
      setConnectionStatus('disconnected');
      
      // Only show error dialog if one isn't already being displayed
      if (!isShowingError) {
        setIsShowingError(true);
        
        // Show detailed error message with troubleshooting
        let message = `Failed to send command to ${selectedTV.name}.\n\nError: ${result.error}`;
        
        if (result.troubleshooting && result.troubleshooting.length > 0) {
          message += '\n\nTroubleshooting steps:\n';
          result.troubleshooting.forEach((step, index) => {
            message += `${index + 1}. ${step}\n`;
          });
        }
        
        // Special handling for CORS errors
        if (result.errorType === 'cors') {
          message += '\n⚠️ This is a browser security limitation.\nFor best results, use the official Roku mobile app.';
        }
        
        // Show alert and reset error state when user dismisses it
        setTimeout(() => {
          alert(message);
          setIsShowingError(false);
        }, 100);
      }
    }
  };



  const updateLocalState = (command: string, value?: any) => {
    // Update local state for visual feedback
    switch (command) {
      case 'power':
        setIsPoweredOn(!isPoweredOn);
        break;
      case 'volume_up':
        setVolume(prev => Math.min(100, prev + 5));
        setIsMuted(false);
        break;
      case 'volume_down':
        setVolume(prev => Math.max(0, prev - 5));
        setIsMuted(false);
        break;
      case 'mute':
        setIsMuted(!isMuted);
        break;
      case 'play_pause':
        setIsPlaying(!isPlaying);
        break;
      case 'launch_app':
        console.log(`Launching app: ${value}`);
        break;
      case 'touchpad_swipe':
        console.log(`Touchpad swipe: ${value.direction}`);
        break;
      case 'touchpad_tap':
        console.log(`Touchpad tap at: ${value.x}, ${value.y}`);
        break;
      case 'keyboard_input':
        console.log(`Keyboard input: ${value}`);
        break;
    }
  };

  // Initialize joystick physics
  const initJoystick = () => {
    if (!dPadRef.current) return;
    
    const rect = dPadRef.current.getBoundingClientRect();
    const startPos = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    
    setJoystickStartPos(startPos);
    setJoystickCurrentPos(startPos);
    setJoystickLimits({
      radius: rect.width / 2 * 0.4 // Limit movement to 40% of base radius
    });
    
    // Reset joystick position
    resetJoystickPosition();
  };

  // Reset joystick to center position with smooth spring-back animation
  const resetJoystickPosition = () => {
    // Cancel any ongoing smooth animation
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    const knobElement = dPadRef.current?.querySelector('.joystick-knob') as HTMLElement;
    if (knobElement) {
      // Set target position to center
      targetPosition.current = { x: 0, y: 0 };
      
      // Enable smooth spring-back transition with bouncy effect
      knobElement.style.transition = 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)';
      knobElement.style.transform = 'translate(0px, 0px)';
      knobElement.classList.remove('active');
      
      // Clean up after animation completes
      setTimeout(() => {
        knobElement.style.transition = '';
        // Reset position references
        currentPosition.current = { x: 0, y: 0 };
        targetPosition.current = { x: 0, y: 0 };
      }, 250);
    }
    
    // Release all directions
    Object.keys(activeDirections).forEach(direction => {
      if (activeDirections[direction as keyof typeof activeDirections]) {
        sendRemoteCommand(direction === 'up' ? 'up' : direction === 'down' ? 'down' : direction === 'left' ? 'left' : 'right', false);
      }
    });
    
    setActiveDirections({
      up: false,
      down: false,
      left: false,
      right: false
    });
  };

  // Smooth animation function for stability
  const smoothAnimate = () => {
    const knobElement = dPadRef.current?.querySelector('.joystick-knob') as HTMLElement;
    if (!knobElement) return;
    
    const now = performance.now();
    const deltaTime = Math.min(now - lastUpdateTime.current, 16); // Cap at 16ms (60fps)
    lastUpdateTime.current = now;
    
    // Lerp towards target position for smooth movement
    const lerpX = currentPosition.current.x + (targetPosition.current.x - currentPosition.current.x) * smoothingFactor;
    const lerpY = currentPosition.current.y + (targetPosition.current.y - currentPosition.current.y) * smoothingFactor;
    
    currentPosition.current = { x: lerpX, y: lerpY };
    
    // Apply transform with improved smoothing
    knobElement.style.transform = `translate(${lerpX}px, ${lerpY}px)`;
    knobElement.style.transition = 'none'; // Disable CSS transitions during dragging
    
    // Continue animation if we're still active and not at target
    if (joystickActive && (Math.abs(lerpX - targetPosition.current.x) > 0.1 || Math.abs(lerpY - targetPosition.current.y) > 0.1)) {
      animationFrameRef.current = requestAnimationFrame(smoothAnimate);
    } else {
      animationFrameRef.current = null;
    }
  };

  // Process joystick movement with enhanced physics and smoothing
  const processJoystickMovement = (clientX: number, clientY: number) => {
    if (!joystickActive || !dPadRef.current) return;
    
    // Calculate joystick displacement
    const deltaX = clientX - joystickStartPos.x;
    const deltaY = clientY - joystickStartPos.y;
    
    // Calculate distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Normalize if distance exceeds limit (with improved boundary)
    const maxDistance = joystickLimits.radius * 0.8; // Slightly larger range
    const limitedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    
    // Calculate limited position
    const limitedX = limitedDistance * Math.cos(angle);
    const limitedY = limitedDistance * Math.sin(angle);
    
    // Set target position for smooth animation
    targetPosition.current = { x: limitedX, y: limitedY };
    
    // Start smooth animation if not already running
    if (animationFrameRef.current === null) {
      lastUpdateTime.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(smoothAnimate);
    }
    
    // Visual feedback for active state
    const knobElement = dPadRef.current.querySelector('.joystick-knob') as HTMLElement;
    if (knobElement) {
      if (distance > maxDistance * 0.2) {
        knobElement.classList.add('active');
      } else {
        knobElement.classList.remove('active');
      }
    }
    
    // Determine active directions (with 8-way input and dead zone)
    const deadZone = maxDistance * 0.25;
    const newDirections = {
      up: deltaY < -deadZone,
      down: deltaY > deadZone,
      left: deltaX < -deadZone,
      right: deltaX > deadZone
    };
    
    // Throttle direction updates to reduce jitter
    const now = performance.now();
    if (now - lastUpdateTime.current > 50) { // Update directions max once per 50ms
      updateDirectionKeys(newDirections);
    }
  };

  // Update direction keys based on joystick position
  const updateDirectionKeys = (newDirections: typeof activeDirections) => {
    // Check each direction for changes
    Object.keys(newDirections).forEach(direction => {
      const directionKey = direction as keyof typeof activeDirections;
      if (newDirections[directionKey] !== activeDirections[directionKey]) {
        if (newDirections[directionKey]) {
          sendRemoteCommand(direction, true);
        } else {
          sendRemoteCommand(direction, false);
        }
      }
    });
    
    setActiveDirections(newDirections);
  };



  // Setup enhanced joystick events
  const setupJoystickEvents = () => {
    if (!dPadRef.current) return;
    
    const joystickContainer = dPadRef.current;
    const joystickKnob = joystickContainer.querySelector('.joystick-knob') as HTMLElement;
    
    if (!joystickKnob) return;
    
    // Variables to track if we've added event listeners
    let eventsAdded = false;
    
    const handleStart = (clientX: number, clientY: number, touchId?: number) => {
      if (joystickActive) return;
      
      setJoystickActive(true);
      setIsPressed(true);
      if (touchId !== undefined) setJoystickTouchId(touchId);
      
      initJoystick();
      processJoystickMovement(clientX, clientY);
    };
    
    const handleMove = (clientX: number, clientY: number, touchId?: number) => {
      if (!joystickActive) return;
      if (touchId !== undefined && touchId !== joystickTouchId) return;
      
      processJoystickMovement(clientX, clientY);
    };
    
    const handleEnd = (touchId?: number) => {
      if (!joystickActive) return;
      if (touchId !== undefined && touchId !== joystickTouchId) return;
      
      setJoystickActive(false);
      setIsPressed(false);
      setJoystickTouchId(null);
      resetJoystickPosition();
    };
    
    // Mouse events for desktop
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    };
    
    const onMouseMove = (e: MouseEvent) => {
      if (joystickActive) {
        handleMove(e.clientX, e.clientY);
      }
    };
    
    const onMouseUp = () => {
      if (joystickActive) {
        handleEnd();
      }
    };
    
    const onMouseLeave = () => {
      if (joystickActive) {
        handleEnd();
      }
    };
    
    // Touch events for mobile
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        handleStart(touch.clientX, touch.clientY, touch.identifier);
      }
    };
    
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        handleMove(touch.clientX, touch.clientY, touch.identifier);
      }
    };
    
    const onTouchEnd = (e: TouchEvent) => {
      if (joystickTouchId !== null) {
        let touchFound = false;
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === joystickTouchId) {
            touchFound = true;
            break;
          }
        }
        if (!touchFound) {
          handleEnd(joystickTouchId);
        }
      }
    };
    
    // Click event for center button
    const onClick = (e: MouseEvent) => {
      if (!joystickActive) {
        e.stopPropagation();
        sendRemoteCommand('ok');
      }
    };
    
    // Add event listeners to the joystick container
    joystickContainer.addEventListener('mousedown', onMouseDown);
    joystickContainer.addEventListener('touchstart', onTouchStart, { passive: false });
    
    // Add click event to the knob for OK button functionality
    joystickKnob.addEventListener('click', onClick);
    
    // Add global event listeners
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);
    
    eventsAdded = true;
    
    // Return cleanup function
    return () => {
      if (eventsAdded) {
        joystickContainer.removeEventListener('mousedown', onMouseDown);
        joystickContainer.removeEventListener('touchstart', onTouchStart);
        joystickKnob.removeEventListener('click', onClick);
        
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('mouseleave', onMouseLeave);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        document.removeEventListener('touchcancel', onTouchEnd);
      }
    };
  };

  // Initialize joystick on component mount
  useEffect(() => {
    if (remoteMode === 'joystick' && dPadRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initJoystick();
        const cleanup = setupJoystickEvents();
        
        // Return cleanup function
        return () => {
          if (cleanup) cleanup();
        };
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [remoteMode, joystickActive, joystickTouchId, joystickStartPos.x, joystickStartPos.y]);

  const getDirectionFromPosition = (x: number, y: number, centerX: number, centerY: number) => {
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Only register direction if dragged beyond a threshold
    if (distance < 20) return null;
    
    const angle = Math.atan2(deltaY, deltaX);
    const degree = (angle * 180) / Math.PI;
    
    // Convert to positive degrees
    const normalizedDegree = degree < 0 ? degree + 360 : degree;
    
    // Determine direction based on angle
    if (normalizedDegree >= 315 || normalizedDegree < 45) return 'right';
    if (normalizedDegree >= 45 && normalizedDegree < 135) return 'down';
    if (normalizedDegree >= 135 && normalizedDegree < 225) return 'left';
    if (normalizedDegree >= 225 && normalizedDegree < 315) return 'up';
    
    return null;
  };

  const startDragInterval = (direction: string) => {
    if (dragIntervalRef.current) clearInterval(dragIntervalRef.current);
    
    setActiveDirection(direction);
    sendRemoteCommand(direction);
    
    dragIntervalRef.current = setInterval(() => {
      sendRemoteCommand(direction);
    }, 150);
  };

  const stopDragInterval = () => {
    if (dragIntervalRef.current) {
      clearInterval(dragIntervalRef.current);
      dragIntervalRef.current = null;
    }
    setActiveDirection(null);
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dPadRef.current) return;
    
    setIsDragging(true);
    setIsPressed(true);
    
    const rect = dPadRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    e.preventDefault();
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !dPadRef.current) return;
    
    const rect = dPadRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const direction = getDirectionFromPosition(clientX, clientY, centerX, centerY);
    
    if (direction && direction !== dragDirection) {
      stopDragInterval();
      setDragDirection(direction);
      startDragInterval(direction);
    } else if (!direction && dragDirection) {
      stopDragInterval();
      setDragDirection(null);
    }
    
    setDragPosition({ x: clientX - centerX, y: clientY - centerY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsPressed(false);
    setDragDirection(null);
    setDragPosition({ x: 0, y: 0 });
    stopDragInterval();
  };

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging) handleDragMove(e as any);
    };

    const handleGlobalEnd = () => {
      if (isDragging) handleDragEnd();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMove);
      document.addEventListener('mouseup', handleGlobalEnd);
      document.addEventListener('touchmove', handleGlobalMove);
      document.addEventListener('touchend', handleGlobalEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMove);
        document.removeEventListener('mouseup', handleGlobalEnd);
        document.removeEventListener('touchmove', handleGlobalMove);
        document.removeEventListener('touchend', handleGlobalEnd);
      };
    }
  }, [isDragging]);

  const handleTouchpadInteraction = (e: React.TouchEvent | React.MouseEvent) => {
    // Basic touchpad simulation
    sendRemoteCommand('touchpad_tap', { x: 50, y: 50 });
  };

  const handleKeyboardSubmit = () => {
    if (keyboardInput.trim()) {
      sendRemoteCommand('keyboard_input', keyboardInput.trim());
      setKeyboardInput('');
      setShowKeyboard(false);
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return VolumeX;
    if (volume < 50) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  return (
    <div className="min-h-screen bg-black">
      {/* Render header controls in the remote header container */}
      {renderHeaderControls()}
      
      <SettingsPanel isOpen={isSettingsPanelOpen} onClose={() => setIsSettingsPanelOpen(false)} />
      
      {/* Main Content Container - More compact layout with reduced top spacing */}
      <main className="pt-6 max-w-7xl mx-auto px-6 py-1 pb-4">
        <div className="flex items-center justify-center min-h-[calc(100vh-6rem)] relative">
          
          {/* Floating Vertical Remote Mode Picker - Anchored to top button group */}
          <div className="absolute right-4 z-10" style={{ top: '90px' }}>
            <div className="bg-gray-800/50 rounded-full p-1 border border-gray-700/50 flex flex-col gap-1" style={{ width: '36px' }}>
              <button
                onClick={() => setRemoteMode('standard')}
                className={`p-1.5 rounded-full transition-colors ${
                  remoteMode === 'standard' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
                aria-label="Standard Remote"
                title="Standard Remote"
              >
                <Tv className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRemoteMode('touchpad')}
                className={`p-1.5 rounded-full transition-colors ${
                  remoteMode === 'touchpad' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
                aria-label="Touchpad Mode"
                title="Touchpad Mode"
              >
                <Square className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRemoteMode('joystick')}
                className={`p-1.5 rounded-full transition-colors ${
                  remoteMode === 'joystick' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
                aria-label="Joystick Mode"
                title="Joystick Mode"
              >
                <Gamepad2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {remoteMode === 'standard' && (
            <div className="max-w-sm mx-auto w-full space-y-2">
            
            {/* Navigation and Volume Controls Group with Floating Mode Picker */}
            <div className="relative space-y-2">
              {/* Back and Home buttons */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => sendRemoteCommand('back')}
                  className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border border-gray-700/50"
                  style={{ 
                    width: '48px', 
                    height: '48px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                  }}
                  aria-label="Back"
                >
                  <ChevronLeft className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => sendRemoteCommand('home')}
                  className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border border-gray-700/50"
                  style={{ 
                    width: '48px', 
                    height: '48px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                  }}
                  aria-label="Home"
                >
                  <Home className="w-5 h-5 mx-auto" />
                </button>
              </div>

              {/* Volume controls */}
              <div className="flex justify-center gap-2.5">
                <button
                  onClick={() => sendRemoteCommand('mute')}
                  className={`p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border ${
                    isMuted ? 'bg-red-600/90 hover:bg-red-700/90 border-red-500/50' : 'bg-gray-800/90 hover:bg-gray-700/90 border-gray-700/50'
                  } text-white`}
                  style={{ 
                    width: '48px', 
                    height: '48px',
                    boxShadow: isMuted 
                      ? '0 4px 12px rgba(239, 68, 68, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                      : '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                  }}
                  aria-label="Mute"
                >
                  <VolumeX className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => sendRemoteCommand('volume_down')}
                  className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border border-gray-700/50"
                  style={{ 
                    width: '48px', 
                    height: '48px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                  }}
                  aria-label="Volume Down"
                >
                  <Volume1 className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => sendRemoteCommand('volume_up')}
                  className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border border-gray-700/50"
                  style={{ 
                    width: '48px', 
                    height: '48px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                  }}
                  aria-label="Volume Up"
                >
                  <Volume2 className="w-5 h-5 mx-auto" />
                </button>
              </div>


            </div>

            {/* 3D Joystick D-Pad Navigation - Redesigned */}
            <div className="flex justify-center py-2">
              <div 
                ref={dPadRef}
                className="relative select-none"
                style={{ width: '180px', height: '180px' }}
              >
                {/* D-Pad Arrow Buttons - Styled consistently with other buttons */}
                {/* Up Arrow Button */}
                <button
                  onClick={() => sendRemoteCommand('up')}
                  className="absolute bg-gray-800/90 hover:bg-gray-700/90 text-white transition-all duration-200 active:scale-95 flex items-center justify-center shadow-lg border border-gray-700/50"
                  style={{ 
                    width: '48px', 
                    height: '48px',
                    top: '0px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderRadius: '50%',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                  }}
                  aria-label="Up"
                >
                  <ChevronUp className="w-6 h-6" />
                </button>
                
                {/* Left Arrow Button */}
                <button
                  onClick={() => sendRemoteCommand('left')}
                  className="absolute bg-gray-800/90 hover:bg-gray-700/90 text-white transition-all duration-200 active:scale-95 flex items-center justify-center shadow-lg border border-gray-700/50"
                  style={{ 
                    width: '48px', 
                    height: '48px',
                    top: '50%',
                    left: '0px',
                    transform: 'translateY(-50%)',
                    borderRadius: '50%',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                  }}
                  aria-label="Left"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                {/* Right Arrow Button */}
                <button
                  onClick={() => sendRemoteCommand('right')}
                  className="absolute bg-gray-800/90 hover:bg-gray-700/90 text-white transition-all duration-200 active:scale-95 flex items-center justify-center shadow-lg border border-gray-700/50"
                  style={{ 
                    width: '48px', 
                    height: '48px',
                    top: '50%',
                    right: '0px',
                    transform: 'translateY(-50%)',
                    borderRadius: '50%',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                  }}
                  aria-label="Right"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                
                {/* Down Arrow Button */}
                <button
                  onClick={() => sendRemoteCommand('down')}
                  className="absolute bg-gray-800/90 hover:bg-gray-700/90 text-white transition-all duration-200 active:scale-95 flex items-center justify-center shadow-lg border border-gray-700/50"
                  style={{ 
                    width: '48px', 
                    height: '48px',
                    bottom: '0px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderRadius: '50%',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                  }}
                  aria-label="Down"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
                
                {/* 3D Joystick Center OK Button - Purple with enhanced 3D effect */}
                <div
                  className={`absolute cursor-grab active:cursor-grabbing transition-all duration-300 flex items-center justify-center select-none ${
                    isDragging || isPressed
                      ? 'scale-95' 
                      : 'hover:scale-105'
                  } text-white font-bold shadow-2xl`}
                  style={{ 
                    width: '56px', 
                    height: '56px',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) ${isDragging ? 'translateZ(-4px)' : 'translateZ(0px)'}`,
                    borderRadius: '50%',
                    background: isDragging || isPressed
                      ? 'linear-gradient(145deg, #7c3aed, #6b21a8, #581c87)'
                      : 'linear-gradient(145deg, #8b5cf6, #7c3aed, #6b21a8)',
                    boxShadow: isDragging || isPressed
                      ? '0 4px 16px rgba(139, 92, 246, 0.6), inset 0 -3px 6px rgba(88, 28, 135, 0.8), inset 0 1px 3px rgba(255, 255, 255, 0.3)'
                      : '0 8px 24px rgba(139, 92, 246, 0.5), 0 4px 12px rgba(139, 92, 246, 0.3), inset 0 -4px 8px rgba(107, 33, 168, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.4)',
                    border: '3px solid rgba(139, 92, 246, 0.8)',
                    animation: 'none',
                  }}
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  onClick={() => !isDragging && sendRemoteCommand('ok')}
                  aria-label="OK - 3D Joystick"
                >
                  <span className="text-sm font-bold drop-shadow-lg">OK</span>
                  
                  {/* Add subtle highlight ring for 3D effect */}
                  <div 
                    className="absolute inset-1 rounded-full opacity-30 pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, transparent 50%, rgba(0, 0, 0, 0.2) 100%)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Function Buttons Group - More compact */}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => sendRemoteCommand('rewind')}
                className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border border-gray-700/50"
                style={{ 
                  width: '50px', 
                  height: '50px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                }}
                aria-label="Rewind"
              >
                <RotateCcw className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => sendRemoteCommand('hdmi')}
                className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border border-gray-700/50"
                style={{ 
                  width: '50px', 
                  height: '50px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                }}
                aria-label="HDMI"
              >
                <Hdmi className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => sendRemoteCommand('asterisk')}
                className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border border-gray-700/50"
                style={{ 
                  width: '50px', 
                  height: '50px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                }}
                aria-label="Options"
              >
                <Asterisk className="w-5 h-5 mx-auto" />
              </button>
            </div>

            {/* Media Controls Group - More compact */}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => sendRemoteCommand('rewind')}
                className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border border-gray-700/50"
                style={{ 
                  width: '50px', 
                  height: '50px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                }}
                aria-label="Previous"
              >
                <SkipBack className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => sendRemoteCommand('play_pause')}
                className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border border-gray-700/50"
                style={{ 
                  width: '50px', 
                  height: '50px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                }}
                aria-label="Play/Pause"
              >
                {isPlaying ? <Pause className="w-5 h-5 mx-auto" /> : <Play className="w-5 h-5 mx-auto" />}
              </button>
              <button
                onClick={() => sendRemoteCommand('fast_forward')}
                className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border border-gray-700/50"
                style={{ 
                  width: '50px', 
                  height: '50px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                }}
                aria-label="Next"
              >
                <SkipForward className="w-5 h-5 mx-auto" />
              </button>
            </div>

            {/* Touchpad, Keyboard, Apps Buttons - More compact */}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowTouchpad(true)}
                className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 flex items-center justify-center shadow-lg border border-gray-700/50"
                style={{
                  width: '50px',
                  height: '50px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                }}
                aria-label="Touchpad"
              >
                <div className="w-4 h-3 bg-white rounded-sm" />
              </button>
              <button
                onClick={() => setShowKeyboard(true)}
                className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 flex items-center justify-center shadow-lg border border-gray-700/50"
                style={{
                  width: '50px',
                  height: '50px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                }}
                aria-label="Keyboard"
              >
                <Keyboard className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowApps(true)}
                className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 flex items-center justify-center shadow-lg border border-gray-700/50"
                style={{
                  width: '50px',
                  height: '50px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                }}
                aria-label="Apps"
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
            </div>
          </div>
          )}

          {/* Touchpad Mode */}
          {remoteMode === 'touchpad' && (
            <div className="max-w-sm mx-auto w-full mt-20">
              {/* Section 1: Top button group - Back and Home */}
              <div className="flex justify-center gap-3 mb-3">
                <button
                  onClick={() => sendRemoteCommand('back')}
                  className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border border-gray-700/50"
                  style={{
                    width: '48px',
                    height: '48px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                  }}
                  aria-label="Back"
                >
                  <ChevronLeft className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => sendRemoteCommand('home')}
                  className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border border-gray-700/50"
                  style={{
                    width: '48px',
                    height: '48px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                  }}
                  aria-label="Home"
                >
                  <Home className="w-5 h-5 mx-auto" />
                </button>
              </div>

              {/* Section 2: Large touchpad area - Takes up majority of interface */}
              <div
                className="bg-gray-700/50 rounded-xl cursor-pointer select-none border-2 border-gray-600/30 hover:border-gray-500/50 transition-colors mb-3"
                style={{ aspectRatio: '4/3', minHeight: '200px' }}
                onMouseDown={handleTouchpadInteraction}
                onTouchStart={handleTouchpadInteraction}
              >
              </div>

              {/* Section 3: Bottom button group - Mute, Keyboard, Apps */}
              <div className="flex justify-center gap-2.5 mb-2">
                <button
                  onClick={() => sendRemoteCommand('mute')}
                  className={`p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border ${
                    isMuted ? 'bg-red-600/90 hover:bg-red-700/90 border-red-500/50' : 'bg-gray-800/90 hover:bg-gray-700/90 border-gray-700/50'
                  } text-white`}
                  style={{
                    width: '48px',
                    height: '48px',
                    boxShadow: isMuted 
                      ? '0 4px 12px rgba(239, 68, 68, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                      : '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                  }}
                  aria-label="Mute"
                >
                  <VolumeX className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => setShowKeyboard(true)}
                  className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border border-gray-700/50"
                  style={{
                    width: '48px',
                    height: '48px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                  }}
                  aria-label="Keyboard"
                >
                  <Keyboard className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => setShowApps(true)}
                  className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border border-gray-700/50"
                  style={{
                    width: '48px',
                    height: '48px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                  }}
                  aria-label="Apps"
                >
                  <Grid3X3 className="w-5 h-5 mx-auto" />
                </button>
              </div>

              {/* Section 4: Footer text - Smaller and single line */}
              <div className="text-center">
                <p className="text-xs text-gray-400">Swipe and tap with one finger to select content on your TV</p>
              </div>
            </div>
          )}

          {/* Joystick Mode */}
          {remoteMode === 'joystick' && (
            <div className="max-w-sm mx-auto w-full">
              {/* Single large joystick with essential buttons */}
              <div className="space-y-6">
                {/* Enhanced central joystick with physics */}
                <div className="flex justify-center">
                  <div 
                    ref={dPadRef}
                    className="relative select-none joystick-container"
                    style={{ width: '220px', height: '220px' }}
                  >
                    {/* Enhanced Joystick base with concentric rings */}
                    <div className="absolute inset-0 bg-gray-800/90 rounded-full border-4 border-gray-700/50 shadow-2xl">
                      <div className="absolute inset-4 bg-gray-700/50 rounded-full shadow-inner">
                        <div className="absolute inset-2 bg-gray-600/30 rounded-full shadow-inner"></div>
                      </div>
                    </div>

                    {/* Central movable joystick knob */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className={`joystick-knob relative flex items-center justify-center text-white font-bold rounded-full cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
                          joystickActive || isPressed
                            ? 'scale-95 active' 
                            : 'hover:scale-105'
                        }`}
                        style={{
                          width: '90px',
                          height: '90px',
                          background: joystickActive || isPressed
                            ? 'linear-gradient(145deg, #7c3aed, #6b21a8, #581c87)'
                            : 'linear-gradient(145deg, #8b5cf6, #7c3aed, #6b21a8)',
                          boxShadow: joystickActive || isPressed
                            ? '0 4px 16px rgba(139, 92, 246, 0.8), inset 0 -2px 4px rgba(88, 28, 135, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
                            : '0 8px 24px rgba(139, 92, 246, 0.5), 0 4px 12px rgba(139, 92, 246, 0.3), inset 0 -4px 8px rgba(107, 33, 168, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
                          animation: 'none',
                          border: 'none', // Explicitly remove any border
                        }}
                        aria-label="OK - Enhanced Joystick"
                      >
                        <span className="text-xl font-bold drop-shadow-lg pointer-events-none">OK</span>
                        
                        {/* Enhanced highlight ring for 3D effect */}
                        <div 
                          className="absolute inset-1 rounded-full opacity-30 pointer-events-none"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, transparent 50%, rgba(0, 0, 0, 0.2) 100%)'
                          }}
                        />
                        
                        {/* Active state indicator */}
                        {joystickActive && (
                          <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping pointer-events-none" />
                        )}
                      </div>
                    </div>

                    {/* Directional indicators around the joystick */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-gray-400">
                        <ChevronUp className="w-6 h-6" />
                      </div>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gray-400">
                        <ChevronDown className="w-6 h-6" />
                      </div>
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <ChevronLeft className="w-6 h-6" />
                      </div>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <ChevronRight className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Essential buttons below joystick */}
                <div className="space-y-4">
                  {/* First row: Back and Home buttons */}
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => sendRemoteCommand('back')}
                      className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border border-gray-700/50"
                      style={{
                        width: '48px',
                        height: '48px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                      }}
                      aria-label="Back"
                    >
                      <ChevronLeft className="w-5 h-5 mx-auto" />
                    </button>
                    <button
                      onClick={() => sendRemoteCommand('home')}
                      className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border border-gray-700/50"
                      style={{
                        width: '48px',
                        height: '48px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                      }}
                      aria-label="Home"
                    >
                      <Home className="w-5 h-5 mx-auto" />
                    </button>
                  </div>
                  
                  {/* Second row: Mute, Keyboard, and Grid3x3 buttons */}
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => sendRemoteCommand('mute')}
                      className={`p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border ${
                        isMuted ? 'bg-red-600/90 hover:bg-red-700/90 border-red-500/50' : 'bg-gray-800/90 hover:bg-gray-700/90 border-gray-700/50'
                      } text-white`}
                      style={{
                        width: '48px',
                        height: '48px',
                        boxShadow: isMuted 
                          ? '0 4px 12px rgba(239, 68, 68, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                          : '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                      }}
                      aria-label="Mute"
                    >
                      <VolumeX className="w-5 h-5 mx-auto" />
                    </button>
                    <button
                      onClick={() => setShowKeyboard(true)}
                      className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border border-gray-700/50"
                      style={{
                        width: '48px',
                        height: '48px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                      }}
                      aria-label="Keyboard"
                    >
                      <Keyboard className="w-5 h-5 mx-auto" />
                    </button>
                    <button
                      onClick={() => setShowApps(true)}
                      className="bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg border border-gray-700/50"
                      style={{
                        width: '48px',
                        height: '48px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                      }}
                      aria-label="Apps"
                    >
                      <Grid3X3 className="w-5 h-5 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Touchpad Modal */}
      {showTouchpad && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">TV Touchpad</h3>
              <button
                onClick={() => setShowTouchpad(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div
              className="bg-gray-700 rounded-lg aspect-video cursor-pointer select-none flex items-center justify-center"
              onMouseDown={handleTouchpadInteraction}
              onTouchStart={handleTouchpadInteraction}
            >
              <div className="text-gray-400 text-center">
                <MousePointer className="w-12 h-12 mx-auto mb-2" />
                <p>Tap or swipe to control your TV</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Modal */}
      {showKeyboard && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">TV Keyboard</h3>
              <button
                onClick={() => setShowKeyboard(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={keyboardInput}
                onChange={(e) => setKeyboardInput(e.target.value)}
                placeholder="Type your input..."
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleKeyboardSubmit();
                  }
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowKeyboard(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleKeyboardSubmit}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications Modal */}
      {showApps && (
        <div 
          className="fixed inset-0 z-[110] transition-all duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowApps(false);
            }
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black" />
          
          {/* Applications Panel */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div 
              className="w-full max-w-sm max-h-[70vh] rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden transform transition-all duration-300 scale-100 bg-black"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-black">
                <h3 className="text-lg font-semibold text-white">Applications</h3>
                <button
                  onClick={() => setShowApps(false)}
                  className="p-1.5 hover:bg-gray-700/50 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              {/* Apps Grid */}
              <div className="p-4 overflow-y-auto">
                <div className="grid grid-cols-3 gap-3">
                  {installedApps.filter(app => app.isInstalled).map(app => {
                    const getAppLogo = (appId: string) => {
                      // Map app IDs to service IDs  
                      const serviceMap: { [key: string]: string } = {
                        'netflix': 'netflix',
                        'disney': 'disney',
                        'hulu': 'hulu',
                        'prime': 'prime',
                        'hbo': 'max',
                        'apple': 'apple',
                        'peacock': 'peacock',
                        'paramount': 'paramount'
                      };
                      
                      const serviceId = serviceMap[appId];
                      
                      if (serviceId) {
                        return (
                          <div className="relative">
                            <img 
                              src={`/src/assets/images/logos/${serviceId === 'prime' ? 'prime-video' : serviceId === 'disney' ? 'disney-plus' : serviceId === 'paramount' ? 'paramount-plus' : serviceId === 'apple' ? 'apple-tv' : serviceId}/logo.${serviceId === 'netflix' ? 'ico' : serviceId === 'paramount' ? 'jpg' : 'png'}`}
                              alt={app.name}
                              className="w-12 h-12 rounded-lg object-cover"
                              onError={(e) => {
                                // Fallback to emoji icon if local logo fails
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center hidden">
                              <span className="text-white text-lg">
                                {serviceId === 'netflix' ? '🔴' : 
                                 serviceId === 'disney' ? '🏰' : 
                                 serviceId === 'hulu' ? '💚' : 
                                 serviceId === 'prime' ? '📦' : 
                                 serviceId === 'max' ? '👑' : 
                                 serviceId === 'apple' ? '🍎' : 
                                 serviceId === 'peacock' ? '🦚' : 
                                 serviceId === 'paramount' ? '⭐' : '📱'}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Custom icons for other apps
                      switch (appId) {
                        case 'youtube':
                          return (
                            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                              </svg>
                            </div>
                          );
                        case 'spotify':
                          return (
                            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
                                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.299z"/>
                              </svg>
                            </div>
                          );
                        default:
                          return (
                            <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-lg">📱</span>
                            </div>
                          );
                      }
                    };

                    return (
                      <button
                        key={app.id}
                        onClick={() => {
                          // Smooth dismissal animation
                          const modal = document.querySelector('[data-modal="applications"]') as HTMLElement;
                          if (modal) {
                            modal.style.opacity = '0';
                            modal.style.transform = 'scale(0.95)';
                            setTimeout(() => {
                              sendRemoteCommand('launch_app', app.name);
                              setShowApps(false);
                            }, 150);
                          } else {
                            sendRemoteCommand('launch_app', app.name);
                            setShowApps(false);
                          }
                        }}
                        className="p-3 rounded-lg transition-all duration-200 flex flex-col items-center gap-2 bg-gray-800/50 hover:bg-gray-700/70 text-white border border-gray-700/30 hover:border-gray-600/50 group active:scale-95"
                      >
                        <div className="group-hover:scale-110 transition-transform duration-200">
                          {getAppLogo(app.id)}
                        </div>
                        <span className="text-xs text-center font-medium group-hover:text-gray-100 transition-colors leading-tight">{app.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemoteContent;