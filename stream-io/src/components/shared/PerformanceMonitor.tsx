import React, { useState, useEffect } from 'react';
import { Activity, Monitor, Zap, Database, X, ChevronDown, ChevronUp } from 'lucide-react';
import { usePerformanceMonitor } from '../../services/performanceOptimizer';

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface MetricData {
  value: number;
  timestamp: number;
  type: string;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = import.meta.env.DEV,
  position = 'bottom-right'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { cacheStats, clearCache } = usePerformanceMonitor();
  const [performanceMetrics, setPerformanceMetrics] = useState({
    memory: 0,
    timing: {
      domContentLoaded: 0,
      loadComplete: 0,
      firstPaint: 0,
      firstContentfulPaint: 0
    }
  });

  // Get performance metrics
  useEffect(() => {
    if (!enabled) return;

    const updateMetrics = () => {
      // Memory usage (if available)
      const memory = (performance as any).memory;
      if (memory) {
        setPerformanceMetrics(prev => ({
          ...prev,
          memory: Math.round(memory.usedJSHeapSize / 1024 / 1024)
        }));
      }

      // Performance timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        setPerformanceMetrics(prev => ({
          ...prev,
          timing: {
            domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
            loadComplete: Math.round(navigation.loadEventEnd - navigation.fetchStart),
            firstPaint: 0,
            firstContentfulPaint: 0
          }
        }));
      }

      // Paint timing
      const paintEntries = performance.getEntriesByType('paint');
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
      const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      
      if (firstPaint || firstContentfulPaint) {
        setPerformanceMetrics(prev => ({
          ...prev,
          timing: {
            ...prev.timing,
            firstPaint: firstPaint ? Math.round(firstPaint.startTime) : 0,
            firstContentfulPaint: firstContentfulPaint ? Math.round(firstContentfulPaint.startTime) : 0
          }
        }));
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {!isVisible ? (
        <button
          onClick={() => setIsVisible(true)}
          className="bg-purple-600/80 backdrop-blur-sm text-white p-2 rounded-full shadow-lg hover:bg-purple-500/80 transition-colors"
          title="Show Performance Monitor"
        >
          <Activity className="w-5 h-5" />
        </button>
      ) : (
        <div className="bg-black/90 backdrop-blur-sm text-white rounded-lg shadow-xl border border-purple-500/30 max-w-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-purple-500/30">
            <div className="flex items-center space-x-2">
              <Monitor className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">Performance</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-purple-500/20 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 hover:bg-red-500/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 space-y-3">
            {/* Cache Stats */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Database className="w-4 h-4 text-green-400" />
                <span className="text-xs font-medium">Cache</span>
              </div>
              <div className="text-xs space-y-1 text-gray-300">
                <div className="flex justify-between">
                  <span>Total Entries:</span>
                  <span className="text-green-400">{cacheStats.totalEntries}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valid:</span>
                  <span className="text-green-400">{cacheStats.validEntries}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expired:</span>
                  <span className="text-yellow-400">{cacheStats.expiredEntries}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <span className="text-blue-400">{cacheStats.pendingRequests}</span>
                </div>
              </div>
            </div>

            {isExpanded && (
              <>
                {/* Memory Usage */}
                {performanceMetrics.memory > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs font-medium">Memory</span>
                    </div>
                    <div className="text-xs text-gray-300">
                      <div className="flex justify-between">
                        <span>Used:</span>
                        <span className={`${performanceMetrics.memory > 50 ? 'text-red-400' : performanceMetrics.memory > 25 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {performanceMetrics.memory} MB
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance Timing */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium">Timing</span>
                  </div>
                  <div className="text-xs space-y-1 text-gray-300">
                    {performanceMetrics.timing.firstPaint > 0 && (
                      <div className="flex justify-between">
                        <span>First Paint:</span>
                        <span className="text-blue-400">{performanceMetrics.timing.firstPaint}ms</span>
                      </div>
                    )}
                    {performanceMetrics.timing.firstContentfulPaint > 0 && (
                      <div className="flex justify-between">
                        <span>FCP:</span>
                        <span className="text-blue-400">{performanceMetrics.timing.firstContentfulPaint}ms</span>
                      </div>
                    )}
                    {performanceMetrics.timing.domContentLoaded > 0 && (
                      <div className="flex justify-between">
                        <span>DOM Ready:</span>
                        <span className="text-blue-400">{performanceMetrics.timing.domContentLoaded}ms</span>
                      </div>
                    )}
                    {performanceMetrics.timing.loadComplete > 0 && (
                      <div className="flex justify-between">
                        <span>Load Complete:</span>
                        <span className="text-blue-400">{performanceMetrics.timing.loadComplete}ms</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-purple-500/30">
              <button
                onClick={clearCache}
                className="w-full text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 py-1 px-2 rounded transition-colors"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor; 