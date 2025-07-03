import { useState, useRef, useCallback, useEffect } from 'react';
import { smartTVService, type SmartTV } from '../services/smartTVService';
import { handleAsyncError } from '../services/errorHandler';

interface App {
  id: string;
  name: string;
  icon: string;
  isInstalled: boolean;
}

// Main remote control state management hook
export const useRemoteControlState = () => {
  // Core remote state
  const [selectedTV, setSelectedTV] = useState<SmartTV | null>(null);
  const [showTVSelector, setShowTVSelector] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [lastCommandStatus, setLastCommandStatus] = useState<'success' | 'error' | 'pending' | null>(null);
  const [isShowingError, setIsShowingError] = useState(false);

  // Remote mode and interface state
  const [remoteMode, setRemoteMode] = useState('standard');
  const [showTouchpad, setShowTouchpad] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showApps, setShowApps] = useState(false);
  const [keyboardInput, setKeyboardInput] = useState('');

  // Media control state
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isPoweredOn, setIsPoweredOn] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const resetRemoteState = useCallback(() => {
    setRemoteMode('standard');
    setShowTouchpad(false);
    setShowKeyboard(false);
    setShowApps(false);
    setKeyboardInput('');
    setVolume(50);
    setIsMuted(false);
    setIsPlaying(false);
  }, []);

  return {
    // Core TV state
    selectedTV,
    setSelectedTV,
    showTVSelector,
    setShowTVSelector,
    isScanning,
    setIsScanning,
    connectionStatus,
    setConnectionStatus,
    lastCommandStatus,
    setLastCommandStatus,
    isShowingError,
    setIsShowingError,

    // Interface state
    remoteMode,
    setRemoteMode,
    showTouchpad,
    setShowTouchpad,
    showKeyboard,
    setShowKeyboard,
    showApps,
    setShowApps,
    keyboardInput,
    setKeyboardInput,

    // Media state
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    isPoweredOn,
    setIsPoweredOn,
    isPlaying,
    setIsPlaying,

    // Utilities
    resetRemoteState
  };
};

// Advanced joystick state management hook
export const useJoystickState = () => {
  // Basic joystick state
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [activeDirection, setActiveDirection] = useState<string | null>(null);

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

  // Refs for smooth animation
  const dPadRef = useRef<HTMLDivElement>(null);
  const dragIntervalRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const targetPosition = useRef({ x: 0, y: 0 });
  const currentPosition = useRef({ x: 0, y: 0 });
  const smoothingFactor = 0.15;

  const resetJoystickPosition = useCallback(() => {
    setJoystickCurrentPos({ x: 0, y: 0 });
    setDragPosition({ x: 0, y: 0 });
    setActiveDirection(null);
    setDragDirection(null);
    setActiveDirections({
      up: false,
      down: false,
      left: false,
      right: false
    });
    
    targetPosition.current = { x: 0, y: 0 };
    currentPosition.current = { x: 0, y: 0 };
  }, []);

  const initJoystick = useCallback(() => {
    const element = dPadRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const radius = Math.min(rect.width, rect.height) / 2 - 20;
    
    setJoystickLimits({ radius });
    setJoystickStartPos({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    });
  }, []);

  // Enhanced direction detection
  const getDirectionFromPosition = useCallback((x: number, y: number, centerX: number, centerY: number) => {
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance < 15) return null;
    
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    const normalizedAngle = ((angle + 360) % 360);
    
    if (normalizedAngle >= 315 || normalizedAngle < 45) return 'right';
    if (normalizedAngle >= 45 && normalizedAngle < 135) return 'down';
    if (normalizedAngle >= 135 && normalizedAngle < 225) return 'left';
    if (normalizedAngle >= 225 && normalizedAngle < 315) return 'up';
    
    return null;
  }, []);

  const updateDirectionKeys = useCallback((newDirections: typeof activeDirections) => {
    setActiveDirections(newDirections);
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (dragIntervalRef.current) {
        clearInterval(dragIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    // Basic state
    isDragging,
    setIsDragging,
    dragDirection,
    setDragDirection,
    dragPosition,
    setDragPosition,
    activeDirection,
    setActiveDirection,

    // Advanced state
    joystickActive,
    setJoystickActive,
    joystickTouchId,
    setJoystickTouchId,
    joystickStartPos,
    setJoystickStartPos,
    joystickCurrentPos,
    setJoystickCurrentPos,
    joystickLimits,
    setJoystickLimits,
    activeDirections,
    setActiveDirections,

    // Refs
    dPadRef,
    dragIntervalRef,
    animationFrameRef,
    lastUpdateTime,
    targetPosition,
    currentPosition,
    smoothingFactor,

    // Utilities
    resetJoystickPosition,
    initJoystick,
    getDirectionFromPosition,
    updateDirectionKeys
  };
};

// TV management and connection state hook
export const useTVManagement = () => {
  const [availableTVs, setAvailableTVs] = useState<SmartTV[]>([
    {
      id: 'user-smart-tv',
      name: 'My Smart TV',
      brand: 'Roku',
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
      lastSeen: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: 'samsung-bedroom',
      name: 'Samsung Bedroom',
      brand: 'Samsung',
      model: 'QN65Q80A',
      ipAddress: '192.168.1.108',
      isConnected: false,
      lastSeen: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: 'lg-kitchen',
      name: 'LG Kitchen',
      brand: 'LG',
      model: 'OLED55C1',
      ipAddress: '192.168.1.112',
      isConnected: false,
      lastSeen: new Date(Date.now() - 300000).toISOString()
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

  const testTVConnection = useCallback(async (tv: SmartTV) => {
    try {
      const result = await smartTVService.testConnection(tv);
      return result;
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'testTVConnection',
        tvId: tv.id,
        tvName: tv.name
      });
      return false;
    }
  }, []);

  const scanForTVs = useCallback(async () => {
    try {
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
      
      return true;
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'scanForTVs'
      });
      return false;
    }
  }, []);

  const sendRemoteCommand = useCallback(async (
    tv: SmartTV | null,
    command: string,
    value?: any,
    isPressed: boolean = true
  ) => {
    if (!tv) {
      handleAsyncError(new Error('No TV selected'), {
        operation: 'sendRemoteCommand',
        command
      });
      return { success: false, error: 'No TV selected' };
    }

    try {
      const result = await smartTVService.sendCommand(tv, command, value);
      return result;
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'sendRemoteCommand',
        command,
        tvId: tv.id
      });
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, []);

  return {
    availableTVs,
    setAvailableTVs,
    installedApps,
    testTVConnection,
    scanForTVs,
    sendRemoteCommand
  };
};

// Fix any type by using proper interface
interface TouchPosition {
  x: number;
  y: number;
}

// Remove unused isPressed variable
const handleTouch = (pos: TouchPosition) => {
  // Handle touch position
}; 